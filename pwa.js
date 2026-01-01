/**
 * ========================================
 * HABIT TRACKER 2026 - PWA INTEGRATION
 * Handles service worker registration and
 * install prompt functionality
 * ========================================
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const PWA_CONFIG = {
        serviceWorkerPath: '/service-worker.js',
        debugMode: true, // Enable logging to debug install issues
        installPromptDelay: 3000, // 3 seconds before showing custom prompt
        installPromptCooldown: 3600000, // 1 hour between prompts (reduced from 24h)
        storageKey: 'habitTracker2026_pwa'
    };

    // ==================== STATE ====================
    let deferredInstallPrompt = null;
    let isInstalled = false;
    let installPromptShown = false;

    // ==================== EARLY EVENT CAPTURE ====================
    // CRITICAL: Capture beforeinstallprompt IMMEDIATELY, before DOMContentLoaded
    // This event can fire very early, before the DOM is ready
    window.addEventListener('beforeinstallprompt', (event) => {
        // Prevent the default browser prompt
        event.preventDefault();
        // Store the event for later use
        deferredInstallPrompt = event;
        console.log('[PWA] ✅ Install prompt captured EARLY!');
    });

    // ==================== LOGGING ====================
    function log(...args) {
        if (PWA_CONFIG.debugMode) {
            console.log('[PWA]', ...args);
        }
    }

    function logError(...args) {
        console.error('[PWA]', ...args);
    }

    // ==================== SERVICE WORKER REGISTRATION ====================

    /**
     * Register the service worker
     * This enables offline functionality and caching
     */
    async function registerServiceWorker() {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            log('Service workers not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register(
                PWA_CONFIG.serviceWorkerPath,
                { scope: '/' }
            );

            log('Service Worker registered successfully');

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                log('New service worker installing...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New content is available
                            log('New content available, refresh to update');
                            showUpdateNotification();
                        } else {
                            // Content is cached for offline use
                            log('Content cached for offline use');
                        }
                    }
                });
            });

            return true;
        } catch (error) {
            logError('Service Worker registration failed:', error);
            return false;
        }
    }

    // ==================== INSTALL PROMPT HANDLING ====================

    /**
     * Check if the app is already installed
     */
    function checkIfInstalled() {
        // Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            isInstalled = true;
            log('App is running in standalone mode (installed)');
            return true;
        }

        // Check iOS standalone mode
        if (window.navigator.standalone === true) {
            isInstalled = true;
            log('App is running in iOS standalone mode (installed)');
            return true;
        }

        return false;
    }

    /**
     * Store the install prompt event for later use
     */
    function handleBeforeInstallPrompt(event) {
        // Prevent the default browser prompt
        event.preventDefault();

        // Store the event for later use
        deferredInstallPrompt = event;

        log('Install prompt captured and stored');

        // Show custom install button immediately (reduced delay)
        showInstallButton();
        
        // Also add a persistent install button to the UI
        addPersistentInstallButton();
    }

    /**
     * Check if we should show the install prompt
     */
    function shouldShowInstallPrompt() {
        if (isInstalled) return false;
        if (!deferredInstallPrompt) return false;

        // Check cooldown (but be less strict)
        const pwaData = getPWAData();
        const lastPromptTime = pwaData.lastInstallPrompt || 0;
        const timeSinceLastPrompt = Date.now() - lastPromptTime;

        if (timeSinceLastPrompt < PWA_CONFIG.installPromptCooldown) {
            log('Install prompt on cooldown, but will show button anyway');
            // Still return true to show button, just won't auto-popup
        }

        return true;
    }

    /**
     * Show the install button in the UI
     */
    function showInstallButton() {
        if (isInstalled) return;
        if (!deferredInstallPrompt) return;

        // Wait a bit before showing (don't interrupt the user immediately)
        setTimeout(() => {
            if (!shouldShowInstallPrompt()) return;

            // Create and show the install banner
            createInstallBanner();
            installPromptShown = true;
        }, PWA_CONFIG.installPromptDelay);
    }

    /**
     * Create the install banner UI
     */
    function createInstallBanner() {
        // Check if banner already exists
        if (document.getElementById('pwa-install-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">📱</div>
                <div class="pwa-banner-text">
                    <strong>Install Habit Tracker</strong>
                    <span>Add to home screen for the best experience</span>
                </div>
                <div class="pwa-banner-actions">
                    <button class="pwa-btn-install" id="pwa-install-btn">Install</button>
                    <button class="pwa-btn-dismiss" id="pwa-dismiss-btn">Not Now</button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-top: 1px solid rgba(139, 92, 246, 0.3);
                padding: 16px 20px;
                z-index: 10000;
                animation: slideUp 0.3s ease-out;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .pwa-banner-content {
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 800px;
                margin: 0 auto;
            }

            .pwa-banner-icon {
                font-size: 32px;
                flex-shrink: 0;
            }

            .pwa-banner-text {
                flex: 1;
                min-width: 0;
            }

            .pwa-banner-text strong {
                display: block;
                color: #ffffff;
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 2px;
            }

            .pwa-banner-text span {
                color: #a1a1aa;
                font-size: 0.875rem;
            }

            .pwa-banner-actions {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }

            .pwa-btn-install {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .pwa-btn-install:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            }

            .pwa-btn-dismiss {
                background: transparent;
                color: #a1a1aa;
                border: 1px solid #3f3f46;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .pwa-btn-dismiss:hover {
                border-color: #8b5cf6;
                color: #ffffff;
            }

            @media (max-width: 600px) {
                .pwa-banner-content {
                    flex-wrap: wrap;
                }

                .pwa-banner-text {
                    flex: 1 1 100%;
                    order: 1;
                    margin-bottom: 12px;
                }

                .pwa-banner-icon {
                    order: 0;
                }

                .pwa-banner-actions {
                    order: 2;
                    width: 100%;
                }

                .pwa-btn-install,
                .pwa-btn-dismiss {
                    flex: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('pwa-install-btn').addEventListener('click', triggerInstall);
        document.getElementById('pwa-dismiss-btn').addEventListener('click', dismissInstallBanner);

        log('Install banner displayed');
    }

    /**
     * Trigger the native install prompt
     */
    async function triggerInstall() {
        if (!deferredInstallPrompt) {
            log('No install prompt available, showing manual instructions');
            showDesktopInstallInstructions();
            return;
        }

        try {
            log('Calling deferredInstallPrompt.prompt()...');
            // Show the native install prompt
            deferredInstallPrompt.prompt();

            // Wait for user response
            const { outcome } = await deferredInstallPrompt.userChoice;

            log('Install prompt outcome:', outcome);

            if (outcome === 'accepted') {
                log('App installed successfully');
                isInstalled = true;
                // Hide install button
                hidePersistentInstallButton();
            }

            // Clear the stored prompt (can only be used once)
            deferredInstallPrompt = null;

            // Hide the banner
            hideInstallBanner();

            // Update storage
            updatePWAData({ lastInstallPrompt: Date.now() });

        } catch (error) {
            logError('Install failed:', error);
            // Show manual instructions as fallback
            showDesktopInstallInstructions();
        }
    }

    /**
     * Dismiss the install banner
     */
    function dismissInstallBanner() {
        hideInstallBanner();
        updatePWAData({ lastInstallPrompt: Date.now() });
        log('Install banner dismissed');
    }

    /**
     * Hide/remove the install banner
     */
    function hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out forwards';
            setTimeout(() => banner.remove(), 300);
        }
    }

    // ==================== PERSISTENT INSTALL BUTTON ====================

    /**
     * Detect if running on iOS
     */
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * Detect if running in standalone mode (already installed)
     */
    function isInStandaloneMode() {
        return (window.matchMedia('(display-mode: standalone)').matches) ||
               (window.navigator.standalone) ||
               document.referrer.includes('android-app://');
    }

    /**
     * Add a persistent install button to the page header
     */
    function addPersistentInstallButton() {
        // Don't show if already installed
        if (isInstalled || isInStandaloneMode()) {
            log('App already installed, not showing install button');
            return;
        }

        // Check if button already exists
        if (document.getElementById('pwa-persistent-install-btn')) return;

        // Create the button
        const btn = document.createElement('button');
        btn.id = 'pwa-persistent-install-btn';
        btn.className = 'pwa-install-btn-floating';
        btn.innerHTML = `
            <span class="pwa-install-icon">📲</span>
            <span class="pwa-install-text">Install App</span>
        `;

        // Add styles
        const style = document.createElement('style');
        style.id = 'pwa-persistent-install-styles';
        style.textContent = `
            .pwa-install-btn-floating {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 50px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                animation: pwa-pulse 2s infinite;
            }

            .pwa-install-btn-floating:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5);
            }

            @keyframes pwa-pulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4); }
                50% { box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6); }
            }

            .pwa-install-icon {
                font-size: 1.2rem;
            }

            /* iOS Install Modal */
            .pwa-ios-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }

            .pwa-ios-modal {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 16px;
                padding: 24px;
                max-width: 340px;
                margin: 20px;
                text-align: center;
                color: white;
            }

            .pwa-ios-modal h3 {
                margin: 0 0 16px 0;
                font-size: 1.25rem;
                color: #8b5cf6;
            }

            .pwa-ios-modal p {
                margin: 0 0 20px 0;
                color: #a0a0a0;
                font-size: 0.9rem;
                line-height: 1.5;
            }

            .pwa-ios-steps {
                text-align: left;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
            }

            .pwa-ios-step {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
                color: #e0e0e0;
                font-size: 0.9rem;
            }

            .pwa-ios-step:not(:last-child) {
                border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            }

            .pwa-ios-step-num {
                background: #8b5cf6;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                flex-shrink: 0;
            }

            .pwa-ios-close {
                background: #8b5cf6;
                color: white;
                border: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.3s;
            }

            .pwa-ios-close:hover {
                background: #7c3aed;
            }

            @media (max-width: 480px) {
                .pwa-install-btn-floating {
                    bottom: 100px;
                    right: 16px;
                    padding: 10px 16px;
                    font-size: 0.85rem;
                }
            }
        `;

        document.head.appendChild(style);

        // Wait for DOM to be ready, then insert button
        const insertButton = () => {
            // Try to insert near the header or at the body
            const header = document.querySelector('.header-content') || document.querySelector('header') || document.body;
            document.body.appendChild(btn);
            log('Persistent install button added');
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertButton);
        } else {
            insertButton();
        }

        // Add click handler
        btn.addEventListener('click', handleInstallClick);
    }

    /**
     * Handle install button click
     */
    function handleInstallClick() {
        log('Install button clicked');
        log('deferredInstallPrompt:', deferredInstallPrompt ? 'available' : 'null');
        log('isIOS:', isIOS());
        log('isStandalone:', isInStandaloneMode());
        
        // Check if already installed
        if (isInStandaloneMode()) {
            showInstallSuccessMessage();
            return;
        }
        
        if (deferredInstallPrompt) {
            // Directly trigger native install prompt (Android/Chrome/Edge)
            log('Triggering native install prompt...');
            triggerInstall();
        } else if (isIOS()) {
            // Show iOS-specific instructions (Safari doesn't support beforeinstallprompt)
            log('Showing iOS instructions...');
            showIOSInstallInstructions();
        } else {
            // Show instructions for desktop browsers (Chrome/Edge/Firefox)
            log('Showing desktop install instructions...');
            showDesktopInstallInstructions();
        }
    }
    
    /**
     * Show success message when app is already installed
     */
    function showInstallSuccessMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'pwa-ios-modal-overlay';
        overlay.id = 'pwa-success-modal';
        overlay.innerHTML = `
            <div class="pwa-ios-modal">
                <h3>✅ Already Installed!</h3>
                <p>Habit Tracker 2026 is already installed on your device. You can find it on your home screen or app drawer.</p>
                <button class="pwa-ios-close" onclick="document.getElementById('pwa-success-modal').remove()">Got it!</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }
    
    /**
     * Show desktop browser install instructions
     */
    function showDesktopInstallInstructions() {
        const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
        const isEdge = /Edg/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        
        let browserName = 'your browser';
        let steps = '';
        
        if (isChrome) {
            browserName = 'Chrome';
            steps = `
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">1</span>
                    <span>Look for the <strong>Install icon</strong> ⊕ in the address bar (right side)</span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">2</span>
                    <span>Or click the <strong>⋮ Menu</strong> → <strong>"Install Habit Tracker 2026"</strong></span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">3</span>
                    <span>Click <strong>"Install"</strong> in the popup to add to your device</span>
                </div>
            `;
        } else if (isEdge) {
            browserName = 'Edge';
            steps = `
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">1</span>
                    <span>Look for the <strong>App available</strong> icon in the address bar</span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">2</span>
                    <span>Or click the <strong>⋯ Menu</strong> → <strong>Apps</strong> → <strong>"Install this site as an app"</strong></span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">3</span>
                    <span>Click <strong>"Install"</strong> to add to your device</span>
                </div>
            `;
        } else if (isFirefox) {
            browserName = 'Firefox';
            steps = `
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">1</span>
                    <span>Firefox has limited PWA support on desktop</span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">2</span>
                    <span>For best experience, use <strong>Chrome</strong> or <strong>Edge</strong></span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">3</span>
                    <span>Or bookmark this page for quick access</span>
                </div>
            `;
        } else {
            steps = `
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">1</span>
                    <span>Look for an <strong>Install</strong> or <strong>Add to Home</strong> option in your browser menu</span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">2</span>
                    <span>This is usually in the main menu (⋮ or ⋯)</span>
                </div>
                <div class="pwa-ios-step">
                    <span class="pwa-ios-step-num">3</span>
                    <span>For best PWA support, try <strong>Chrome</strong> or <strong>Edge</strong></span>
                </div>
            `;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'pwa-ios-modal-overlay';
        overlay.id = 'pwa-desktop-modal';
        overlay.innerHTML = `
            <div class="pwa-ios-modal">
                <h3>📥 Install Habit Tracker</h3>
                <p>To install this app using ${browserName}:</p>
                <div class="pwa-ios-steps">
                    ${steps}
                </div>
                <button class="pwa-ios-close" onclick="document.getElementById('pwa-desktop-modal').remove()">Got it!</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /**
     * Show iOS install instructions modal
     */
    function showIOSInstallInstructions() {
        const overlay = document.createElement('div');
        overlay.className = 'pwa-ios-modal-overlay';
        overlay.id = 'pwa-ios-modal';
        overlay.innerHTML = `
            <div class="pwa-ios-modal">
                <h3>📱 Install Habit Tracker</h3>
                <p>To install this app on your iPhone/iPad, follow these steps:</p>
                <div class="pwa-ios-steps">
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">1</span>
                        <span>Tap the <strong>Share</strong> button <span style="font-size: 1.2rem;">⬆️</span> at the bottom of Safari</span>
                    </div>
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">2</span>
                        <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <span style="font-size: 1.2rem;">➕</span></span>
                    </div>
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">3</span>
                        <span>Tap <strong>"Add"</strong> in the top right corner</span>
                    </div>
                </div>
                <button class="pwa-ios-close" id="pwa-ios-close-btn">Got it!</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on button click
        document.getElementById('pwa-ios-close-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        log('Showing iOS install instructions');
    }

    /**
     * Show manual install instructions for other browsers
     */
    function showManualInstallInstructions() {
        const overlay = document.createElement('div');
        overlay.className = 'pwa-ios-modal-overlay';
        overlay.id = 'pwa-manual-modal';
        overlay.innerHTML = `
            <div class="pwa-ios-modal">
                <h3>📱 Install Habit Tracker</h3>
                <p>To install this app, use your browser's menu:</p>
                <div class="pwa-ios-steps">
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">1</span>
                        <span>Open the browser menu <strong>⋮</strong> or <strong>⋯</strong></span>
                    </div>
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">2</span>
                        <span>Look for <strong>"Install app"</strong>, <strong>"Add to Home Screen"</strong>, or <strong>"Install Habit Tracker"</strong></span>
                    </div>
                    <div class="pwa-ios-step">
                        <span class="pwa-ios-step-num">3</span>
                        <span>Follow the prompts to complete installation</span>
                    </div>
                </div>
                <button class="pwa-ios-close" id="pwa-manual-close-btn">Got it!</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on button click
        document.getElementById('pwa-manual-close-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        log('Showing manual install instructions');
    }

    /**
     * Hide the persistent install button (after successful install)
     */
    function hidePersistentInstallButton() {
        const btn = document.getElementById('pwa-persistent-install-btn');
        if (btn) {
            btn.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => btn.remove(), 300);
        }
    }

    // ==================== UPDATE NOTIFICATION ====================

    /**
     * Show notification when new version is available
     */
    function showUpdateNotification() {
        // Only show if user has been using the app for a while
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="pwa-update-content">
                <span>🔄 A new version is available</span>
                <button id="pwa-refresh-btn">Refresh</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #pwa-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 12px;
                padding: 12px 16px;
                z-index: 10001;
                animation: fadeIn 0.3s ease-out;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .pwa-update-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #ffffff;
                font-size: 0.875rem;
            }

            #pwa-refresh-btn {
                background: #8b5cf6;
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 0.8125rem;
                font-weight: 500;
                cursor: pointer;
            }

            #pwa-refresh-btn:hover {
                background: #7c3aed;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        document.getElementById('pwa-refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            const el = document.getElementById('pwa-update-notification');
            if (el) el.remove();
        }, 10000);
    }

    // ==================== STORAGE ====================

    /**
     * Get PWA data from localStorage
     */
    function getPWAData() {
        try {
            const data = localStorage.getItem(PWA_CONFIG.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Update PWA data in localStorage
     */
    function updatePWAData(updates) {
        try {
            const data = { ...getPWAData(), ...updates };
            localStorage.setItem(PWA_CONFIG.storageKey, JSON.stringify(data));
        } catch (e) {
            logError('Failed to save PWA data:', e);
        }
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialize PWA functionality
     */
    async function initPWA() {
        log('Initializing PWA...');

        // Check if already installed
        checkIfInstalled();

        // Check if we already captured the install prompt (from early listener)
        if (deferredInstallPrompt) {
            log('Install prompt was already captured early!');
            showInstallButton();
            addPersistentInstallButton();
        }

        // Listen for install prompt (in case it fires later)
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            isInstalled = true;
            deferredInstallPrompt = null;
            hideInstallBanner();
            hidePersistentInstallButton();
            log('App was installed successfully!');
        });

        // Register service worker
        await registerServiceWorker();

        // Add persistent install button (works for iOS too, shows instructions)
        setTimeout(() => {
            addPersistentInstallButton();
        }, 2000);

        // Listen for online/offline events
        window.addEventListener('online', () => {
            log('Back online');
            document.body.classList.remove('pwa-offline');
        });

        window.addEventListener('offline', () => {
            log('Gone offline');
            document.body.classList.add('pwa-offline');
        });

        // Set initial offline state
        if (!navigator.onLine) {
            document.body.classList.add('pwa-offline');
        }

        log('PWA initialized successfully');
        log('deferredInstallPrompt available:', !!deferredInstallPrompt);
    }

    // ==================== START ====================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();
