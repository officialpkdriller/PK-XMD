"use strict";
/**
 * lib/groq.js - the single Groq caller used by the chatbot and every AI command.
 *
 *  - Uses the keys from keys.js one at a time; when a key dies it moves on to the next one.
 *  - Models are configurable with env vars (AI_MODEL_FAST, AI_MODEL_SMART, AI_MODEL_VISION,
 *    AI_MODEL_STT) so a future Groq deprecation never needs a code change.
 *  - If every configured model is rejected (e.g. decommissioned), it asks Groq which models
 *    are active right now and tries those automatically.
 *  - Reasoning models (openai/gpt-oss-*, qwen/qwen3*) get the correct reasoning parameters
 *    so their hidden "thinking" does not eat the whole answer budget.
 */
const keys = require("../keys");

const BASE = "https://api.groq.com/openai/v1";
const CHAT_URL = BASE + "/chat/completions";
const STT_URL = BASE + "/audio/transcriptions";
const MODELS_URL = BASE + "/models";

// ---------------------------------------------------------------------
// Model configuration (Groq retired the llama-3.x text models on 2026-08-16)
// ---------------------------------------------------------------------
const MODELS = {
  fast: process.env.AI_MODEL_FAST || "openai/gpt-oss-20b",
  smart: process.env.AI_MODEL_SMART || "openai/gpt-oss-120b",
  vision: process.env.AI_MODEL_VISION || "qwen/qwen3.8-27b",
  stt: process.env.AI_MODEL_STT || "whisper-large-v3-turbo",
};

function uniq(list) { return list.filter((m, i) => m && list.indexOf(m) === i); }

/** Quick everyday replies (chatbot, .gpt, .groq ...). */
function fastModels() { return uniq([MODELS.fast, MODELS.smart, "qwen/qwen3.8-27b"]); }
/** Heavier tasks (code, long answers). */
function smartModels() { return uniq([MODELS.smart, MODELS.fast, "qwen/qwen3.8-27b"]); }
/** Image understanding (needs a multimodal model). */
function visionModels() { return uniq([MODELS.vision, "qwen/qwen3.8-27b"]); }
/** Speech to text. */
function sttModels() { return uniq([MODELS.stt, "whisper-large-v3", "whisper-large-v3-turbo"]); }

class GroqError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code || "GROQ_ERROR";
    this.status = status || 0;
  }
}

function hasKeys() {
  return keys.GROQ_API_KEYS.length > 0;
}

// ---------------------------------------------------------------------
// Low-level request with key rotation
// ---------------------------------------------------------------------
async function _request(url, buildInit, timeoutMs) {
  const order = keys.getGroqKeyOrder();
  if (!order.length) {
    throw new GroqError("No GROQ key set. Add your API keys to keys.js.", "NO_KEYS");
  }
  let lastErr = null;
  for (const key of order) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...buildInit(key), signal: ctl.signal });
      clearTimeout(timer);
      if (res.ok) {
        keys.markKeyOk(key);
        return res;
      }
      const status = res.status;
      let body = "";
      try { body = (await res.text()).slice(0, 400); } catch {}
      // Key / rate limit / server problems -> try the next key
      if (status === 401 || status === 403 || status === 429 || status >= 500) {
        keys.markKeyFailed(key, status, res.headers.get("retry-after"));
        lastErr = new GroqError(`HTTP ${status} ${body}`, "KEY_FAILED", status);
        continue;
      }
      // 400/404 etc. (bad model / bad request) - not the key's fault
      throw new GroqError(`HTTP ${status} ${body}`, "BAD_REQUEST", status);
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof GroqError) {
        if (e.code === "BAD_REQUEST") throw e;
        lastErr = e;
        continue;
      }
      // timeout / network error -> rest the key briefly, try the next one
      keys.markKeyFailed(key, 0);
      lastErr = new GroqError(e.name === "AbortError" ? "Timeout" : (e.message || "network error"), "NETWORK");
    }
  }
  throw new GroqError(
    "All GROQ keys are exhausted or down right now" + (lastErr ? ` - ${lastErr.message}` : ""),
    "ALL_KEYS_EXHAUSTED"
  );
}

// ---------------------------------------------------------------------
// Active model discovery (used only when every configured model is rejected)
// ---------------------------------------------------------------------
let _discovered = { at: 0, list: [] };

async function listModels() {
  const res = await _request(MODELS_URL, (key) => ({ headers: { Authorization: `Bearer ${key}` } }), 15000);
  const data = await res.json();
  return (data?.data || []).map((m) => m.id).filter(Boolean);
}

async function discoverChatModels() {
  if (Date.now() - _discovered.at < 60 * 60 * 1000 && _discovered.list.length) return _discovered.list;
  const ids = await listModels();
  const usable = ids.filter((id) => !/whisper|orpheus|guard|safeguard|tts|compound|embed/i.test(id));
  const rank = (id) =>
    /gpt-oss-20b/.test(id) ? 0 : /gpt-oss-120b/.test(id) ? 1 : /qwen/.test(id) ? 2 : /llama/.test(id) ? 3 : 4;
  usable.sort((a, b) => rank(a) - rank(b));
  _discovered = { at: Date.now(), list: usable };
  return usable;
}

