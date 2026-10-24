module.exports = {
  
  getContextInfo: (ms) => {
    return {
      mentionedJid: [ms.sender || ms.from], 
      forwardingScore: 999,
      isForwarded: true, 
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363417804135599@newsletterr', 
        newsletterName: 'Pk tech info', 
        serverMessageId: 143 
      }
    };
  },

  repondre: async (client, dest, ms, text, options = {}) => {
    const contextInfo = {
      ...module.exports.getContextInfo(ms), 
      ...options.contextInfo 
    };

    await client.sendMessage(dest, {
      text: text,
      contextInfo: contextInfo
    }); 
  },

  sendMessage: async (client, dest, ms, options) => {
    const contextInfo = {
      ...module.exports.getContextInfo(ms), 
      ...options.contextInfo 
    };

    await client.sendMessage(dest, {
      ...options,
      contextInfo: contextInfo
    }); 
  }
};
