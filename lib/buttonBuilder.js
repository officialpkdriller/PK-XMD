"use strict";
/**
 * buttonBuilder.js
 *
 * CommonJS port of NOVA-XMD's ButtonV2 class (lib/WABuilder.js).
 * Lets any BMB-TECH command send quick-reply buttons the same way
 * NOVA-XMD's fullmenu.js does, without needing the full WABuilder file
 * or an ES Modules conversion.
 *
 * Usage:
 *   const { ButtonV2 } = require("../../lib/buttonBuilder");
 *   const btn = new ButtonV2(client);
 *   btn.setBody("...").setFooter("...").addButton("Label", ".command");
 *   await btn.send(dest, { mentions: [sender] });
 */
const { generateWAMessageFromContent } = require("@whiskeysockets/baileys");

class ButtonV2 {
    constructor(client) {
        if (!client) throw new Error("Socket is required");
        this._client = client;
        this._body = "";
        this._footer = "";
        this._contextInfo = {};
        this._buttons = [];
    }

    setBody(body) {
        this._body = body;
        return this;
    }

    setFooter(footer) {
        this._footer = footer;
        return this;
    }

    setContextInfo(contextInfo) {
        this._contextInfo = { ...this._contextInfo, ...contextInfo };
        return this;
    }

    /**
     * @param {string} displayText - the label shown on the button
     * @param {string} buttonId - the text sent back when tapped (usually a command)
     */
    addButton(displayText = "", buttonId = "") {
        this._buttons.push({
            buttonId: buttonId || displayText,
            buttonText: { displayText },
            type: 1,
        });
        return this;
    }

    build(jid, { mentions, ...options } = {}) {
        const contextInfo = { ...this._contextInfo };
        if (mentions?.length) contextInfo.mentionedJid = mentions;

        const msg = generateWAMessageFromContent(
            jid,
            {
                ...(options.extraPayload || {}),
                buttonsMessage: {
                    contentText: this._body,
                    footerText: this._footer,
                    headerType: 1,
                    viewOnce: true,
                    contextInfo,
                    buttons: [...this._buttons],
                },
            },
            { ...options }
        );
        return msg;
    }

    async send(jid, options = {}) {
        if (this._buttons.length < 1) {
            throw new Error("ButtonV2 requires at least one button");
        }
        const msg = this.build(jid, options);

        await this._client.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [
                        {
                            tag: "interactive",
                            attrs: { type: "native_flow", v: "1" },
                            content: [
                                { tag: "native_flow", attrs: { v: "9", name: "mixed" } },
                            ],
                        },
                    ],
                },
            ],
        });
        return msg;
    }
}

module.exports = { ButtonV2 };
