const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ChannelType, ActivityType } = require('discord.js');
let mainWindow;
let discordClient;
let autoResponses = [];
let messageListeners = [];

// Configuration de l'auto-update
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Configuration pour le développement et la production
if (process.env.NODE_ENV === 'development') {
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
    autoUpdater.checkForUpdatesAndNotify();
}

// Désactiver la vérification automatique au démarrage pour le moment
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// Événements de l'auto-update
autoUpdater.on('checking-for-update', () => {
    log.info('Vérification des mises à jour...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Mise à jour disponible:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseNotes: info.releaseNotes,
            releaseDate: info.releaseDate
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Pas de mise à jour disponible - version actuelle:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-not-available', {
            version: info.version
        });
    }
});

autoUpdater.on('error', (err) => {
    log.error('Erreur lors de la mise à jour:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', {
            message: err.message,
            stack: err.stack
        });
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Téléchargement: " + Math.round(progressObj.percent) + "%";
    log.info(log_message);
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', {
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Mise à jour téléchargée:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        frame: false
    });

    mainWindow.loadFile('index.html');

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    // Vérifier les mises à jour après le démarrage
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 5000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Helper function to check bot permissions
function hasPermission(channel, permission) {
    if (!channel.guild) return false;
    const botMember = channel.guild.members.cache.get(discordClient.user.id);
    if (!botMember) return false;
    
    const permissions = channel.permissionsFor(botMember);
    return permissions && permissions.has(permission);
}

async function convertMentionsToIds(content, guild) {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;

    let result = content;
    const matches = [...content.matchAll(mentionRegex)];

    for (const match of matches) {
        const username = match[1];

        const member = guild.members.cache.find(
            m =>
                m.user.username.toLowerCase() === username.toLowerCase() ||
                m.displayName.toLowerCase() === username.toLowerCase()
        );

        if (member) {
            result = result.replace(`@${username}`, `<@${member.id}>`);
        }
    }

    return result;
}

async function convertIdsToMentions(content, guild) {
    const regex = /<@!?(\d+)>/g;

    let result = content;
    const matches = [...content.matchAll(regex)];

    for (const match of matches) {
        const userId = match[1];

        try {
            const member = await guild.members.fetch(userId);
            result = result.replace(match[0], `@${member.displayName}`);
        } catch {
            result = result.replace(match[0], '@unknown');
        }
    }

    return result;
}

function setBotPresence() {
    if (!discordClient || !discordClient.user) return;

    discordClient.user.setPresence({
        status: "online",
        activities: [
            {
                name: "Je suis contrôlé avec ControlyBot",
                type: ActivityType.Streaming,
                url: "https://www.youtube.com/watch?v=hvL1339luv0"
            }
        ]
    });
}

