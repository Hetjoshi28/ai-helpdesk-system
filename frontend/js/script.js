document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const messageArea = document.getElementById("message-area");
    const sendButton = document.getElementById("send-button");
    const historyList = document.getElementById("history-list");
    const newChatBtn = document.getElementById("new-chat-btn");
    
    // New UI Elements
    const navHelpdesk = document.getElementById("nav-helpdesk");
    const navChatpro = document.getElementById("nav-chatpro");
    const modeTitle = document.getElementById("mode-title");
    const uploadContainer = document.getElementById("upload-container");
    const uploadBtn = document.getElementById("upload-btn");
    const fileUpload = document.getElementById("file-upload");
    const filePreview = document.getElementById("file-preview");
    const fileNameDisplay = document.getElementById("file-name");
    const clearFileBtn = document.getElementById("clear-file");
    
    // Auth UI Elements
    const navLogin = document.getElementById("nav-login");
    const navSignup = document.getElementById("nav-signup");
    const authModal = document.getElementById("auth-modal");
    const closeAuth = document.getElementById("close-auth");
    const authForm = document.getElementById("auth-form");
    const authTitle = document.getElementById("auth-title");
    const authSubmitBtn = document.getElementById("auth-submit-btn");
    const authUsername = document.getElementById("auth-username");
    const authPassword = document.getElementById("auth-password");
    const authSwitchLink = document.getElementById("auth-switch-link");
    const authSwitchText = document.getElementById("auth-switch-text");

    // State Mapping
    let currentMode = 'helpdesk'; // 'helpdesk' or 'chatpro'
    let selectedFile = null;
    let currentUser = localStorage.getItem('currentUser') || null;
    let authMode = 'login'; // 'login' or 'signup'
    
    // Virtual Users Database
    let usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};

    const getStorageKey = (mode) => {
        const prefix = currentUser ? `${currentUser}_` : 'anon_';
        return `${prefix}${mode}_chats`;
    };

    let chats = JSON.parse(localStorage.getItem(getStorageKey(currentMode))) || [];
    let currentChatId = null;

    // --- Authentication Logic ---
    const updateAuthUI = () => {
        if (currentUser) {
            navLogin.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>Logout ${currentUser}</span>`;
            navSignup.style.display = 'none';
        } else {
            navLogin.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg><span>Login</span>`;
            navSignup.style.display = 'flex';
        }
    };

    const openAuthModal = (mode) => {
        authMode = mode;
        if (mode === 'login') {
            authTitle.textContent = "LOGIN FORM";
            authSubmitBtn.textContent = "LOGIN";
            authSwitchText.innerHTML = `Don't have an account? <span id="auth-switch-link">Sign Up</span>`;
        } else {
            authTitle.textContent = "SIGN UP FORM";
            authSubmitBtn.textContent = "CREATE ACCOUNT";
            authSwitchText.innerHTML = `Already have an account? <span id="auth-switch-link">Login</span>`;
        }
        
        document.getElementById("auth-switch-link").addEventListener("click", () => {
            openAuthModal(authMode === 'login' ? 'signup' : 'login');
        });
        
        authModal.style.display = 'flex';
        authUsername.focus();
    };

    const closeAuthModal = () => {
        authModal.style.display = 'none';
        authForm.reset();
    };

    closeAuth.addEventListener("click", closeAuthModal);
    
    // Close modal if clicking outside
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    navLogin.addEventListener("click", () => {
        if (currentUser) {
            // Logout
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateSessionState();
        } else {
            openAuthModal('login');
        }
    });

    navSignup.addEventListener("click", () => openAuthModal('signup'));

    authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = authUsername.value.trim().toLowerCase();
        const password = authPassword.value;

        if (authMode === 'signup') {
            if (usersDb[username]) {
                alert("Username already exists. Please choose another or login.");
                return;
            }
            usersDb[username] = { password };
            localStorage.setItem('usersDb', JSON.stringify(usersDb));
            alert("Account created successfully! You are now logged in.");
            currentUser = username;
        } else {
            if (!usersDb[username] || usersDb[username].password !== password) {
                alert("Invalid username or password.");
                return;
            }
            currentUser = username;
        }

        localStorage.setItem('currentUser', currentUser);
        closeAuthModal();
        updateSessionState();
    });
    
    const updateSessionState = () => {
        updateAuthUI();
        // Refresh chats for the correct user storage block
        chats = JSON.parse(localStorage.getItem(getStorageKey(currentMode))) || [];
        init(); // Starts new chat or loads top chat depending on history state for this user
    };
    
    // --- End Auth Logic ---

    // Initialize UI
    const init = () => {
        if (chats.length === 0) {
            startNewChat();
        } else {
            // Load the most recent chat
            loadChat(chats[0].id);
        }
        renderHistoryList();
    };

    const switchMode = (mode) => {
        if (currentMode === mode) return;
        currentMode = mode;
        
        // Update Nav UI
        navHelpdesk.classList.toggle("active", mode === 'helpdesk');
        navChatpro.classList.toggle("active", mode === 'chatpro');
        
        // Update Chat UI
        modeTitle.textContent = mode === 'helpdesk' ? 'IT HELPDESK' : 'CHATPRO ASSISTANT';
        uploadContainer.style.display = mode === 'helpdesk' ? 'none' : 'flex';
        clearFileSelection();
        
        // Load proper storage
        chats = JSON.parse(localStorage.getItem(getStorageKey(currentMode))) || [];
        init();
    };

    navHelpdesk.addEventListener("click", () => switchMode('helpdesk'));
    navChatpro.addEventListener("click", () => switchMode('chatpro'));

    const saveChats = () => {
        localStorage.setItem(getStorageKey(currentMode), JSON.stringify(chats));
        renderHistoryList();
    };

    const startNewChat = () => {
        currentChatId = Date.now().toString();
        chats.unshift({
            id: currentChatId,
            title: "New Support Chat",
            date: new Date().toISOString(),
            messages: []
        });
        saveChats();
        
        messageArea.innerHTML = "";
        addInitialGreeting();
    };

    const loadChat = (chatId) => {
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);
        messageArea.innerHTML = "";
        
        if (chat.messages.length === 0) {
            addInitialGreeting();
        } else {
            chat.messages.forEach(msg => {
                _renderMessageUI(msg.text, msg.sender, false);
            });
            scrollToBottom();
        }
        renderHistoryList();
    };

    const addInitialGreeting = () => {
        const text = "Hello! I'm your AI IT Helpdesk assistant. How can I help you today?";
        _renderMessageUI(text, "bot", false);
    };

    // Helper: Markdown Parser wrapper
    const parseMarkdown = (text) => {
        if (window.marked) {
            // Configure marked to open links in new tabs safely
            marked.use({
                renderer: {
                    link(href, title, text) {
                        return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
                    }
                }
            });
            return marked.parse(text);
        }
        return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    };

    const updateChatTitle = (firstMessage) => {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat && chat.title === "New Support Chat") {
            chat.title = firstMessage.length > 25 ? firstMessage.substring(0, 25) + '...' : firstMessage;
            saveChats();
        }
    };

    const deleteChat = (e, chatId) => {
        e.stopPropagation(); // prevent clicking the chat item itself
        chats = chats.filter(c => c.id !== chatId);
        saveChats();
        
        if (chats.length === 0) {
            startNewChat();
        } else if (currentChatId === chatId) {
            loadChat(chats[0].id);
        } else {
            renderHistoryList();
        }
    };

    const renderHistoryList = () => {
        historyList.innerHTML = "";
        chats.forEach(chat => {
            const date = new Date(chat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const div = document.createElement("div");
            div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="history-title">${chat.title}</div>
                <div class="history-meta">
                    <div class="history-date">${date}</div>
                    <button class="delete-chat-btn" title="Delete Chat" data-id="${chat.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            // Add click listener for whole tile to load chat
            div.addEventListener("click", () => loadChat(chat.id));
            
            // Add click listener specifically for delete button
            const deleteBtn = div.querySelector('.delete-chat-btn');
            deleteBtn.addEventListener('click', (e) => deleteChat(e, chat.id));
            
            historyList.appendChild(div);
        });
    };

    newChatBtn.addEventListener("click", startNewChat);

    // Handle Enter keypress for submission
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for newlines if needed
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    const scrollToBottom = () => {
        messageArea.scrollTop = messageArea.scrollHeight;
    };

    const _renderMessageUI = (text, sender, animate = true) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;
        if (!animate) {
            messageDiv.style.animation = "none";
        }
        
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        
        // Parse simple markdown asterisks to HTML bold tags
        bubble.innerHTML = parseMarkdown(text);
        
        // Add copy button
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.title = "Copy message";
        
        copyBtn.addEventListener("click", () => {
            // Temporarily hide the button to grab clean HTML
            copyBtn.style.display = 'none';
            let htmlToCopy = bubble.innerHTML;
            let textToCopy = bubble.innerText;
            copyBtn.style.display = 'flex';
            
            // Strip the file attachment prefix if it exists
            if (textToCopy.includes("📎 Attached file:")) {
                const parts = textToCopy.split("\\n\\n");
                if (parts.length > 1) {
                    textToCopy = parts.slice(1).join("\\n\\n").trim();
                } else {
                    textToCopy = textToCopy.replace(/📎 Attached file:.*?\\n\\n/s, '').trim();
                }
                
                // Try to strip from HTML as well (basic replacement for aesthetics)
                htmlToCopy = htmlToCopy.replace(/📎 \*\*Attached file:\*\*.*?<br><br>/i, '');
            }
            
            try {
                // Create a ClipboardItem with both plain text and HTML versions
                const clipboardItem = new ClipboardItem({
                    "text/plain": new Blob([textToCopy], { type: "text/plain" }),
                    "text/html": new Blob([htmlToCopy], { type: "text/html" })
                });
                
                navigator.clipboard.write([clipboardItem]).then(() => {
                    const originalSvg = copyBtn.innerHTML;
                    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalSvg;
                    }, 2000);
                });
            } catch (err) {
                // Fallback for older browsers that don't support ClipboardItem well
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalSvg = copyBtn.innerHTML;
                    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalSvg;
                    }, 2000);
                });
            }
        });
        
        bubble.appendChild(copyBtn);
        
        messageDiv.appendChild(bubble);
        messageArea.appendChild(messageDiv);
        scrollToBottom();
    };

    const addMessage = (text, sender) => {
        _renderMessageUI(text, sender, true);
        
        // Save to current chat
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ text, sender });
            saveChats();
        }
    };

    const addLoadingIndicator = () => {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message bot loading-msg";
        messageDiv.id = "loading-indicator";
        
        const bubble = document.createElement("div");
        bubble.className = "bubble loading-bubble";
        bubble.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        
        messageDiv.appendChild(bubble);
        messageArea.appendChild(messageDiv);
        scrollToBottom();
    };

    const removeLoadingIndicator = () => {
        const indicator = document.getElementById("loading-indicator");
        if (indicator) {
            indicator.remove();
        }
    };

    // File Selection Logic
    uploadBtn.addEventListener("click", () => {
        fileUpload.click();
    });

    fileUpload.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileNameDisplay.textContent = selectedFile.name;
            filePreview.style.display = "flex";
        }
    });

    const clearFileSelection = () => {
        selectedFile = null;
        fileUpload.value = "";
        filePreview.style.display = "none";
        fileNameDisplay.textContent = "";
    };

    clearFileBtn.addEventListener("click", clearFileSelection);

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const messageText = userInput.value.trim();
        if (!messageText && !selectedFile) return;

        let displayMessage = messageText;
        let titleText = messageText;
        if (selectedFile) {
            displayMessage = `📎 **Attached file:** ${selectedFile.name}\n\n${messageText}`;
            if (!titleText) titleText = selectedFile.name;
        }

        updateChatTitle(titleText || "New Chat");
        addMessage(displayMessage, "user");
        userInput.value = "";
        
        // Show loading state
        sendButton.classList.add("loading");
        userInput.disabled = true;
        addLoadingIndicator();

        const endpoint = currentMode === 'helpdesk' ? "http://localhost:5001/api/chat" : "http://localhost:5001/api/chatpro";
        
        try {
            let response;
            
            if (currentMode === 'chatpro' || selectedFile) {
                // Use FormData for ChatPro to support files
                const formData = new FormData();
                formData.append('message', messageText);
                
                // Get the current chat history (excluding the new message we just added)
                const chat = chats.find(c => c.id === currentChatId);
                const history = chat ? chat.messages.slice(0, -1) : [];
                formData.append('history', JSON.stringify(history));

                if (selectedFile) {
                    formData.append('file', selectedFile);
                }
                
                response = await fetch(endpoint, {
                    method: "POST",
                    body: formData // Browser handles multipart headers automatically
                });
            } else {
                // Send JSON for standard Helpdesk
                response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message: messageText })
                });
            }

            const data = await response.json();
            
            removeLoadingIndicator();
            clearFileSelection();
            if (response.ok) {
                addMessage(data.reply, "bot");
            } else {
                addMessage(data.error || "An error occurred.", "bot");
            }
        } catch (error) {
            console.error("Error connecting to server:", error);
            removeLoadingIndicator();
            addMessage("Error connecting to server. Is the backend running?", "bot");
        } finally {
            sendButton.classList.remove("loading");
            userInput.disabled = false;
            userInput.focus();
            scrollToBottom();
        }
    });

    // Boot up
    init();
});
