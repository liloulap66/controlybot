const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Window controls
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window')
});

contextBridge.exposeInMainWorld('electronAPI', {
    // Bot connection
    connectBot: (token) => ipcRenderer.invoke('connect-bot', token),
    disconnectBot: () => ipcRenderer.invoke('disconnect-bot'),
    getBotStatus: () => ipcRenderer.invoke('get-bot-status'),
    
    // Guild management
    getGuilds: () => ipcRenderer.invoke('get-guilds'),
    getGuildInfo: (guildId) => ipcRenderer.invoke('get-guild-info', guildId),
    
    // Channel management
    getChannels: (guildId) => ipcRenderer.invoke('get-channels', guildId),
    createChannel: (guildId, channelData) => ipcRenderer.invoke('create-channel', guildId, channelData),
    deleteChannel: (channelId) => ipcRenderer.invoke('delete-channel', channelId),
    
    // Message management
    sendMessage: (channelId, content) => ipcRenderer.invoke('send-message', channelId, content),
    replyToMessage: (channelId, messageId, content) => ipcRenderer.invoke('reply-to-message', channelId, messageId, content),
    deleteMessage: (channelId, messageId) => ipcRenderer.invoke('delete-message', channelId, messageId),
    getMessages: (channelId, limit) => ipcRenderer.invoke('get-messages', channelId, limit),
    
    // Embed system
    sendEmbed: (channelId, embedData) => ipcRenderer.invoke('send-embed', channelId, embedData),
    sendMessageWithEmbed: (channelId, content, embedData) => ipcRenderer.invoke('send-message-with-embed', channelId, content, embedData),
    
    // Auto-response system
    addAutoResponse: (responseConfig) => ipcRenderer.invoke('add-auto-response', responseConfig),
    getAutoResponses: () => ipcRenderer.invoke('get-auto-responses'),
    updateAutoResponse: (id, updates) => ipcRenderer.invoke('update-auto-response', id, updates),
    deleteAutoResponse: (id) => ipcRenderer.invoke('delete-auto-response', id),
    sendQuickResponse: (channelId, responseId) => ipcRenderer.invoke('send-quick-response', channelId, responseId),
    
    // Message event listeners
    onNewMessage: (callback) => ipcRenderer.on('new-message', callback),
    onMessageUpdated: (callback) => ipcRenderer.on('message-updated', callback),
    onMessageDeleted: (callback) => ipcRenderer.on('message-deleted', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // Voice event listeners
    onVoiceConnectionStatus: (callback) => ipcRenderer.on('voice-connection-status', callback),
    onVoicePlayerStatus: (callback) => ipcRenderer.on('voice-player-status', callback),
    
    // Auto-update
    installUpdate: () => ipcRenderer.invoke('install-update'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback)
});