// ---------------------------------------------------------------------
// Chat completion
// ---------------------------------------------------------------------
const isGptOss = (m) => /^openai\/gpt-oss/i.test(m);
const isQwen3 = (m) => /^qwen\/qwen3/i.test(m);

function cleanReply(text) {
  return String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function buildBody(model, messages, maxTokens, temperature, minimal) {
  const body = { model, messages, temperature };
  if (minimal) {
    body.max_tokens = maxTokens;
    return body;
  }
  body.max_completion_tokens = maxTokens;
  if (isGptOss(model)) {
    body.reasoning_effort = "low";       // gpt-oss only accepts low | medium | high
    body.include_reasoning = false;      // return only the final answer
  } else if (isQwen3(model)) {
    body.reasoning_effort = "none";      // instruct mode: fast answers, no thinking
  }
  return body;
}

async function _chatOnce(model, messages, maxTokens, temperature, timeoutMs) {
  // Reasoning models spend part of the budget on thinking, so give them headroom.
  const budget = isGptOss(model) ? maxTokens + 400 : maxTokens;
  const attempt = async (minimal) => {
    const res = await _request(
      CHAT_URL,
      (key) => ({
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(model, messages, budget, temperature, minimal)),
      }),
      timeoutMs
    );
    const data = await res.json();
    const out = cleanReply(data?.choices?.[0]?.message?.content);
    if (!out) throw new GroqError("Empty response from AI.", "EMPTY");
    return out;
  };
  try {
    return await attempt(false);
  } catch (e) {
    // If the extra parameters were the problem, retry once with a minimal request.
    if (e.code === "BAD_REQUEST" && /reasoning|include_reasoning|max_completion_tokens/i.test(e.message)) {
      return await attempt(true);
    }
    throw e;
  }
}

/**
 * Chat completion. `models` can be a string or a list (model fallback).
 * Returns the reply text (string).
 */
async function chat({ models, messages, max_tokens = 1024, temperature = 0.7, timeoutMs = 25000 }) {
  const tried = [];
  let lastErr = null;

  const run = async (list) => {
    for (const model of list) {
      if (tried.includes(model)) continue;
      tried.push(model);
      try {
        return await _chatOnce(model, messages, max_tokens, temperature, timeoutMs);
      } catch (e) {
        lastErr = e;
        if (e.code === "BAD_REQUEST" || e.code === "EMPTY") {
          console.log(`[GROQ] model ${model} failed: ${e.message.slice(0, 160)}`);
          continue; // try the next model
        }
        throw e; // all keys exhausted etc.
      }
    }
    return null;
  };

  const first = await run(Array.isArray(models) ? models : [models]);
  if (first) return first;

  // Every configured model was rejected: ask Groq what is active right now.
  try {
    const found = await discoverChatModels();
    const next = found.filter((m) => !tried.includes(m)).slice(0, 4);
    if (next.length) {
      console.log("[GROQ] configured models rejected, trying active models:", next.join(", "));
      const second = await run(next);
      if (second) return second;
    }
  } catch (e) {
    if (e.code === "NO_KEYS" || e.code === "ALL_KEYS_EXHAUSTED") throw e;
  }
  throw lastErr || new GroqError("AI request failed", "UNKNOWN");
}

// ---------------------------------------------------------------------
// Speech to text (Whisper)
// ---------------------------------------------------------------------
async function transcribe(buffer, filename = "audio.ogg", mime = "audio/ogg") {
  let lastErr = null;
  for (const model of sttModels()) {
    try {
      const res = await _request(
        STT_URL,
        (key) => {
          const form = new FormData();
          form.append("file", new Blob([buffer], { type: mime }), filename);
          form.append("model", model);
          form.append("response_format", "json");
          return { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form };
        },
        60000
      );
      const data = await res.json();
      return (data?.text || "").trim();
    } catch (e) {
      lastErr = e;
      if (e.code === "BAD_REQUEST") continue; // try the next STT model
      throw e;
    }
  }
  throw lastErr || new GroqError("Transcription failed", "UNKNOWN");
}

/** Check every key against the models endpoint (used by `.aikeys test`). */
async function testKeys() {
  const out = [];
  let i = 0;
  for (const key of keys.GROQ_API_KEYS) {
    i++;
    const masked = key.slice(0, 6) + "..." + key.slice(-4);
    try {
      const res = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${key}` } });
      if (res.ok) {
        const data = await res.json();
        out.push({ index: i, key: masked, status: res.status, ids: (data?.data || []).map((m) => m.id) });
      } else {
        out.push({ index: i, key: masked, status: res.status, ids: [] });
      }
    } catch (e) {
      out.push({ index: i, key: masked, status: 0, ids: [], error: e.message });
    }
  }
  return out;
}

module.exports = {
  chat, transcribe, hasKeys, listModels, testKeys,
  MODELS, fastModels, smartModels, visionModels, sttModels,
  GroqError,
};