// Discord Bot Connection
ipcMain.handle('connect-bot', async (event, token) => {
    try {
        if (discordClient) {
            discordClient.destroy();
        }

        discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        discordClient.once("ready", () => {
            console.log(`Bot connecté : ${discordClient.user.tag}`);

            setBotPresence();
        });

        await discordClient.login(token);

        return { success: true, user: discordClient.user?.tag };

    } catch (error) {
        console.error('Bot connection error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('disconnect-bot', async () => {
    try {
        if (discordClient) {
            discordClient.destroy();
            discordClient = null;
        }
        return { success: true };
    } catch (error) {
        console.error('Bot disconnection error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-guilds', async () => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const guilds = discordClient.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount
        }));

        return { success: true, guilds };
    } catch (error) {
        console.error('Error fetching guilds:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-guild-info', async (event, guildId) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild not found' };
        }

        // Fetch fresh guild data to ensure we have complete information
        await guild.fetch();

        const guildInfo = {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            createdAt: guild.createdAt,
            description: guild.description,
            features: guild.features,
            verificationLevel: guild.verificationLevel,
            banner: guild.bannerURL(),
            splash: guild.splashURL(),
            iconHash: guild.icon,
            ownerId: guild.ownerId,
            applicationId: guild.applicationId
        };

        return { success: true, guild: guildInfo };
    } catch (error) {
        console.error('Error fetching guild info:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-channels', async (event, guildId) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild not found' };
        }

        // Get all channels and organize them by category
        const allChannels = guild.channels.cache;
        const categories = new Map();
        const uncategorizedChannels = [];

        // First, get all categories
        allChannels.filter(channel => channel.type === 4).forEach(category => {
            categories.set(category.id, {
                id: category.id,
                name: category.name,
                type: 'category',
                channels: []
            });
        });

        // Then, organize text channels by category
        allChannels.filter(channel => channel.type === 0).forEach(channel => {
            const channelData = {
                id: channel.id,
                name: channel.name,
                topic: channel.topic,
                nsfw: channel.nsfw,
                type: 'text',
                parentId: channel.parentId
            };

            if (channel.parentId && categories.has(channel.parentId)) {
                categories.get(channel.parentId).channels.push(channelData);
            } else {
                uncategorizedChannels.push(channelData);
            }
        });

        // Then, organize voice channels by category
        allChannels.filter(channel => channel.type === 2).forEach(channel => {
            const channelData = {
                id: channel.id,
                name: channel.name,
                type: 'voice',
                parentId: channel.parentId,
                userLimit: channel.userLimit,
                bitrate: channel.bitrate,
                members: channel.members.map(member => ({
                    id: member.id,
                    username: member.user.username,
                    displayName: member.displayName,
                    avatar: member.user.displayAvatarURL(),
                    speaking: member.speaking
                }))
            };

            if (channel.parentId && categories.has(channel.parentId)) {
                categories.get(channel.parentId).channels.push(channelData);
            } else {
                uncategorizedChannels.push(channelData);
            }
        });

        // Convert to array and add uncategorized channels
        const result = Array.from(categories.values());
        if (uncategorizedChannels.length > 0) {
            result.push({
                id: 'uncategorized',
                name: 'Sans catégorie',
                type: 'category',
                channels: uncategorizedChannels
            });
        }

        return { success: true, channels: result };
    } catch (error) {
        console.error('Error fetching channels:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('send-message', async (event, channelId, content) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        // Convert @username -> <@userid>
        const convertedContent = await convertMentionsToIds(content, channel.guild);

        const message = await channel.send(convertedContent);
        return { success: true, messageId: message.id };

    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('reply-to-message', async (event, channelId, messageId, content) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        // Get the original message to create a proper reply
        const originalMessage = await channel.messages.fetch(messageId);
        
        // Create reply with mention
        const replyContent = `${content}`;
        const sentMessage = await originalMessage.reply(replyContent);
        
        return { success: true, messageId: sentMessage.id };
    } catch (error) {
        console.error('Error replying to message:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-message', async (event, channelId, messageId) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        const message = await channel.messages.fetch(messageId);
        await message.delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting message:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-messages', async (event, channelId, limit = 50) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        const messages = await channel.messages.fetch({ limit });
        const messageList = await Promise.all(messages.map(async (msg) => ({
            id: msg.id,
            content: await convertIdsToMentions(msg.content, msg.guild),
            author: msg.author.tag,
            authorAvatar: msg.author.displayAvatarURL(),
            timestamp: msg.createdTimestamp,
            replyto: msg.reference ? (msg.reference.messageId ? await getMessageReplyContent(msg.reference.messageId, channel) : '') : '',
            attachments: msg.attachments.map(att => ({
                url: att.url,
                name: att.name,
                type: att.contentType
            }))
        })));

        return { success: true, messages: messageList };
    } catch (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: error.message };
    }
});

// Helper function to get reply message content
async function getMessageReplyContent(messageId, channel) {
    try {
        const repliedMessage = await channel.messages.fetch(messageId);
        return repliedMessage.author.tag + ': ' + await convertIdsToMentions(repliedMessage.content, repliedMessage.guild);
    } catch (error) {
        console.error('Error fetching reply message:', error);
        return '';
    }
}

// Message Listeners Setup
function setupMessageListeners() {
    if (!discordClient) return;

    // Listen for messages
    discordClient.on('messageCreate', async (message) => {
        // Ignore bot's own messages
        if (message.author.bot) return;

        // Process auto-responses
        await processAutoResponses(message);

        // Notify renderer of new message
        if (mainWindow) {
            mainWindow.webContents.send('new-message', {
                channelId: message.channel.id,
                message: {
                    id: message.id,
                    content: message.content,
                    author: message.author.tag,
                    authorAvatar: message.author.displayAvatarURL(),
                    timestamp: message.createdTimestamp,
                    replyto: message.reference ? (message.reference.messageId ? await getMessageReplyContent(message.reference.messageId, message.channel) : '') : '',
                    attachments: message.attachments.map(att => ({
                        url: att.url,
                        name: att.name,
                        type: att.contentType
                    }))
                }
            });
        }
    });

    // Listen for message updates
    discordClient.on('messageUpdate', (oldMessage, newMessage) => {
        if (mainWindow) {
            mainWindow.webContents.send('message-updated', {
                channelId: newMessage.channel.id,
                messageId: newMessage.id,
                newContent: newMessage.content
            });
        }
    });

    // Listen for message deletions
    discordClient.on('messageDelete', (message) => {
        if (mainWindow) {
            mainWindow.webContents.send('message-deleted', {
                channelId: message.channel.id,
                messageId: message.id
            });
        }
    });
}

// Auto-response processing
async function processAutoResponses(message) {
    if (!this.autoResponsesEnabled) return;

    for (const response of autoResponses) {
        if (!response.enabled) continue;

        if (shouldTriggerResponse(message.content, response.trigger, response.triggerType)) {
            try {
                if (response.isEmbed && response.embed) {
                    // Send embed response
                    let channel = message.channel;
                    
                    if (response.type === 'reply') {
                        await message.reply({ embeds: [createEmbedFromData(response.embed)] });
                    } else if (response.type === 'channel') {
                        await channel.send({ embeds: [createEmbedFromData(response.embed)] });
                    } else if (response.type === 'dm') {
                        const dmChannel = await message.author.createDM();
                        await dmChannel.send({ embeds: [createEmbedFromData(response.embed)] });
                    }
                } else {
                    // Send text response
                    if (response.type === 'reply') {
                        await message.reply(response.response);
                    } else if (response.type === 'channel') {
                        await message.channel.send(response.response);
                    } else if (response.type === 'dm') {
                        const dmChannel = await message.author.createDM();
                        await dmChannel.send(response.response);
                    }
                }
            } catch (error) {
                console.error('Error sending auto-response:', error);
            }
        }
    }
}

function createEmbedFromData(embedData) {
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
        .setTitle(embedData.title || '')
        .setDescription(embedData.description || '')
        .setColor(embedData.color || '#5865F2');

    if (embedData.author) {
        const authorData = {
            name: embedData.author.name || ''
        };
        
        if (embedData.author.iconURL && embedData.author.iconURL.trim() !== '') {
            authorData.iconURL = embedData.author.iconURL;
        }
        
        if (embedData.author.url && embedData.author.url.trim() !== '') {
            authorData.url = embedData.author.url;
        }
        
        embed.setAuthor(authorData);
    }

    if (embedData.thumbnail && embedData.thumbnail.trim() !== '') {
        embed.setThumbnail(embedData.thumbnail);
    }

    if (embedData.image && embedData.image.trim() !== '') {
        embed.setImage(embedData.image);
    }

    if (embedData.footer) {
        const footerData = {
            text: embedData.footer.text || ''
        };
        
        if (embedData.footer.iconURL && embedData.footer.iconURL.trim() !== '') {
            footerData.iconURL = embedData.footer.iconURL;
        }
        
        embed.setFooter(footerData);
    }

    if (embedData.timestamp) {
        embed.setTimestamp();
    }

    if (embedData.url && embedData.url.trim() !== '') {
        embed.setURL(embedData.url);
    }

    return embed;
}

function shouldTriggerResponse(content, trigger, triggerType) {
    // Check if message matches trigger conditions
    const messageContent = content.toLowerCase();
    
    if (triggerType === 'contains') {
        return messageContent.includes(trigger.toLowerCase());
    } else if (triggerType === 'startsWith') {
        return messageContent.startsWith(trigger.toLowerCase());
    } else if (triggerType === 'endsWith') {
        return messageContent.endsWith(trigger.toLowerCase());
    } else if (triggerType === 'exact') {
        return messageContent === trigger.toLowerCase();
    } else if (triggerType === 'regex') {
        try {
            const regex = new RegExp(trigger, 'i');
            return regex.test(messageContent);
        } catch (error) {
            console.error('Invalid regex pattern:', trigger);
            return false;
        }
    }
    
    return false;
}

// Auto-response management IPC handlers
ipcMain.handle('add-auto-response', async (event, responseConfig) => {
    try {
        autoResponses.push({
            id: Date.now().toString(),
            ...responseConfig,
            enabled: true,
            createdAt: new Date().toISOString()
        });
        
        return { success: true, responses: autoResponses };
    } catch (error) {
        console.error('Error adding auto-response:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-auto-responses', async () => {
    try {
        return { success: true, responses: autoResponses };
    } catch (error) {
        console.error('Error getting auto-responses:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-auto-response', async (event, id, updates) => {
    try {
        const index = autoResponses.findIndex(r => r.id === id);
        if (index !== -1) {
            autoResponses[index] = { ...autoResponses[index], ...updates };
            return { success: true, responses: autoResponses };
        } else {
            return { success: false, error: 'Response not found' };
        }
    } catch (error) {
        console.error('Error updating auto-response:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-auto-response', async (event, id) => {
    try {
        autoResponses = autoResponses.filter(r => r.id !== id);
        return { success: true, responses: autoResponses };
    } catch (error) {
        console.error('Error deleting auto-response:', error);
        return { success: false, error: error.message };
    }
});

// Quick response system
ipcMain.handle('send-quick-response', async (event, channelId, responseId) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const response = autoResponses.find(r => r.id === responseId);
        if (!response) {
            return { success: false, error: 'Response not found' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        const message = await channel.send(response.response);
        return { success: true, messageId: message.id };
    } catch (error) {
        console.error('Error sending quick response:', error);
        return { success: false, error: error.message };
    }
});

// Channel Management
ipcMain.handle('create-channel', async (event, guildId, channelData) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild not found' };
        }

        // Check bot permissions
        const botMember = guild.members.cache.get(discordClient.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return { success: false, error: 'Bot lacks permission to manage channels' };
        }

        let channelOptions = {
            type: channelData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
            name: channelData.name,
            topic: channelData.topic || '',
            parent: channelData.parentId || null
        };

        const channel = await guild.channels.create(channelOptions);
        
        return { 
            success: true, 
            channel: {
                id: channel.id,
                name: channel.name,
                type: channel.type === ChannelType.GuildVoice ? 'voice' : 'text',
                topic: channel.topic,
                parentId: channel.parentId
            }
        };
    } catch (error) {
        console.error('Error creating channel:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-channel', async (event, channelId) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        // Check bot permissions
        const guild = channel.guild;
        const botMember = guild.members.cache.get(discordClient.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return { success: false, error: 'Bot lacks permission to manage channels' };
        }

        await channel.delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting channel:', error);
        return { success: false, error: error.message };
    }
});

// Embed Message System
ipcMain.handle('send-embed', async (event, channelId, embedData) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(embedData.title || '')
            .setDescription(embedData.description || '')
            .setColor(embedData.color || '#5865F2');

        if (embedData.author) {
            const authorData = {
                name: embedData.author.name || ''
            };
            
            if (embedData.author.iconURL && embedData.author.iconURL.trim() !== '') {
                authorData.iconURL = embedData.author.iconURL;
            }
            
            if (embedData.author.url && embedData.author.url.trim() !== '') {
                authorData.url = embedData.author.url;
            }
            
            embed.setAuthor(authorData);
        }

        if (embedData.thumbnail && embedData.thumbnail.trim() !== '') {
            embed.setThumbnail(embedData.thumbnail);
        }

        if (embedData.fields && embedData.fields.length > 0) {
            embed.addFields(embedData.fields);
        }

        if (embedData.image && embedData.image.trim() !== '') {
            embed.setImage(embedData.image);
        }

        if (embedData.footer) {
            const footerData = {
                text: embedData.footer.text || ''
            };
            
            if (embedData.footer.iconURL && embedData.footer.iconURL.trim() !== '') {
                footerData.iconURL = embedData.footer.iconURL;
            }
            
            embed.setFooter(footerData);
        }

        if (embedData.timestamp) {
            embed.setTimestamp();
        }

        if (embedData.url && embedData.url.trim() !== '') {
            embed.setURL(embedData.url);
        }

        const message = await channel.send({ embeds: [embed] });
        return { success: true, messageId: message.id };
    } catch (error) {
        console.error('Error sending embed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('send-message-with-embed', async (event, channelId, content, embedData) => {
    try {
        if (!discordClient) {
            return { success: false, error: 'Bot not connected' };
        }

        const channel = discordClient.channels.cache.get(channelId);
        if (!channel) {
            return { success: false, error: 'Channel not found' };
        }

        let messageOptions = { content: content || '' };

        if (embedData) {
            const embed = new EmbedBuilder()
                .setTitle(embedData.title || '')
                .setDescription(embedData.description || '')
                .setColor(embedData.color || '#5865F2');

            if (embedData.author) {
                const authorData = {
                    name: embedData.author.name || ''
                };
                
                if (embedData.author.iconURL && embedData.author.iconURL.trim() !== '') {
                    authorData.iconURL = embedData.author.iconURL;
                }
                
                if (embedData.author.url && embedData.author.url.trim() !== '') {
                    authorData.url = embedData.author.url;
                }
                
                embed.setAuthor(authorData);
            }

            if (embedData.thumbnail && embedData.thumbnail.trim() !== '') {
                embed.setThumbnail(embedData.thumbnail);
            }

            if (embedData.fields && embedData.fields.length > 0) {
                embed.addFields(embedData.fields);
            }

            if (embedData.image && embedData.image.trim() !== '') {
                embed.setImage(embedData.image);
            }

            if (embedData.footer) {
                const footerData = {
                    text: embedData.footer.text || ''
                };
                
                if (embedData.footer.iconURL && embedData.footer.iconURL.trim() !== '') {
                    footerData.iconURL = embedData.footer.iconURL;
                }
                
                embed.setFooter(footerData);
            }

            if (embedData.timestamp) {
                embed.setTimestamp();
            }

            if (embedData.url && embedData.url.trim() !== '') {
                embed.setURL(embedData.url);
            }

            messageOptions.embeds = [embed];
        }

        const message = await channel.send(messageOptions);
        return { success: true, messageId: message.id };
    } catch (error) {
        console.error('Error sending message with embed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-bot-status', async () => {
    try {
        if (!discordClient) {
            return { connected: false, user: null };
        }

        return { 
            connected: discordClient.status === 0, // Ready
            user: discordClient.user ? {
                tag: discordClient.user.tag,
                id: discordClient.user.id,
                avatar: discordClient.user.displayAvatarURL()
            } : null
        };
    } catch (error) {
        console.error('Error checking bot status:', error);
        return { connected: false, user: null, error: error.message };
    }
});

// Handlers pour l'auto-update
ipcMain.handle('install-update', async () => {
    try {
        log.info('Installation de la mise à jour...');
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
    } catch (error) {
        log.error('Erreur lors de l\'installation de la mise à jour:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-for-updates', async () => {
    try {
        log.info('Vérification manuelle des mises à jour...');
        const result = await autoUpdater.checkForUpdatesAndNotify();
        return { 
            success: true, 
            updateInfo: result.updateInfo,
            available: result.updateInfo && result.updateInfo.version !== app.getVersion()
        };
    } catch (error) {
        log.error('Erreur lors de la vérification des mises à jour:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('download-update', async () => {
    try {
        log.info('Téléchargement de la mise à jour...');
        await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        log.error('Erreur lors du téléchargement de la mise à jour:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-app-version', () => {
    return { version: app.getVersion() };
});