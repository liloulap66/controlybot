class DiscordBotManager {
    constructor() {
        this.isConnected = false;
        this.currentGuild = null;
        this.currentChannel = null;
        this.servers = [];
        this.channels = [];
        this.messages = [];
        this.refreshInterval = null;
        this.refreshIntervalTime = 5000; // 5 secondes
        this.replyingTo = null; // Track which message we're replying to
        this.mentionUsers = []; // Store users for mentions
        this.showingMentions = false; // Track mention dropdown state
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkBotStatus();
        this.setupMessageEventListeners();
        this.loadAutoResponses();
        this.loadEmbedPresets();
        this.setupUpdateListeners();
        
        // Attendre que l'interface soit complètement chargée avant la reconnexion auto
        setTimeout(() => this.tryAutoConnect(), 500);
    }

    initializeElements() {
        // Connection elements
        this.connectBtn = document.getElementById('connectBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        
        // Modal elements
        this.connectionModal = document.getElementById('connectionModal');
        this.botTokenInput = document.getElementById('botToken');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.confirmConnectBtn = document.getElementById('confirmConnectBtn');
        
        // Server and channel elements
        this.logoBtn = document.getElementById('logo');
        this.serverList = document.getElementById('serverList');
        this.serverName = document.getElementById('serverName');
        this.channelList = document.getElementById('channelList');
        this.channelName = document.getElementById('channelName');
        this.channelTopic = document.getElementById('channelTopic');
        
        // Message elements
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.embedBtn = document.getElementById('embedBtn');
        
        // Channel management elements
        this.createChannelBtn = document.getElementById('createChannelBtn');
        this.inviteBotBtn = document.getElementById('inviteBotBtn');
        this.channelModal = document.getElementById('channelModal');
        this.channelName = document.getElementById('channelName');
        this.channelType = document.getElementById('channelType');
        this.channelTopic = document.getElementById('channelTopic');
        this.channelCategory = document.getElementById('channelCategory');
        
        // Embed builder elements
        this.embedModal = document.getElementById('embedModal');
        this.embedPreview = document.getElementById('embedPreview');
        this.embedTitle = document.getElementById('embedTitle');
        this.embedDescription = document.getElementById('embedDescription');
        this.embedColor = document.getElementById('embedColor');
        this.embedAuthor = document.getElementById('embedAuthor');
        this.embedAuthorIcon = document.getElementById('embedAuthorIcon');
        this.embedThumbnail = document.getElementById('embedThumbnail');
        this.embedImage = document.getElementById('embedImage');
        this.embedFooter = document.getElementById('embedFooter');
        this.embedTimestamp = document.getElementById('embedTimestamp');
        
        // Embed presets elements
        this.embedPresetSelect = document.getElementById('embedPresetSelect');
        this.managePresetsBtn = document.getElementById('managePresetsBtn');
        this.saveAsPresetBtn = document.getElementById('saveAsPresetBtn');
        this.embedPresetsModal = document.getElementById('embedPresetsModal');
        this.embedPresetFormModal = document.getElementById('embedPresetFormModal');
        this.presetsList = document.getElementById('presetsList');
        this.presetName = document.getElementById('presetName');
        this.presetDescription = document.getElementById('presetDescription');
        this.presetPreview = document.getElementById('presetPreview');
        this.presetFormTitle = document.getElementById('presetFormTitle');
        
        // Embed presets state
        this.embedPresets = [];
        this.editingPresetId = null;
        
        // Action buttons
        this.clearMessagesBtn = document.getElementById('clearMessagesBtn');
        this.bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        this.botInfoBtn = document.getElementById('botInfoBtn');
        this.botStatusBtn = document.getElementById('botStatusBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
        this.toggleAutoRefreshBtn = document.getElementById('toggleAutoRefreshBtn');
        
        // Auto-response elements
        this.manageResponsesBtn = document.getElementById('manageResponsesBtn');
        this.quickResponsesBtn = document.getElementById('quickResponsesBtn');
        this.toggleAutoResponsesBtn = document.getElementById('toggleAutoResponsesBtn');
        this.responsesModal = document.getElementById('responsesModal');
        this.responseFormModal = document.getElementById('responseFormModal');
        this.quickResponsesModal = document.getElementById('quickResponsesModal');
        this.responsesList = document.getElementById('responsesList');
        this.quickResponsesGrid = document.getElementById('quickResponsesGrid');
        
        // Response form elements
        this.responseFormTitle = document.getElementById('responseFormTitle');
        this.responseTrigger = document.getElementById('responseTrigger');
        this.triggerType = document.getElementById('triggerType');
        this.responseText = document.getElementById('responseText');
        this.responseType = document.getElementById('responseType');
        this.responseEnabled = document.getElementById('responseEnabled');
        
        // Embed response elements
        this.isEmbedResponse = document.getElementById('isEmbedResponse');
        this.embedResponseFields = document.getElementById('embedResponseFields');
        this.textResponseFields = document.getElementById('textResponseFields');
        this.responseEmbedTitle = document.getElementById('responseEmbedTitle');
        this.responseEmbedDescription = document.getElementById('responseEmbedDescription');
        this.responseEmbedColor = document.getElementById('responseEmbedColor');
        this.responseEmbedAuthor = document.getElementById('responseEmbedAuthor');
        this.responseEmbedThumbnail = document.getElementById('responseEmbedThumbnail');
        this.responseEmbedImage = document.getElementById('responseEmbedImage');
        this.responseEmbedFooter = document.getElementById('responseEmbedFooter');
        this.responseEmbedTimestamp = document.getElementById('responseEmbedTimestamp');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Title bar elements
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.maximizeBtn = document.getElementById('maximizeBtn');
        this.closeBtn = document.getElementById('closeBtn');
        this.titleBarBotName = document.getElementById('titleBarBotName');
        this.statusDot = document.getElementById('status-dot');
        
        // Auto-response state
        this.autoResponses = [];
        this.autoResponsesEnabled = true;
        this.editingResponseId = null;
    }

    attachEventListeners() {
        // Title bar events
        this.minimizeBtn.addEventListener('click', () => this.minimizeWindow());
        this.maximizeBtn.addEventListener('click', () => this.maximizeWindow());
        this.closeBtn.addEventListener('click', () => this.closeWindow());
        
        // Connection events
        this.connectBtn.addEventListener('click', () => this.showConnectionModal());
        this.closeModalBtn.addEventListener('click', () => this.hideConnectionModal());
        this.cancelBtn.addEventListener('click', () => this.hideConnectionModal());
        this.confirmConnectBtn.addEventListener('click', () => this.connectBot());
        
        // Message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('input', (e) => {
            this.handleMessageInput(e);
        });
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelReply();
                this.hideMentions();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateMentions(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateMentions(-1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.selectMention();
            }
        });
        
        this.refreshBtn.addEventListener('click', () => this.refreshMessages());
        this.embedBtn.addEventListener('click', () => this.showEmbedModal());
        
        // Channel management events
        this.createChannelBtn.addEventListener('click', () => this.showChannelModal());
        this.logoBtn.addEventListener('click', () => this.inviteBot());
        document.getElementById('closeChannelModal').addEventListener('click', () => this.hideChannelModal());
        document.getElementById('cancelChannelBtn').addEventListener('click', () => this.hideChannelModal());
        document.getElementById('createChannelSubmitBtn').addEventListener('click', () => this.createChannel());
        
        // Embed builder events
        document.getElementById('closeEmbedModal').addEventListener('click', () => this.hideEmbedModal());
        document.getElementById('cancelEmbedBtn').addEventListener('click', () => this.hideEmbedModal());
        document.getElementById('sendEmbedBtn').addEventListener('click', () => this.sendEmbed());
        
        // Embed presets events
        this.embedPresetSelect.addEventListener('change', () => this.loadEmbedPreset());
        this.managePresetsBtn.addEventListener('click', () => this.showEmbedPresetsModal());
        this.saveAsPresetBtn.addEventListener('click', () => this.showSavePresetModal());
        document.getElementById('closeEmbedPresetsModal').addEventListener('click', () => this.hideEmbedPresetsModal());
        document.getElementById('closeEmbedPresetFormModal').addEventListener('click', () => this.hideEmbedPresetForm());
        document.getElementById('addNewPresetBtn').addEventListener('click', () => this.showEmbedPresetForm());
        document.getElementById('cancelPresetBtn').addEventListener('click', () => this.hideEmbedPresetForm());
        document.getElementById('savePresetBtn').addEventListener('click', () => this.saveEmbedPreset());
        
        // Embed preview events
        this.embedTitle.addEventListener('input', () => this.updateEmbedPreview());
        this.embedDescription.addEventListener('input', () => this.updateEmbedPreview());
        this.embedColor.addEventListener('input', () => this.updateEmbedPreview());
        this.embedAuthor.addEventListener('input', () => this.updateEmbedPreview());
        this.embedAuthorIcon.addEventListener('input', () => this.updateEmbedPreview());
        this.embedThumbnail.addEventListener('input', () => this.updateEmbedPreview());
        this.embedImage.addEventListener('input', () => this.updateEmbedPreview());
        this.embedFooter.addEventListener('input', () => this.updateEmbedPreview());
        this.embedTimestamp.addEventListener('change', () => this.updateEmbedPreview());
        
        // Embed response toggle
        this.isEmbedResponse.addEventListener('change', () => this.toggleEmbedResponseFields());
        
        // Action button events
        this.clearMessagesBtn.addEventListener('click', () => this.clearAllMessages());
        this.bulkDeleteBtn.addEventListener('click', () => this.showBulkDeleteDialog());
        this.botInfoBtn.addEventListener('click', () => this.showBotInfo());
        this.botStatusBtn.addEventListener('click', () => this.showBotStatus());
        this.exportBtn.addEventListener('click', () => this.exportLogs());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.checkUpdatesBtn.addEventListener('click', () => this.checkForUpdates());
        this.toggleAutoRefreshBtn.addEventListener('click', () => this.toggleAutoRefresh());
        
        // Auto-response events
        this.manageResponsesBtn.addEventListener('click', () => this.showResponsesModal());
        this.quickResponsesBtn.addEventListener('click', () => this.showQuickResponsesModal());
        this.toggleAutoResponsesBtn.addEventListener('click', () => this.toggleAutoResponses());
        
        // Modal events for responses
        document.getElementById('closeResponsesModal').addEventListener('click', () => this.hideResponsesModal());
        document.getElementById('addResponseBtn').addEventListener('click', () => this.showResponseForm());
        document.getElementById('closeResponseFormModal').addEventListener('click', () => this.hideResponseForm());
        document.getElementById('cancelResponseBtn').addEventListener('click', () => this.hideResponseForm());
        document.getElementById('saveResponseBtn').addEventListener('click', () => this.saveResponse());
        document.getElementById('closeQuickResponsesModal').addEventListener('click', () => this.hideQuickResponsesModal());
        
        // Modal close on outside click
        this.connectionModal.addEventListener('click', (e) => {
            if (e.target === this.connectionModal) {
                this.hideConnectionModal();
            }
        });
        
        this.responsesModal.addEventListener('click', (e) => {
            if (e.target === this.responsesModal) {
                this.hideResponsesModal();
            }
        });
        
        this.responseFormModal.addEventListener('click', (e) => {
            if (e.target === this.responseFormModal) {
                this.hideResponseForm();
            }
        });
        
        this.quickResponsesModal.addEventListener('click', (e) => {
            if (e.target === this.quickResponsesModal) {
                this.hideQuickResponsesModal();
            }
        });
        
        this.channelModal.addEventListener('click', (e) => {
            if (e.target === this.channelModal) {
                this.hideChannelModal();
            }
        });
        
        this.embedModal.addEventListener('click', (e) => {
            if (e.target === this.embedModal) {
                this.hideEmbedModal();
            }
        });
        
        this.embedPresetsModal.addEventListener('click', (e) => {
            if (e.target === this.embedPresetsModal) {
                this.hideEmbedPresetsModal();
            }
        });
        
        this.embedPresetFormModal.addEventListener('click', (e) => {
            if (e.target === this.embedPresetFormModal) {
                this.hideEmbedPresetForm();
            }
        });
        
        // Token input validation
        this.botTokenInput.addEventListener('input', () => {
            this.validateTokenInput();
        });
    }

    async checkBotStatus() {
        try {
            const status = await window.electronAPI.getBotStatus();
            this.updateConnectionStatus(status);
        } catch (error) {
            console.error('Error checking bot status:', error);
        }
    }

    updateConnectionStatus(status) {
        if (status.connected) {
            this.isConnected = true;
            this.statusDot.className = 'status-dot online';
            this.connectBtn.innerHTML = '➜]';
            this.connectBtn.title = 'Déconnecter';
            
            // Update title bar with bot name
            if (status.user && status.user.tag) {
                this.titleBarBotName.textContent = status.user.tag;
                this.titleBarBotName.classList.add('connected');
            } else {
                this.titleBarBotName.textContent = 'Bot connecté';
                this.titleBarBotName.classList.add('connected');
            }
            
            this.enableBotFeatures();
            this.loadGuilds();
        } else {
            this.isConnected = false;
            this.statusDot.className = 'status-dot offline';
            this.connectBtn.innerHTML = '➕';
            this.connectBtn.title = 'Connecter un bot';
            
            // Reset title bar
            this.titleBarBotName.textContent = 'Aucun bot connecté';
            this.titleBarBotName.classList.remove('connected');
            
            this.disableBotFeatures();
            // Clear auto-refresh when disconnected
            this.clearRefreshInterval();
        }
    }

    showConnectionModal() {
        if (this.isConnected) {
            this.disconnectBot();
        } else {
            this.connectionModal.classList.add('show');
            this.botTokenInput.focus();
        }
    }

    hideConnectionModal() {
        this.connectionModal.classList.remove('show');
        this.botTokenInput.value = '';
    }

    validateTokenInput() {
        const token = this.botTokenInput.value.trim();
        this.confirmConnectBtn.disabled = token.length < 50;
    }

    async connectBot() {
        const token = this.botTokenInput.value.trim();
        if (!token) {
            this.showError('Veuillez entrer un token de bot valide');
            return;
        }

        this.showLoading(true);
        
        try {
            const result = await window.electronAPI.connectBot(token);
            
            if (result.success) {
                // Save token for auto-reconnect
                await this.saveBotToken(token);
                this.hideConnectionModal();
                this.updateConnectionStatus({ connected: true, user: { tag: result.user } });
                this.showSuccess('Bot connecté avec succès!');
            } else {
                this.showError(`Erreur de connexion: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur de connexion: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async disconnectBot() {
        try {
            const result = await window.electronAPI.disconnectBot();
            if (result.success) {
                // Clear saved token
                await this.clearSavedToken();
                this.updateConnectionStatus({ connected: false });
                this.clearAllData();
                this.showSuccess('Bot déconnecté');
            } else {
                this.showError(`Erreur de déconnexion: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur de déconnexion: ${error.message}`);
        }
    }

    async inviteBot() {
        try {
            console.log('Tentative d\'invitation du bot...');
            
            // Get bot status to retrieve bot ID
            const status = await window.electronAPI.getBotStatus();
            console.log('Statut du bot:', status);
            
            if (!status.connected || !status.user || !status.user.id) {
                console.log('Bot non connecté ou informations manquantes:', {
                    connected: status.connected,
                    hasUser: !!status.user,
                    hasUserId: !!(status.user && status.user.id)
                });
                this.showError('Veuillez connecter un bot avant de générer un lien d\'invitation');
                return;
            }

            const botId = status.user.id;
            console.log('Bot ID récupéré:', botId);
            
            // Generate Discord OAuth2 invitation URL with required permissions
            const permissions = [
                '8'      // Manage Channels
            ].join('%20');

            const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=${permissions}&integration_type=0&scope=bot%20applications.commands`;
            console.log('URL d\'invitation générée:', inviteUrl);
            
            // Open the invitation URL in the default browser
            window.open(inviteUrl, '_blank');
            
            this.showSuccess('Lien d\'invitation du bot ouvert dans votre navigateur!');
            
        } catch (error) {
            console.error('Error inviting bot:', error);
            this.showError(`Erreur lors de la génération du lien d'invitation: ${error.message}`);
        }
    }

    async loadGuilds() {
        try {
            const result = await window.electronAPI.getGuilds();
            if (result.success) {
                this.servers = result.guilds;
                this.renderServers();
            } else {
                this.showError(`Erreur lors du chargement des serveurs: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur lors du chargement des serveurs: ${error.message}`);
        }
    }

    renderServers() {
        this.serverList.innerHTML = '';
        
        this.servers.forEach(server => {
            // Check if server needs reload (missing name or icon)
            const needsReload = !server.name || !server.icon;
            
            const serverElement = document.createElement('div');
            serverElement.className = 'server-item';
            serverElement.setAttribute('data-server-id', server.id);
            if (needsReload) {
                serverElement.classList.add('server-needs-refresh');
            }
            
            serverElement.innerHTML = `
                ${server.icon ? 
                    `<img src="${server.icon}" alt="${server.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                    `<div style="width: 32px; height: 32px; background-color: #5865F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${server.name ? server.name.charAt(0).toUpperCase() : '?'}</div>`
                }
                <span class="server-name">${server.name || 'Serveur sans nom'}</span>
                ${needsReload ? '<div class="refresh-indicator" title="Informations incomplètes - Cliquez pour recharger">⟳</div>' : ''}
            `;
            
            serverElement.addEventListener('click', () => {
                if (needsReload) {
                    this.refreshServerInfo(server);
                } else {
                    this.selectServer(server);
                }
            });
            
            this.serverList.appendChild(serverElement);
        });
        
        // Auto-refresh servers with missing info after a delay
        setTimeout(() => {
            this.serversWithMissingInfo = this.servers.filter(server => !server.name || !server.icon);
            if (this.serversWithMissingInfo.length > 0) {
                this.refreshMissingServerInfo();
            }
        }, 2000); // Wait 2 seconds before auto-refresh
    }

    async refreshServerInfo(server) {
        if (!server || !server.id) return;
        
        // Show loading indicator
        const serverElement = document.querySelector(`[data-server-id="${server.id}"]`);
        if (serverElement) {
            serverElement.classList.add('refreshing');
        }
        
        try {
            // Re-fetch guild information
            const result = await window.electronAPI.getGuildInfo(server.id);
            if (result.success && result.guild) {
                // Update server in the list
                const index = this.servers.findIndex(s => s.id === server.id);
                if (index !== -1) {
                    this.servers[index] = { ...this.servers[index], ...result.guild };
                    this.renderServers();
                    this.showSuccess(`Informations du serveur "${result.guild.name || server.name}" mises à jour`);
                }
            } else {
                this.showError(`Impossible de recharger les informations du serveur: ${result.error || 'Erreur inconnue'}`);
            }
        } catch (error) {
            this.showError(`Erreur lors du rechargement: ${error.message}`);
        } finally {
            // Remove loading indicator
            if (serverElement) {
                serverElement.classList.remove('refreshing');
            }
        }
    }

    async refreshMissingServerInfo() {
        if (!this.serversWithMissingInfo || this.serversWithMissingInfo.length === 0) return;
        
        this.showInfo('Rechargement des informations des serveurs incomplets...');
        
        const refreshPromises = this.serversWithMissingInfo.map(async (server) => {
            try {
                const result = await window.electronAPI.getGuildInfo(server.id);
                if (result.success && result.guild) {
                    const index = this.servers.findIndex(s => s.id === server.id);
                    if (index !== -1) {
                        this.servers[index] = { ...this.servers[index], ...result.guild };
                        return { success: true, serverId: server.id, guild: result.guild };
                    }
                }
                return { success: false, serverId: server.id, error: result.error };
            } catch (error) {
                return { success: false, serverId: server.id, error: error.message };
            }
        });
        
        try {
            const results = await Promise.all(refreshPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            if (successful.length > 0) {
                this.renderServers();
                this.showSuccess(`${successful.length} serveur(s) mis à jour avec succès`);
            }
            
            if (failed.length > 0) {
                this.showError(`${failed.length} serveur(s) n'ont pas pu être mis à jour`);
            }
        } catch (error) {
            this.showError(`Erreur lors du rechargement automatique: ${error.message}`);
        }
    }

    async selectServer(server) {
        // Update active server
        document.querySelectorAll('.server-item').forEach(item => {
            item.classList.remove('active');
        });
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
        
        this.currentGuild = server;
        this.serverName.textContent = server.name || 'Serveur sans nom';
        
        // Load channels for this server
        if (server.id) {
            await this.loadChannels(server.id);
        }
    }

    async loadChannels(guildId) {
        try {
            const result = await window.electronAPI.getChannels(guildId);
            if (result.success) {
                this.channels = result.channels;
                this.renderChannels();
            } else {
                // Handle specific error cases
                if (result.error.includes('Missing Access') || result.error.includes('permission')) {
                    this.showError('❌ Permission refusée: Le bot n\'a pas accès aux canaux de ce serveur.');
                } else if (result.error.includes('Guild not found')) {
                    this.showError('❌ Serveur introuvable: Le serveur n\'existe plus ou le bot n\'y a pas accès.');
                } else {
                    this.showError(`❌ Erreur lors du chargement des canaux: ${result.error}`);
                }
            }
        } catch (error) {
            this.showError(`❌ Erreur de connexion: ${error.message}`);
        }
    }

    renderChannels() {
        this.channelList.innerHTML = '';
        
        this.channels.forEach(category => {
            if (category.type === 'category') {
                // Create category header
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-header';
                categoryElement.innerHTML = `
                    <span class="category-arrow">▼</span>
                    <span class="category-name">${category.name.toUpperCase()}</span>
                    <span class="category-channel-count">${category.channels.length}</span>
                `;
                
                // Create category container
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'category-container';
                
                // Add channels to category
                category.channels.forEach(channel => {
                    const channelElement = document.createElement('div');
                    channelElement.className = 'channel-item';
                    
                    if (channel.type === 'voice') {
                        channelElement.innerHTML = `
                            <span class="channel-icon">🔊</span>
                            <span class="channel-name">${channel.name || 'canal-sans-nom'}</span>
                            <button class="delete-channel-btn" data-channel-id="${channel.id}" title="Supprimer le canal">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        `;
                    } else {
                        channelElement.innerHTML = `
                            <span class="channel-icon">#</span>
                            <span class="channel-name">${channel.name || 'canal-sans-nom'}</span>
                            <button class="delete-channel-btn" data-channel-id="${channel.id}" title="Supprimer le canal">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        `;
                    }
                    
                    // Add delete functionality for text channels
                    if (channel.type !== 'voice') {
                        const deleteBtn = channelElement.querySelector('.delete-channel-btn');
                        if (deleteBtn) {
                            deleteBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.deleteChannel(channel.id);
                            });
                        }
                        
                        // Add click event listener to select the channel
                        channelElement.addEventListener('click', (e) => {
                            // Don't select if clicking on delete button
                            if (e.target.closest('.delete-channel-btn')) {
                                return;
                            }
                            this.selectChannel(channel);
                        });
                    }
                    
                    categoryContainer.appendChild(channelElement);
                });
                
                // Add toggle functionality
                categoryElement.addEventListener('click', () => this.toggleCategory(categoryElement, categoryContainer));
                
                this.channelList.appendChild(categoryElement);
                this.channelList.appendChild(categoryContainer);
            }
        });
    }

    toggleCategory(categoryElement, categoryContainer) {
        const arrow = categoryElement.querySelector('.category-arrow');
        const isCollapsed = categoryContainer.style.display === 'none';
        
        if (isCollapsed) {
            categoryContainer.style.display = 'block';
            arrow.textContent = '▼';
            categoryElement.classList.remove('collapsed');
        } else {
            categoryContainer.style.display = 'none';
            arrow.textContent = '▶';
            categoryElement.classList.add('collapsed');
        }
    }

    async selectChannel(channel) {
        // Prevent event bubbling from category toggle
        if (event && event.currentTarget) {
            event.stopPropagation();
        }
        
        // Update active channel
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
        
        this.currentChannel = channel;
        this.channelName.textContent = `#${channel.name || 'général'}`;
        this.channelTopic.textContent = channel.topic || 'Aucune description';
        
        // Enable message input
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        
        // Clear previous refresh interval
        this.clearRefreshInterval();
        
        // Load messages for this channel
        if (channel.id) {
            await this.loadMessages(channel.id);
            // Start auto-refresh
            this.startAutoRefresh();
        }
    }

    async loadMessages(channelId, silent = false) {
        try {
            const result = await window.electronAPI.getMessages(channelId);
            if (result.success) {
                // Check if there are new messages
                const hasNewMessages = this.messages.length !== result.messages.length || 
                    JSON.stringify(this.messages) !== JSON.stringify(result.messages);
                
                this.messages = result.messages;
                this.renderMessages();
                
                if (hasNewMessages && !silent) {
                    this.showSuccess('Messages actualisés');
                }
            } else {
                // Handle specific error cases
                if (!silent) {
                    if (result.error.includes('Missing Access') || result.error.includes('permission')) {
                        this.showError('❌ Permission refusée: Le bot n\'a pas accès à ce canal. Vérifiez les permissions du bot sur le serveur Discord.');
                    } else if (result.error.includes('Channel not found')) {
                        this.showError('❌ Canal introuvable: Le canal n\'existe plus ou le bot n\'y a pas accès.');
                    } else {
                        this.showError(`❌ Erreur lors du chargement des messages: ${result.error}`);
                    }
                }
            }
        } catch (error) {
            if (!silent) {
                this.showError(`❌ Erreur de connexion: ${error.message}`);
            }
        }
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';
        
        if (this.messages.length === 0) {
            this.messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                    </div>
                    <h3>Aucun message dans ce canal</h3>
                    <p>Soyez le premier à envoyer un message !</p>
                </div>
            `;
            return;
        }
        
        // Extract unique users from messages for mentions
        this.extractUsersFromMessages();
        
        // Sort messages by timestamp (newest first for display)
        const sortedMessages = [...this.messages].sort((a, b) => a.timestamp - b.timestamp);
        
        sortedMessages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <div class="message-avatar" style="background-image: url('${message.authorAvatar || ''}')">
                    ${message.authorAvatar ? '' : (message.author ? message.author.charAt(0).toUpperCase() : '?')}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${message.author || 'Utilisateur inconnu'}</span>
                        <span class="message-timestamp">${message.timestamp ? new Date(message.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : new Date().toLocaleString('fr-FR')}</span>
                        ${message.replyto ? `<span class="message-replyto"> → ${message.replyto}</span>` : ''}
                    </div>
                    <div class="message-text">${this.processMentions(message.content || '')}</div>
                    ${message.attachments && message.attachments.length > 0 ? this.renderAttachments(message.attachments) : ''}
                </div>
                <div class="message-actions">
                    <button class="reply-btn" data-message-id="${message.id}" data-message-author="${message.author}" title="Répondre à ce message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1.4-2.3-4-4.1-7-4.1z"/>
                        </svg>
                    </button>
                    <button class="delete-message-btn" data-message-id="${message.id}" title="Supprimer le message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add reply functionality
            const replyBtn = messageElement.querySelector('.reply-btn');
            if (replyBtn) {
                replyBtn.addEventListener('click', () => this.startReply(message));
            }
            
            // Add delete functionality
            const deleteBtn = messageElement.querySelector('.delete-message-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteMessage(message.id));
            }
            
            this.messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    renderAttachments(attachments) {
        return attachments.map(att => `
            <div class="attachment">
                <a href="${att.url || '#'}" target="_blank">${att.name || 'Pièce jointe'}</a>
            </div>
        `).join('');
    }

    startReply(message) {
        this.replyingTo = message;
        this.messageInput.focus();
        this.messageInput.placeholder = `Répondre à ${message.author}...`;
        this.messageInput.style.backgroundColor = '#2f3136';
        
        // Add reply indicator
        const replyIndicator = document.createElement('div');
        replyIndicator.className = 'reply-indicator';
        replyIndicator.innerHTML = `
            <span class="reply-text">Répondre à <strong>${message.author}</strong></span>
            <button class="cancel-reply-btn" title="Annuler la réponse">×</button>
        `;
        
        // Insert before message input
        const inputContainer = this.messageInput.parentElement;
        inputContainer.parentElement.insertBefore(replyIndicator, inputContainer);
        
        // Add cancel functionality
        const cancelBtn = replyIndicator.querySelector('.cancel-reply-btn');
        cancelBtn.addEventListener('click', () => this.cancelReply());
        
        // Add Enter key handler for reply
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelReply();
            }
        });
    }

    cancelReply() {
        this.replyingTo = null;
        this.messageInput.placeholder = `Message #${this.currentChannel ? this.currentChannel.name : 'général'}`;
        this.messageInput.style.backgroundColor = '';
        
        // Remove reply indicator
        const replyIndicator = document.querySelector('.reply-indicator');
        if (replyIndicator) {
            replyIndicator.remove();
        }
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.currentChannel) return;
        
        this.sendBtn.disabled = true;
        
        try {
            let result;
            if (this.replyingTo) {
                // Send as reply
                result = await window.electronAPI.replyToMessage(
                    this.currentChannel.id, 
                    this.replyingTo.id, 
                    content
                );
            } else {
                // Send as normal message
                result = await window.electronAPI.sendMessage(this.currentChannel.id, content);
            }
            
            if (result.success) {
                this.messageInput.value = '';
                this.cancelReply(); // Clear reply state
                // Refresh messages immediately after sending
                await this.loadMessages(this.currentChannel.id, true);
                this.showSuccess(this.replyingTo ? 'Réponse envoyée' : 'Message envoyé');
            } else {
                this.showError(`Erreur lors de l'envoi: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur lors de l'envoi: ${error.message}`);
        } finally {
            this.sendBtn.disabled = false;
        }
    }

    async deleteMessage(messageId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message?')) return;
        
        if (!this.currentChannel || !messageId) {
            this.showError('Canal ou message non valide');
            return;
        }
        
        try {
            const result = await window.electronAPI.deleteMessage(this.currentChannel.id, messageId);
            if (result.success) {
                // Refresh messages immediately after deletion
                await this.loadMessages(this.currentChannel.id, true);
                this.showSuccess('Message supprimé');
            } else {
                this.showError(`Erreur lors de la suppression: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur lors de la suppression: ${error.message}`);
        }
    }

    async refreshMessages() {
        if (this.currentChannel) {
            await this.loadMessages(this.currentChannel.id);
            this.showSuccess('Messages rafraîchis');
        }
    }

    startAutoRefresh() {
        // Clear any existing interval
        this.clearRefreshInterval();
        
        // Set up new interval
        this.refreshInterval = setInterval(async () => {
            if (this.currentChannel && this.isConnected) {
                await this.loadMessages(this.currentChannel.id, true);
            }
        }, this.refreshIntervalTime);
        
        console.log(`Auto-refresh démarré: toutes les ${this.refreshIntervalTime / 1000} secondes`);
    }

    clearRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Auto-refresh arrêté');
        }
    }

    async clearAllMessages() {
        if (!this.currentChannel || !confirm('Êtes-vous sûr de vouloir supprimer tous les messages de ce canal? Cette action est irréversible.')) {
            return;
        }
        
        // This would need to be implemented in the main process
        // For now, we'll just refresh
        await this.refreshMessages();
    }

    showBulkDeleteDialog() {
        const count = prompt('Combien de messages récents voulez-vous supprimer?');
        if (count && !isNaN(count)) {
            // This would need to be implemented in the main process
            this.showInfo(`Suppression de ${count} messages (fonctionnalité à implémenter)`);
        }
    }

    showBotInfo() {
        if (!this.isConnected) {
            this.showError('Le bot n\'est pas connecté');
            return;
        }
        
        // This would show detailed bot information
        this.showInfo('Informations du bot (fonctionnalité à implémenter)');
    }

    showBotStatus() {
        this.checkBotStatus();
        this.showInfo(this.isConnected ? 'Bot connecté' : 'Bot déconnecté');
    }

    exportLogs() {
        const logs = {
            timestamp: new Date().toISOString(),
            connected: this.isConnected,
            currentGuild: this.currentGuild,
            currentChannel: this.currentChannel,
            messages: this.messages
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discord-bot-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccess('Logs exportés');
    }

    showSettings() {
        this.showInfo('Paramètres (fonctionnalité à implémenter)');
    }

    toggleAutoRefresh() {
        if (this.refreshInterval) {
            this.clearRefreshInterval();
            this.toggleAutoRefreshBtn.textContent = 'Auto-refresh: OFF';
            this.toggleAutoRefreshBtn.style.backgroundColor = '#ed4245';
            this.showInfo('Auto-refresh désactivé');
        } else {
            if (this.currentChannel && this.isConnected) {
                this.startAutoRefresh();
                this.toggleAutoRefreshBtn.textContent = 'Auto-refresh: ON';
                this.toggleAutoRefreshBtn.style.backgroundColor = '#5865F2';
                this.showInfo('Auto-refresh activé');
            } else {
                this.showError('Veuillez sélectionner un canal et connecter le bot');
            }
        }
    }

    enableBotFeatures() {
        // Enable all bot-related features
        document.querySelectorAll('.action-btn').forEach(btn => {
            if (btn.id !== 'connectBtn') {
                btn.disabled = false;
            }
        });
    }

    disableBotFeatures() {
        // Disable all bot-related features
        document.querySelectorAll('.action-btn').forEach(btn => {
            if (btn.id !== 'connectBtn') {
                btn.disabled = true;
            }
        });
        
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
    }

    clearAllData() {
        this.currentGuild = null;
        this.currentChannel = null;
        this.servers = [];
        this.channels = [];
        this.messages = [];
        this.replyingTo = null;
        
        // Clear auto-refresh when clearing data
        this.clearRefreshInterval();
        
        // Clear reply state
        this.cancelReply();
        
        this.serverList.innerHTML = '';
        this.channelList.innerHTML = '';
        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h3>Bienvenue sur Discord Bot Manager</h3>
                <p>Connectez votre bot pour commencer à gérer vos serveurs Discord</p>
            </div>
        `;
        
        this.serverName.textContent = 'Sélectionnez un serveur';
        this.channelName.textContent = '# général';
        this.channelTopic.textContent = 'Bienvenue sur le bot manager';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="notification-text">${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 40px;
                    right: 20px;
                    max-width: 400px;
                    padding: 16px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 3000;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }
                .notification-icon {
                    margin-right: 12px;
                    font-size: 18px;
                }
                .notification-text {
                    line-height: 1.4;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 12px;
                    opacity: 0.8;
                    transition: opacity 0.17s ease;
                }
                .notification-close:hover {
                    opacity: 1;
                }
                .notification.success {
                    background-color: #3ba55c;
                }
                .notification.error {
                    background-color: #ed4245;
                }
                .notification.info {
                    background-color: #5865F2;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mention system methods
    extractUsersFromMessages() {
        const users = new Set();
        this.messages.forEach(message => {
            if (message.author) {
                // Extract username from mention format or use raw author
                const mentionMatch = message.author.match(/@(.+)/);
                const username = mentionMatch ? mentionMatch[1] : message.author;
                users.add(username);
            }
        });
        this.mentionUsers = Array.from(users).sort();
    }

    processMentions(content) {
        if (!content) return '';
        
        // Process @mentions in message content
        return content.replace(/@(\w+)/g, (match, username) => {
            return `<span class="mention">@${username}</span>`;
        });
    }

    handleMessageInput(e) {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Check if user is typing a mention
        const beforeCursor = value.substring(0, cursorPos);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            const searchQuery = mentionMatch[1];
            this.showMentions(searchQuery, cursorPos - mentionMatch[0].length);
        } else {
            this.hideMentions();
        }
    }

    showMentions(query, startPos) {
        if (!query || query.length === 0) {
            this.hideMentions();
            return;
        }
        
        // Filter users based on query
        const filteredUsers = this.mentionUsers.filter(user => 
            user.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredUsers.length === 0) {
            this.hideMentions();
            return;
        }
        
        // Remove existing mentions dropdown
        this.hideMentions();
        
        // Create mentions dropdown
        const mentionsDropdown = document.createElement('div');
        mentionsDropdown.className = 'mentions-dropdown';
        mentionsDropdown.innerHTML = filteredUsers.slice(0, 10).map((user, index) => `
            <div class="mention-item ${index === 0 ? 'selected' : ''}" data-username="${user}">
                <span class="mention-avatar">${user.charAt(0).toUpperCase()}</span>
                <span class="mention-username">${user}</span>
            </div>
        `).join('');
        
        // Position dropdown near cursor
        const inputRect = this.messageInput.getBoundingClientRect();
        mentionsDropdown.style.left = inputRect.left + 'px';
        mentionsDropdown.style.bottom = (window.innerHeight - inputRect.top + 5) + 'px';
        
        document.body.appendChild(mentionsDropdown);
        this.showingMentions = true;
        this.selectedMentionIndex = 0;
        
        // Add click handlers
        mentionsDropdown.querySelectorAll('.mention-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMentionUser(item.dataset.username);
            });
        });
    }

    hideMentions() {
        const existingDropdown = document.querySelector('.mentions-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        this.showingMentions = false;
        this.selectedMentionIndex = -1;
    }

    navigateMentions(direction) {
        if (!this.showingMentions) return;
        
        const items = document.querySelectorAll('.mention-item');
        if (items.length === 0) return;
        
        // Remove previous selection
        items[this.selectedMentionIndex]?.classList.remove('selected');
        
        // Update index
        this.selectedMentionIndex += direction;
        if (this.selectedMentionIndex < 0) this.selectedMentionIndex = items.length - 1;
        if (this.selectedMentionIndex >= items.length) this.selectedMentionIndex = 0;
        
        // Add new selection
        items[this.selectedMentionIndex].classList.add('selected');
        
        // Scroll into view if needed
        items[this.selectedMentionIndex].scrollIntoView({ block: 'nearest' });
    }

    selectMention() {
        if (!this.showingMentions) return;
        
        const selectedItem = document.querySelector('.mention-item.selected');
        if (selectedItem) {
            this.selectMentionUser(selectedItem.dataset.username);
        }
    }

    selectMentionUser(username) {
        const value = this.messageInput.value;
        const cursorPos = this.messageInput.selectionStart;
        
        // Find the @mention start position
        const beforeCursor = value.substring(0, cursorPos);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            // Replace the partial mention with the full username
            const newValue = value.substring(0, cursorPos - mentionMatch[0].length) + 
                           '@' + username + ' ' + 
                           value.substring(cursorPos);
            
            this.messageInput.value = newValue;
            this.messageInput.selectionStart = this.messageInput.selectionEnd = 
                cursorPos - mentionMatch[0].length + username.length + 2;
        }
        
        this.hideMentions();
        this.messageInput.focus();
    }

    // Auto-response system methods
    setupMessageEventListeners() {
        // Listen for new messages from main process
        window.electronAPI.onNewMessage((event, data) => {
            if (this.currentChannel && data.channelId === this.currentChannel.id) {
                // Add new message to the list
                this.messages.push(data.message);
                this.renderMessages();
            }
        });

        window.electronAPI.onMessageUpdated((event, data) => {
            if (this.currentChannel && data.channelId === this.currentChannel.id) {
                // Update message in the list
                const messageIndex = this.messages.findIndex(msg => msg.id === data.messageId);
                if (messageIndex !== -1) {
                    this.messages[messageIndex].content = data.newContent;
                    this.renderMessages();
                }
            }
        });

        window.electronAPI.onMessageDeleted((event, data) => {
            if (this.currentChannel && data.channelId === this.currentChannel.id) {
                // Remove message from the list
                this.messages = this.messages.filter(msg => msg.id !== data.messageId);
                this.renderMessages();
            }
        });
    }

    async loadAutoResponses() {
        try {
            const result = await window.electronAPI.getAutoResponses();
            if (result.success) {
                this.autoResponses = result.responses;
            }
        } catch (error) {
            console.error('Error loading auto-responses:', error);
        }
    }

    showResponsesModal() {
        this.responsesModal.classList.add('show');
        this.renderAutoResponses();
    }

    hideResponsesModal() {
        this.responsesModal.classList.remove('show');
    }

    showResponseForm(responseId = null) {
        this.editingResponseId = responseId;
        
        if (responseId) {
            const response = this.autoResponses.find(r => r.id === responseId);
            if (!response) return;

            this.editingResponseId = responseId;
            this.responseFormTitle.textContent = 'Modifier la réponse automatique';

            this.responseTrigger.value = response.trigger;
            this.triggerType.value = response.triggerType;
            this.responseType.value = response.type;
            this.responseEnabled.checked = response.enabled;
            this.isEmbedResponse.checked = response.isEmbed || false;

            this.toggleEmbedResponseFields();

            if (response.isEmbed && response.embed) {
                this.responseEmbedTitle.value = response.embed.title || '';
                this.responseEmbedDescription.value = response.embed.description || '';
                this.responseEmbedColor.value = response.embed.color || '#5865F2';
                this.responseEmbedAuthor.value = response.embed.author?.name || '';
                this.responseEmbedThumbnail.value = response.embed.thumbnail || '';
                this.responseEmbedImage.value = response.embed.image || '';
                this.responseEmbedFooter.value = response.embed.footer?.text || '';
                this.responseEmbedTimestamp.checked = response.embed.timestamp || false;
            } else {
                this.responseText.value = response.response || '';
            }
        } else {
            this.responseFormTitle.textContent = 'Ajouter une réponse automatique';
            this.clearResponseForm();
        }
        
        this.responseFormModal.classList.add('show');
    }

    hideResponseForm() {
        this.responseFormModal.classList.remove('show');
        this.clearResponseForm();
        this.editingResponseId = null;
    }

    clearResponseForm() {
        this.responseTrigger.value = '';
        this.triggerType.value = 'contains';
        this.responseType.value = 'reply';
        this.responseEnabled.checked = true;
        this.isEmbedResponse.checked = false;
        
        // Clear embed fields
        this.responseEmbedTitle.value = '';
        this.responseEmbedDescription.value = '';
        this.responseEmbedColor.value = '#5865F2';
        this.responseEmbedAuthor.value = '';
        this.responseEmbedThumbnail.value = '';
        this.responseEmbedImage.value = '';
        this.responseEmbedFooter.value = '';
        this.responseEmbedTimestamp.checked = false;
        
        // Clear text field
        this.responseText.value = '';
        
        this.toggleEmbedResponseFields();
    }

    async saveResponse() {
        const responseConfig = {
            trigger: this.responseTrigger.value.trim(),
            triggerType: this.triggerType.value,
            type: this.responseType.value,
            enabled: this.responseEnabled.checked,
            isEmbed: this.isEmbedResponse.checked
        };

        if (responseConfig.isEmbed) {
            responseConfig.embed = this.getEmbedResponseData();
        } else {
            responseConfig.response = this.responseText.value.trim();
        }

        if (!responseConfig.trigger) {
            this.showError('Veuillez entrer un déclencheur');
            return;
        }

        if (!responseConfig.isEmbed && !responseConfig.response) {
            this.showError('Veuillez entrer une réponse');
            return;
        }

        if (responseConfig.isEmbed && !responseConfig.embed.title && !responseConfig.embed.description) {
            this.showError('Veuillez entrer au moins un titre ou une description pour l\'embed');
            return;
        }

        try {
            if (this.editingResponseId) {
                await window.electronAPI.updateAutoResponse(this.editingResponseId, responseConfig);
                this.showSuccess('Réponse mise à jour avec succès');
            } else {
                await window.electronAPI.addAutoResponse(responseConfig);
                this.showSuccess('Réponse ajoutée avec succès');
            }
            this.hideResponseForm();
            this.renderAutoResponses();
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    toggleEmbedResponseFields() {
        if (this.isEmbedResponse.checked) {
            this.embedResponseFields.style.display = 'block';
            this.textResponseFields.style.display = 'none';
        } else {
            this.embedResponseFields.style.display = 'none';
            this.textResponseFields.style.display = 'block';
        }
    }

    getEmbedResponseData() {
        const authorName = this.responseEmbedAuthor.value.trim();
        const thumbnail = this.responseEmbedThumbnail.value.trim();
        const image = this.responseEmbedImage.value.trim();
        const footerText = this.responseEmbedFooter.value.trim();
        
        return {
            title: this.responseEmbedTitle.value.trim(),
            description: this.responseEmbedDescription.value.trim(),
            color: this.responseEmbedColor.value,
            author: authorName ? {
                name: authorName
            } : undefined,
            thumbnail: thumbnail || undefined,
            image: image || undefined,
            footer: footerText ? {
                text: footerText
            } : undefined,
            timestamp: this.responseEmbedTimestamp.checked
        };
    }

    renderAutoResponses() {
        this.responsesList.innerHTML = '';

        if (this.autoResponses.length === 0) {
            this.responsesList.innerHTML = `
                <div class="no-responses">
                    <p>Aucune réponse automatique configurée</p>
                    <p>Cliquez sur "Gérer les réponses" pour en ajouter</p>
                </div>
            `;
            return;
        }

        this.autoResponses.forEach(response => {
            const responseElement = document.createElement('div');
            responseElement.className = `response-item ${response.enabled ? 'enabled' : 'disabled'}`;
            
            let responseContent = '';
            if (response.isEmbed && response.embed) {
                responseContent = `
                    <div class="response-text">
                        <strong>Embed:</strong> ${response.embed.title || 'Sans titre'}
                        ${response.embed.description ? `<br><em>${response.embed.description.substring(0, 100)}${response.embed.description.length > 100 ? '...' : ''}</em>` : ''}
                    </div>
                `;
            } else {
                responseContent = `<div class="response-text">${response.response}</div>`;
            }
            
            responseElement.innerHTML = `
                <div class="response-info">
                    <div class="response-trigger">
                        <strong>Déclencheur:</strong> "${response.trigger}"
                        <span class="trigger-type">(${response.triggerType})</span>
                    </div>
                    ${responseContent}
                    <div class="response-type">Type: ${this.getTypeLabel(response.type)}</div>
                    <div class="response-status">
                        <span class="status-indicator ${response.enabled ? 'enabled' : 'disabled'}">
                            ${response.enabled ? '✓ Activé' : '✗ Désactivé'}
                        </span>
                    </div>
                </div>
                <div class="response-actions">
                    <button class="btn-sm btn-primary" onclick="botManager.editResponse('${response.id}')">Modifier</button>
                    <button class="btn-sm btn-danger" onclick="botManager.deleteResponse('${response.id}')">Supprimer</button>
                </div>
            `;

            this.responsesList.appendChild(responseElement);
        });
    }

    getTriggerTypeLabel(type) {
        const labels = {
            'contains': 'Contient',
            'startsWith': 'Commence par',
            'endsWith': 'Finit par',
            'exact': 'Exact',
            'regex': 'Regex'
        };
        return labels[type] || type;
    }

    getResponseTypeLabel(type) {
        const labels = {
            'reply': 'Réponse',
            'channel': 'Canal',
            'dm': 'MP'
        };
        return labels[type] || type;
    }

    async deleteResponse(responseId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse automatique?')) return;

        try {
            const result = await window.electronAPI.deleteAutoResponse(responseId);
            if (result.success) {
                this.autoResponses = result.responses;
                this.renderAutoResponses();
                this.showSuccess('Réponse supprimée');
            } else {
                this.showError(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    showQuickResponsesModal() {
        this.quickResponsesModal.classList.add('show');
        this.renderQuickResponses();
    }

    hideQuickResponsesModal() {
        this.quickResponsesModal.classList.remove('show');
    }

    renderQuickResponses() {
        this.quickResponsesGrid.innerHTML = '';

        const enabledResponses = this.autoResponses.filter(r => r.enabled);

        if (enabledResponses.length === 0) {
            this.quickResponsesGrid.innerHTML = `
                <div class="no-quick-responses">
                    <p>Aucune réponse rapide disponible</p>
                    <p>Activez des réponses automatiques pour les utiliser ici</p>
                </div>
            `;
            return;
        }

        enabledResponses.forEach(response => {
            const quickResponseElement = document.createElement('div');
            quickResponseElement.className = 'quick-response-item';
            quickResponseElement.innerHTML = `
                <div class="quick-response-trigger">${response.trigger}</div>
                <div class="quick-response-text">${response.response}</div>
                <button class="quick-response-btn" onclick="botManager.sendQuickResponse('${response.id}')">
                    Envoyer
                </button>
            `;

            this.quickResponsesGrid.appendChild(quickResponseElement);
        });
    }

    async sendQuickResponse(responseId) {
        if (!this.currentChannel) {
            this.showError('Veuillez sélectionner un canal');
            return;
        }

        try {
            const result = await window.electronAPI.sendQuickResponse(this.currentChannel.id, responseId);
            if (result.success) {
                this.showSuccess('Réponse envoyée');
                await this.loadMessages(this.currentChannel.id, true);
            } else {
                this.showError(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    toggleAutoResponses() {
        this.autoResponsesEnabled = !this.autoResponsesEnabled;
        this.toggleAutoResponsesBtn.textContent = `Auto-réponses: ${this.autoResponsesEnabled ? 'ON' : 'OFF'}`;
        this.toggleAutoResponsesBtn.style.backgroundColor = this.autoResponsesEnabled ? '#3ba55c' : '#ed4245';
        this.showInfo(`Auto-réponses ${this.autoResponsesEnabled ? 'activées' : 'désactivées'}`);
    }

    // Channel Management Methods
    showChannelModal() {
        if (!this.currentGuild) {
            this.showError('Veuillez sélectionner un serveur');
            return;
        }
        
        this.channelModal.classList.add('show');
        this.populateChannelCategories();
    }

    hideChannelModal() {
        this.channelModal.classList.remove('show');
        this.clearChannelForm();
    }

    clearChannelForm() {
        this.channelName.value = '';
        this.channelType.value = 'text';
        this.channelTopic.value = '';
        this.channelCategory.value = '';
    }

    populateChannelCategories() {
        const categorySelect = this.channelCategory;
        categorySelect.innerHTML = '<option value="">Aucune catégorie</option>';
        
        this.channels.forEach(category => {
            if (category.type === 'category') {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            }
        });
    }

    async createChannel() {
        const channelData = {
            name: this.channelName.value.trim(),
            type: this.channelType.value,
            topic: this.channelTopic.value.trim(),
            parentId: this.channelCategory.value || null,
        };

        if (!channelData.name) {
            this.showError('Veuillez entrer un nom de canal');
            return;
        }

        try {
            const result = await window.electronAPI.createChannel(this.currentGuild.id, channelData);
            if (result.success) {
                this.hideChannelModal();
                this.showSuccess('Canal créé avec succès');
                await this.loadChannels(this.currentGuild.id);
            } else {
                this.showError(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    async deleteChannel(channelId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce canal? Cette action est irréversible.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteChannel(channelId);
            if (result.success) {
                this.showSuccess('Canal supprimé avec succès');
                await this.loadChannels(this.currentGuild.id);
            } else {
                this.showError(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    // Embed Builder Methods
    showEmbedModal() {
        if (!this.currentChannel) {
            this.showError('Veuillez sélectionner un canal');
            return;
        }
        
        this.embedModal.classList.add('show');
        this.clearEmbedForm();
        this.updateEmbedPreview();
    }

    hideEmbedModal() {
        this.embedModal.classList.remove('show');
        this.clearEmbedForm();
    }

    clearEmbedForm() {
        this.embedTitle.value = '';
        this.embedDescription.value = '';
        this.embedColor.value = '#5865F2';
        this.embedAuthor.value = '';
        this.embedAuthorIcon.value = '';
        this.embedThumbnail.value = '';
        this.embedImage.value = '';
        this.embedFooter.value = '';
        this.embedTimestamp.checked = false;
    }

    updateEmbedPreview() {
        const embedData = this.getEmbedData();
        this.renderEmbedPreview(embedData);
    }

    getEmbedData() {
        const authorName = this.embedAuthor.value.trim();
        const authorIcon = this.embedAuthorIcon.value.trim();
        const thumbnail = this.embedThumbnail.value.trim();
        const image = this.embedImage.value.trim();
        const footerText = this.embedFooter.value.trim();
        
        return {
            title: this.embedTitle.value.trim(),
            description: this.embedDescription.value.trim(),
            color: this.embedColor.value,
            author: authorName ? {
                name: authorName,
                iconURL: authorIcon || undefined
            } : undefined,
            thumbnail: thumbnail || undefined,
            image: image || undefined,
            footer: footerText ? {
                text: footerText
            } : undefined,
            timestamp: this.embedTimestamp.checked
        };
    }

    renderEmbedPreview(embedData) {
        let previewHTML = '<div class="embed-preview-container">';
        
        if (embedData.author && embedData.author.name) {
            previewHTML += `
                <div class="embed-author">
                    ${embedData.author.iconURL ? `<img src="${embedData.author.iconURL}" class="embed-author-icon">` : ''}
                    <span class="embed-author-name">${embedData.author.name}</span>
                </div>
            `;
        }
        
        if (embedData.title) {
            previewHTML += `<div class="embed-title">${embedData.title}</div>`;
        }
        
        if (embedData.description) {
            previewHTML += `<div class="embed-description">${embedData.description}</div>`;
        }
        
        if (embedData.thumbnail) {
            previewHTML += `<img src="${embedData.thumbnail}" class="embed-thumbnail">`;
        }
        
        if (embedData.image) {
            previewHTML += `<img src="${embedData.image}" class="embed-image">`;
        }
        
        if (embedData.footer || embedData.timestamp) {
            previewHTML += `
                <div class="embed-footer">
                    ${embedData.footer ? `<span class="embed-footer-text">${embedData.footer.text}</span>` : ''}
                    ${embedData.timestamp ? `<span class="embed-timestamp">${new Date().toLocaleString('fr-FR')}</span>` : ''}
                </div>
            `;
        }
        
        previewHTML += '</div>';
        
        this.embedPreview.innerHTML = previewHTML;
        
        // Apply color to left border
        const previewContainer = this.embedPreview.querySelector('.embed-preview-container');
        if (previewContainer && embedData.color) {
            previewContainer.style.borderLeftColor = embedData.color;
        }
    }

    async sendEmbed() {
        const embedData = this.getEmbedData();
        
        if (!embedData.title && !embedData.description && !embedData.image && !embedData.thumbnail) {
            this.showError('Veuillez ajouter au moins un titre, une description ou une image');
            return;
        }

        try {
            const result = await window.electronAPI.sendEmbed(this.currentChannel.id, embedData);
            if (result.success) {
                this.hideEmbedModal();
                this.showSuccess('Embed envoyé avec succès');
                await this.loadMessages(this.currentChannel.id, true);
            } else {
                this.showError(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur: ${error.message}`);
        }
    }

    // Embed Presets Management Methods
    loadEmbedPresets() {
        const savedPresets = localStorage.getItem('embedPresets');
        if (savedPresets) {
            this.embedPresets = JSON.parse(savedPresets);
        } else {
            // Add some default presets
            this.embedPresets = [
                {
                    id: 'default-welcome',
                    name: 'Message de bienvenue',
                    description: 'Un embed d\'accueil simple',
                    data: {
                        title: 'Bienvenue !',
                        description: 'Nous sommes ravis de vous accueillir sur notre serveur !',
                        color: '#5865F2',
                        timestamp: true
                    }
                },
                {
                    id: 'default-error',
                    name: 'Message d\'erreur',
                    description: 'Un embed pour signaler une erreur',
                    data: {
                        title: 'Erreur',
                        description: 'Une erreur est survenue. Veuillez réessayer plus tard.',
                        color: '#ed4245',
                        timestamp: true
                    }
                },
                {
                    id: 'default-success',
                    name: 'Message de succès',
                    description: 'Un embed pour confirmer une action réussie',
                    data: {
                        title: 'Succès',
                        description: 'L\'action a été effectuée avec succès !',
                        color: '#3ba55c',
                        timestamp: true
                    }
                }
            ];
            this.saveEmbedPresets();
        }
        this.updateEmbedPresetSelect();
    }

    saveEmbedPresets() {
        localStorage.setItem('embedPresets', JSON.stringify(this.embedPresets));
    }

    // Token Management Methods
    async saveBotToken(token) {
        try {
            const result = await window.electronAPI.setStorageData('botToken', token);
            if (!result.success) {
                console.error('Error saving token:', result.error);
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    async getSavedToken() {
        try {
            const result = await window.electronAPI.getStorageData('botToken');
            return result.success ? result.value : null;
        } catch (error) {
            console.error('Error getting saved token:', error);
            return null;
        }
    }

    async clearSavedToken() {
        try {
            const result = await window.electronAPI.removeStorageData('botToken');
            if (!result.success) {
                console.error('Error clearing token:', result.error);
            }
        } catch (error) {
            console.error('Error clearing token:', error);
        }
    }

    async tryAutoConnect() {
        const savedToken = await this.getSavedToken();
        if (savedToken) {
            this.showLoading(true);
            this.showInfo('Tentative de reconnexion automatique...');
            
            try {
                const result = await window.electronAPI.connectBot(savedToken);
                
                if (result.success) {
                    this.updateConnectionStatus({ connected: true, user: { tag: result.user } });
                    this.showSuccess('Bot reconnecté automatiquement!');
                } else {
                    // Clear invalid token
                    await this.clearSavedToken();
                    this.showError(`Erreur de reconnexion automatique: ${result.error}`);
                }
            } catch (error) {
                // Clear invalid token
                await this.clearSavedToken();
                this.showError(`Erreur de reconnexion automatique: ${error.message}`);
            } finally {
                this.showLoading(false);
            }
        }
    }

    updateEmbedPresetSelect() {
        this.embedPresetSelect.innerHTML = '<option value="">-- Choisir un preset --</option>';
        
        this.embedPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.name;
            this.embedPresetSelect.appendChild(option);
        });
    }

    loadEmbedPreset() {
        const presetId = this.embedPresetSelect.value;
        if (!presetId) return;
        
        const preset = this.embedPresets.find(p => p.id === presetId);
        if (preset) {
            this.applyEmbedPreset(preset.data);
        }
    }

    applyEmbedPreset(embedData) {
        this.embedTitle.value = embedData.title || '';
        this.embedDescription.value = embedData.description || '';
        this.embedColor.value = embedData.color || '#5865F2';
        this.embedAuthor.value = embedData.author?.name || '';
        this.embedAuthorIcon.value = embedData.author?.iconURL || '';
        this.embedThumbnail.value = embedData.thumbnail || '';
        this.embedImage.value = embedData.image || '';
        this.embedFooter.value = embedData.footer?.text || '';
        this.embedTimestamp.checked = embedData.timestamp || false;
        
        this.updateEmbedPreview();
    }

    showEmbedPresetsModal() {
        this.embedPresetsModal.classList.add('show');
        this.renderPresetsList();
    }

    hideEmbedPresetsModal() {
        this.embedPresetsModal.classList.remove('show');
    }

    showEmbedPresetForm(preset = null) {
        this.editingPresetId = preset ? preset.id : null;
        
        if (preset) {
            this.presetFormTitle.textContent = 'Modifier le Preset d\'Embed';
            this.presetName.value = preset.name;
            this.presetDescription.value = preset.description || '';
            
            // Apply preset data to current embed form for preview
            this.applyEmbedPreset(preset.data);
        } else {
            this.presetFormTitle.textContent = 'Créer un Preset d\'Embed';
            this.presetName.value = '';
            this.presetDescription.value = '';
            this.clearEmbedForm();
        }
        
        this.embedPresetFormModal.classList.add('show');
        this.updatePresetPreview();
    }

    hideEmbedPresetForm() {
        this.embedPresetFormModal.classList.remove('show');
        this.editingPresetId = null;
        this.presetName.value = '';
        this.presetDescription.value = '';
    }

    showSavePresetModal() {
        const embedData = this.getEmbedData();
        if (!embedData.title && !embedData.description && !embedData.image && !embedData.thumbnail) {
            this.showError('Veuillez d\'abord créer un embed avant de le sauvegarder comme preset');
            return;
        }
        
        this.presetFormTitle.textContent = 'Sauvegarder comme Preset';
        this.presetName.value = '';
        this.presetDescription.value = '';
        this.editingPresetId = null;
        
        this.embedPresetFormModal.classList.add('show');
        this.updatePresetPreview();
    }

    renderPresetsList() {
        this.presetsList.innerHTML = '';
        
        if (this.embedPresets.length === 0) {
            this.presetsList.innerHTML = '<p class="no-presets">Aucun preset enregistré</p>';
            return;
        }
        
        this.embedPresets.forEach(preset => {
            const presetElement = document.createElement('div');
            presetElement.className = 'preset-item';
            presetElement.innerHTML = `
                <div class="preset-info">
                    <h4>${preset.name}</h4>
                    <p>${preset.description || 'Aucune description'}</p>
                </div>
                <div class="preset-actions">
                    <button class="btn btn-secondary btn-sm" onclick="botManager.loadPresetInEmbed('${preset.id}')">Charger</button>
                    <button class="btn btn-secondary btn-sm" onclick="botManager.editEmbedPreset('${preset.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="botManager.deleteEmbedPreset('${preset.id}')">Supprimer</button>
                </div>
            `;
            
            this.presetsList.appendChild(presetElement);
        });
    }

    loadPresetInEmbed(presetId) {
        const preset = this.embedPresets.find(p => p.id === presetId);
        if (preset) {
            this.hideEmbedPresetsModal();
            this.applyEmbedPreset(preset.data);
            this.showEmbedModal();
        }
    }

    editEmbedPreset(presetId) {
        const preset = this.embedPresets.find(p => p.id === presetId);
        if (preset) {
            this.showEmbedPresetForm(preset);
        }
    }

    deleteEmbedPreset(presetId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce preset ?')) return;
        
        this.embedPresets = this.embedPresets.filter(p => p.id !== presetId);
        this.saveEmbedPresets();
        this.updateEmbedPresetSelect();
        this.renderPresetsList();
        this.showSuccess('Preset supprimé');
    }

    updatePresetPreview() {
        const embedData = this.getEmbedData();
        this.renderPresetPreview(embedData);
    }

    renderPresetPreview(embedData) {
        let previewHTML = '<div class="embed-preview-container">';
        
        if (embedData.author && embedData.author.name) {
            previewHTML += `
                <div class="embed-author">
                    ${embedData.author.iconURL ? `<img src="${embedData.author.iconURL}" class="embed-author-icon">` : ''}
                    <span class="embed-author-name">${embedData.author.name}</span>
                </div>
            `;
        }
        
        if (embedData.title) {
            previewHTML += `<div class="embed-title">${embedData.title}</div>`;
        }
        
        if (embedData.description) {
            previewHTML += `<div class="embed-description">${embedData.description}</div>`;
        }
        
        if (embedData.thumbnail) {
            previewHTML += `<img src="${embedData.thumbnail}" class="embed-thumbnail">`;
        }
        
        if (embedData.image) {
            previewHTML += `<img src="${embedData.image}" class="embed-image">`;
        }
        
        if (embedData.footer || embedData.timestamp) {
            previewHTML += `
                <div class="embed-footer">
                    ${embedData.footer ? `<span class="embed-footer-text">${embedData.footer.text}</span>` : ''}
                    ${embedData.timestamp ? `<span class="embed-timestamp">${new Date().toLocaleString('fr-FR')}</span>` : ''}
                </div>
            `;
        }
        
        previewHTML += '</div>';
        
        this.presetPreview.innerHTML = previewHTML;
        
        // Apply color to left border
        const previewContainer = this.presetPreview.querySelector('.embed-preview-container');
        if (previewContainer && embedData.color) {
            previewContainer.style.borderLeftColor = embedData.color;
        }
    }

    async saveEmbedPreset() {
        const name = this.presetName.value.trim();
        if (!name) {
            this.showError('Veuillez entrer un nom pour le preset');
            return;
        }
        
        const embedData = this.getEmbedData();
        if (!embedData.title && !embedData.description && !embedData.image && !embedData.thumbnail) {
            this.showError('Veuillez ajouter au moins un titre, une description ou une image');
            return;
        }
        
        const presetData = {
            name: name,
            description: this.presetDescription.value.trim(),
            data: embedData
        };
        
        if (this.editingPresetId) {
            // Update existing preset
            const index = this.embedPresets.findIndex(p => p.id === this.editingPresetId);
            if (index !== -1) {
                this.embedPresets[index] = { ...this.embedPresets[index], ...presetData };
                this.showSuccess('Preset mis à jour');
            }
        } else {
            // Create new preset
            presetData.id = 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.embedPresets.push(presetData);
            this.showSuccess('Preset créé');
        }
        
        this.saveEmbedPresets();
        this.updateEmbedPresetSelect();
        this.hideEmbedPresetForm();
        this.renderPresetsList();
    }

    // Title bar methods
    minimizeWindow() {
        window.api.minimizeWindow();
    }

    maximizeWindow() {
        window.api.maximizeWindow();
    }

    closeWindow() {
        window.api.closeWindow();
    }

    async checkForUpdates() {
        try {
            this.checkUpdatesBtn.disabled = true;
            this.checkUpdatesBtn.textContent = 'Vérification...';
            
            const result = await window.electronAPI.checkForUpdates();
            
            if (result.success) {
                if (result.available) {
                    this.showInfo('Mise à jour disponible! Téléchargement automatique...');
                } else {
                    this.showSuccess('Application à jour!');
                }
            } else {
                this.showError(`Erreur lors de la vérification: ${result.error}`);
            }
        } catch (error) {
            this.showError(`Erreur lors de la vérification: ${error.message}`);
        } finally {
            this.checkUpdatesBtn.disabled = false;
            this.checkUpdatesBtn.textContent = 'Vérifier les mises à jour';
        }
    }

    setupUpdateListeners() {
        // Écouter les mises à jour disponibles
        window.electronAPI.onUpdateAvailable((event, data) => {
            this.showUpdateNotification(data);
        });

        // Écouter l'absence de mise à jour
        window.electronAPI.onUpdateNotAvailable((event, data) => {
            this.showInfo(`Application à jour: version ${data.version}`);
        });

        // Écouter les erreurs de mise à jour
        window.electronAPI.onUpdateError((event, data) => {
            this.showError(`Erreur de mise à jour: ${data.message}`);
        });

        // Écouter la progression du téléchargement
        window.electronAPI.onDownloadProgress((event, data) => {
            this.updateDownloadProgress(data);
        });

        // Écouter la fin du téléchargement
        window.electronAPI.onUpdateDownloaded((event, data) => {
            this.showUpdateDownloadedNotification(data);
        });
    }

    showUpdateNotification(updateData) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-info">
                    <span class="update-title">Mise à jour disponible!</span>
                    <span class="update-version">Version ${updateData.version}</span>
                    ${updateData.releaseNotes ? `<span class="update-notes">${updateData.releaseNotes}</span>` : ''}
                </div>
                <div class="update-buttons">
                    <button class="update-btn primary" id="downloadUpdateBtn">Télécharger</button>
                    <button class="update-btn secondary" id="laterUpdateBtn">Plus tard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Ajouter les styles si nécessaire
        this.addUpdateStyles();
        
        // Ajouter les événements
        document.getElementById('downloadUpdateBtn').addEventListener('click', async () => {
            const btn = document.getElementById('downloadUpdateBtn');
            btn.disabled = true;
            btn.textContent = 'Téléchargement...';
            
            try {
                const result = await window.electronAPI.downloadUpdate();
                if (!result.success) {
                    this.showError(`Erreur de téléchargement: ${result.error}`);
                    btn.disabled = false;
                    btn.textContent = 'Télécharger';
                }
            } catch (error) {
                this.showError(`Erreur de téléchargement: ${error.message}`);
                btn.disabled = false;
                btn.textContent = 'Télécharger';
            }
        });
        
        document.getElementById('laterUpdateBtn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-suppression après 15 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 15000);
    }

    updateDownloadProgress(progressData) {
        let progressBar = document.querySelector('.update-progress-bar');
        let progressText = document.querySelector('.update-progress-text');
        
        if (!progressBar) {
            const notification = document.querySelector('.update-notification');
            if (notification) {
                const progressContainer = document.createElement('div');
                progressContainer.className = 'update-progress-container';
                progressContainer.innerHTML = `
                    <div class="update-progress-bar">
                        <div class="update-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="update-progress-text">0%</div>
                `;
                
                notification.querySelector('.update-content').appendChild(progressContainer);
                progressBar = progressContainer.querySelector('.update-progress-fill');
                progressText = progressContainer.querySelector('.update-progress-text');
            }
        }
        
        if (progressBar && progressText) {
            const percent = Math.round(progressData.percent);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}% (${this.formatBytes(progressData.transferred)} / ${this.formatBytes(progressData.total)})`;
        }
    }

    showUpdateDownloadedNotification(updateData) {
        const notification = document.createElement('div');
        notification.className = 'update-notification downloaded';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-info">
                    <span class="update-title">Mise à jour téléchargée!</span>
                    <span class="update-version">Version ${updateData.version}</span>
                    <span class="update-message">Redémarrez l'application pour installer</span>
                </div>
                <div class="update-buttons">
                    <button class="update-btn primary" id="installUpdateBtn">Installer et redémarrer</button>
                    <button class="update-btn secondary" id="restartLaterBtn">Plus tard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        this.addUpdateStyles();
        
        document.getElementById('installUpdateBtn').addEventListener('click', async () => {
            try {
                await window.electronAPI.installUpdate();
            } catch (error) {
                this.showError(`Erreur lors de l'installation: ${error.message}`);
            }
        });
        
        document.getElementById('restartLaterBtn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Ne pas auto-supprimer cette notification
    }

    addUpdateStyles() {
        if (!document.querySelector('#update-styles')) {
            const style = document.createElement('style');
            style.id = 'update-styles';
            style.textContent = `
                .update-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #5865F2, #7289DA);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                }
                
                .update-notification.downloaded {
                    background: linear-gradient(135deg, #43B581, #3BA55C);
                }
                
                .update-content {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .update-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .update-title {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .update-version {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .update-notes, .update-message {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .update-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .update-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                
                .update-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }
                
                .update-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .update-btn.primary {
                    background: rgba(255, 255, 255, 0.25);
                    border-color: rgba(255, 255, 255, 0.4);
                }
                
                .update-btn.secondary {
                    background: transparent;
                    border-color: rgba(255, 255, 255, 0.5);
                }
                
                .update-progress-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .update-progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .update-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
                
                .update-progress-text {
                    font-size: 11px;
                    opacity: 0.8;
                    text-align: center;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DiscordBotManager();
});
