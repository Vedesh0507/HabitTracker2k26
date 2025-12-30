/**
 * ========================================
 * SUPABASE INTEGRATION MODULE
 * ========================================
 * 
 * Purpose: 
 *   - User identity (name) storage
 *   - Anonymous usage analytics
 *   - Minimal, privacy-respecting backend
 * 
 * Privacy Guarantees:
 *   - NO habit data is sent to server
 *   - NO personal behavior tracking
 *   - Name is stored only for personalization
 *   - All analytics are aggregated/anonymous
 * 
 * Architecture:
 *   - Fails gracefully if offline
 *   - Does not block app functionality
 *   - Additive only - no existing code modified
 */

// ==================== CONFIGURATION ====================

/**
 * Supabase Configuration
 * Replace these with your actual Supabase project credentials
 * 
 * To get these:
 * 1. Go to https://supabase.com and create a project
 * 2. Go to Settings > API
 * 3. Copy the Project URL and anon/public key
 */
const SUPABASE_CONFIG = {
    url: 'https://etvwvskgmzdzyspawyvw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dnd2c2tnbXpkenlzcGF3eXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTUwNDcsImV4cCI6MjA4MjM5MTA0N30.K4g_gY_T2RVZ58MCEYc87csRUe3GKloslNYUrnK7hy0'
};

// LocalStorage keys for user data
const USER_STORAGE_KEY = 'habitTracker2026_user';
const LAST_ACTIVE_KEY = 'habitTracker2026_lastActive';

// ==================== SUPABASE CLIENT ====================

/**
 * Lazy-loaded Supabase client
 * We load the Supabase library dynamically to avoid blocking the main app
 */
let supabaseClient = null;

/**
 * Initialize Supabase client (lazy loading)
 * Returns null if Supabase is not configured or unavailable
 */
async function getSupabaseClient() {
    // Skip if already initialized
    if (supabaseClient) return supabaseClient;
    
    // Skip if not configured
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_PROJECT_URL') {
        console.warn('[Supabase] Not configured - running in offline mode');
        return null;
    }
    
    try {
        // Dynamically import Supabase from CDN
        if (typeof window.supabase === 'undefined') {
            await loadSupabaseScript();
        }
        
        // Create client
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        console.log('[Supabase] Client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('[Supabase] Failed to initialize:', error);
        return null;
    }
}

/**
 * Load Supabase JS library from CDN
 */
function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof window.supabase !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.onload = () => {
            console.log('[Supabase] Library loaded from CDN');
            resolve();
        };
        script.onerror = () => {
            console.error('[Supabase] Failed to load library from CDN');
            reject(new Error('Failed to load Supabase'));
        };
        document.head.appendChild(script);
    });
}

// ==================== USER IDENTITY ====================

/**
 * Get stored user from localStorage
 * Returns null if user hasn't registered
 */
function getStoredUser() {
    try {
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('[User] Error reading stored user:', error);
        return null;
    }
}

/**
 * Save user to localStorage
 */
function saveUserLocally(user) {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('[User] Error saving user locally:', error);
    }
}

/**
 * Check if user needs to register (first visit)
 */
function isFirstVisit() {
    return getStoredUser() === null;
}

/**
 * Register a new user
 * Saves to both Supabase (if available) and localStorage
 * 
 * @param {string} name - User's name
 * @returns {Promise<object>} - Created user object
 */
async function registerUser(name) {
    const timestamp = new Date().toISOString();
    
    // Create user object
    const user = {
        id: null,           // Will be set by Supabase
        name: name.trim(),
        first_visit: timestamp,
        last_active: timestamp
    };
    
    // Try to save to Supabase (non-blocking)
    try {
        const client = await getSupabaseClient();
        if (client) {
            const { data, error } = await client
                .from('users')
                .insert([{
                    name: user.name,
                    first_visit: user.first_visit,
                    last_active: user.last_active
                }])
                .select()
                .single();
            
            if (error) {
                console.error('[Supabase] Error registering user:', error);
            } else if (data) {
                user.id = data.id;
                console.log('[Supabase] User registered successfully:', user.id);
            }
        }
    } catch (error) {
        // Fail gracefully - app continues without Supabase
        console.warn('[Supabase] Registration failed, continuing offline:', error);
    }
    
    // Always save locally (primary source of truth for app)
    saveUserLocally(user);
    
    // Update last active date tracker
    localStorage.setItem(LAST_ACTIVE_KEY, new Date().toDateString());
    
    return user;
}

/**
 * Update last active timestamp (rate-limited to once per day)
 * This runs silently in the background
 */
async function updateLastActive() {
    const user = getStoredUser();
    if (!user) return;
    
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    
    // Only update if it's a new day
    if (lastActive === today) {
        return;
    }
    
    // Update local timestamp
    localStorage.setItem(LAST_ACTIVE_KEY, today);
    user.last_active = new Date().toISOString();
    saveUserLocally(user);
    
    // Update Supabase (if available and user has ID)
    if (user.id) {
        try {
            const client = await getSupabaseClient();
            if (client) {
                // Use the rate-limited function we created
                await client.rpc('update_last_active', { user_id: user.id });
                console.log('[Supabase] Last active updated');
            }
        } catch (error) {
            // Silently fail - this is non-critical
            console.warn('[Supabase] Failed to update last active:', error);
        }
    }
}

// ==================== PERSONALIZED GREETING ====================

/**
 * Get personalized greeting based on time of day and user name
 * Uses ONLY localStorage - no backend call needed
 */
function getPersonalizedGreeting() {
    const user = getStoredUser();
    const name = user?.name || 'Champion';
    
    const hour = new Date().getHours();
    
    // Time-based greetings with motivational messages
    const greetings = {
        morning: [
            `Good morning, ${name}. Don't break the chain.`,
            `Rise and grind, ${name}. Today matters.`,
            `A new day, ${name}. Make it count.`,
            `Good morning, ${name}. Build the life you want.`
        ],
        afternoon: [
            `Good afternoon, ${name}. Stay consistent.`,
            `Keep pushing, ${name}. Halfway through the day.`,
            `Good afternoon, ${name}. Discipline over motivation.`,
            `Stay focused, ${name}. You've got this.`
        ],
        evening: [
            `Good evening, ${name}. Did you check off your habits?`,
            `Evening, ${name}. Reflect on your progress.`,
            `Good evening, ${name}. End the day strong.`,
            `Almost done, ${name}. Did you show up today?`
        ],
        night: [
            `Late night, ${name}? Preparation is key.`,
            `Still up, ${name}? Plan for tomorrow.`,
            `Night owl mode, ${name}. Rest is part of success.`,
            `Good night, ${name}. Tomorrow is another chance.`
        ]
    };
    
    // Determine time period
    let period;
    if (hour >= 5 && hour < 12) {
        period = 'morning';
    } else if (hour >= 12 && hour < 17) {
        period = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
        period = 'evening';
    } else {
        period = 'night';
    }
    
    // Pick a random greeting from the period
    const options = greetings[period];
    const randomIndex = Math.floor(Math.random() * options.length);
    
    return options[randomIndex];
}

/**
 * Get just the user's name for simple displays
 */
function getUserName() {
    const user = getStoredUser();
    return user?.name || null;
}

// ==================== ANALYTICS (ADMIN ONLY) ====================

/**
 * Fetch analytics summary (for admin dashboard only)
 * Returns aggregate stats - NO individual user data
 * 
 * @returns {Promise<object>} - Analytics summary
 */
async function getAnalyticsSummary() {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            return null;
        }
        
        const { data, error } = await client
            .from('analytics_summary')
            .select('*')
            .single();
        
        if (error) {
            console.error('[Analytics] Error fetching summary:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('[Analytics] Failed to fetch:', error);
        return null;
    }
}

/**
 * Calculate anonymous habit statistics from localStorage
 * This aggregates local data for admin insights without exposing individual users
 * 
 * @returns {object} - Anonymous habit stats
 */
function getAnonymousLocalStats() {
    try {
        const habitData = localStorage.getItem('habitTracker2026');
        if (!habitData) {
            return {
                totalHabits: 0,
                avgConsistency: 0,
                topHabits: []
            };
        }
        
        const data = JSON.parse(habitData);
        const habitNames = [];
        let totalCheckboxes = 0;
        let completedCheckboxes = 0;
        
        // Aggregate habit names and calculate consistency
        for (let monthKey in data) {
            if (monthKey.startsWith('month_')) {
                const monthData = data[monthKey];
                
                // Collect habit names (for top habits)
                if (monthData.habits) {
                    monthData.habits.forEach(habit => {
                        habitNames.push(habit.name.toLowerCase().trim());
                    });
                }
                
                // Calculate completions
                if (monthData.completions) {
                    const monthIndex = parseInt(monthKey.split('_')[1]);
                    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex];
                    const habitCount = monthData.habits?.length || 0;
                    
                    totalCheckboxes += habitCount * daysInMonth;
                    completedCheckboxes += Object.values(monthData.completions).filter(v => v === true).length;
                }
            }
        }
        
        // Calculate avg consistency
        const avgConsistency = totalCheckboxes > 0 
            ? Math.round((completedCheckboxes / totalCheckboxes) * 100) 
            : 0;
        
        // Get top 5 habit names
        const habitCounts = {};
        habitNames.forEach(name => {
            habitCounts[name] = (habitCounts[name] || 0) + 1;
        });
        
        const topHabits = Object.entries(habitCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        return {
            totalHabits: habitNames.length,
            avgConsistency,
            topHabits
        };
    } catch (error) {
        console.error('[Stats] Error calculating local stats:', error);
        return {
            totalHabits: 0,
            avgConsistency: 0,
            topHabits: []
        };
    }
}

// ==================== USER AVATAR ====================

// LocalStorage key for avatar
const AVATAR_STORAGE_KEY = 'habitTracker2026_avatar';

/**
 * Handle avatar file upload in the welcome modal
 * Resizes image to 200x200 and converts to base64
 * 
 * @param {Event} e - File input change event
 * @param {HTMLElement} previewEl - Preview element to update
 */
function handleAvatarUpload(e, previewEl) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.warn('[Avatar] Invalid file type:', file.type);
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        console.warn('[Avatar] File too large:', file.size);
        alert('Image is too large. Please select an image under 5MB.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Resize and compress image
            const base64 = resizeAndCompressImage(img, 200, 200);
            
            // Store temporarily (will be saved on form submit)
            previewEl.dataset.avatarBase64 = base64;
            
            // Update preview
            previewEl.innerHTML = `<img src="${base64}" alt="Avatar preview">`;
            previewEl.classList.add('has-image');
            
            console.log('[Avatar] Preview updated');
        };
        img.onerror = () => {
            console.error('[Avatar] Failed to load image');
        };
        img.src = event.target.result;
    };
    
    reader.onerror = () => {
        console.error('[Avatar] Failed to read file');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Resize and compress image using canvas
 * 
 * @param {HTMLImageElement} img - Source image
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {string} - Base64 encoded image
 */
function resizeAndCompressImage(img, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate new dimensions (maintain aspect ratio, crop to square)
    let width = img.width;
    let height = img.height;
    let sx = 0, sy = 0, sWidth = width, sHeight = height;
    
    // Crop to square (center crop)
    if (width > height) {
        sx = (width - height) / 2;
        sWidth = height;
    } else {
        sy = (height - width) / 2;
        sHeight = width;
    }
    
    // Set canvas size
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Draw resized image
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maxWidth, maxHeight);
    
    // Convert to base64 (JPEG for smaller size)
    return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Save avatar to localStorage
 * 
 * @param {string} base64 - Base64 encoded image
 */
function saveAvatar(base64) {
    if (!base64) return;
    
    try {
        localStorage.setItem(AVATAR_STORAGE_KEY, base64);
        console.log('[Avatar] Saved to localStorage');
    } catch (error) {
        console.error('[Avatar] Failed to save:', error);
        // Likely quota exceeded
    }
}

/**
 * Get avatar from localStorage
 * 
 * @returns {string|null} - Base64 encoded image or null
 */
function getStoredAvatar() {
    try {
        return localStorage.getItem(AVATAR_STORAGE_KEY);
    } catch (error) {
        console.error('[Avatar] Failed to retrieve:', error);
        return null;
    }
}

/**
 * Generate initials from user name
 * 
 * @param {string} name - User's full name
 * @returns {string} - 1-2 character initials
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    
    const parts = name.trim().split(/\s+/);
    
    if (parts.length >= 2) {
        // First letter of first and last name
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    
    // Single name - first letter only
    return name.charAt(0).toUpperCase();
}

/**
 * Render the user avatar component
 * Shows photo if available, otherwise initials
 */
function renderUserAvatar() {
    const container = document.getElementById('user-avatar-container');
    const avatarEl = document.getElementById('user-avatar');
    
    if (!container || !avatarEl) {
        console.warn('[Avatar] Avatar container not found');
        return;
    }
    
    const user = getStoredUser();
    
    // Hide avatar if no user registered
    if (!user) {
        container.classList.remove('is-visible');
        return;
    }
    
    const avatar = getStoredAvatar();
    const initials = getInitials(user.name);
    
    if (avatar) {
        // Show profile photo
        avatarEl.innerHTML = `<img src="${avatar}" alt="${user.name}'s avatar">`;
        avatarEl.classList.add('has-photo');
        avatarEl.classList.remove('has-initials');
    } else {
        // Show initials fallback
        avatarEl.innerHTML = `<span class="avatar-initials">${initials}</span>`;
        avatarEl.classList.add('has-initials');
        avatarEl.classList.remove('has-photo');
    }
    
    // Add tooltip with user name
    avatarEl.title = user.name;
    
    // Show avatar with animation
    requestAnimationFrame(() => {
        container.classList.add('is-visible');
    });
    
    console.log('[Avatar] Rendered for:', user.name);
}

// ==================== NAME MODAL ====================

/**
 * Create and show the name collection modal
 * Only shown on first visit
 * 
 * PREMIUM ONBOARDING EXPERIENCE
 * - Cinematic dark background with animated grain
 * - Glassmorphism modal card
 * - Smooth entrance animations
 * - Micro-interactions on input and button
 */
function showNameModal() {
    // Don't show if user already registered
    if (!isFirstVisit()) return;
    
    // Create modal HTML with premium design
    const modalHTML = `
        <div class="welcome-modal-overlay" id="name-modal-overlay">
            <!-- Animated background layers -->
            <div class="welcome-bg-gradient"></div>
            <div class="welcome-bg-glow"></div>
            <div class="welcome-bg-grain"></div>
            
            <!-- Glassmorphism modal card -->
            <div class="welcome-modal" id="welcome-modal">
                <!-- Decorative glow ring -->
                <div class="welcome-modal-glow"></div>
                
                <!-- Header with animated icon -->
                <div class="welcome-header">
                    <div class="welcome-icon-wrapper">
                        <span class="welcome-icon">👋</span>
                        <div class="welcome-icon-ring"></div>
                    </div>
                    <h1 class="welcome-title">
                        <span class="welcome-title-line">Welcome to</span>
                        <span class="welcome-title-brand">Habit Tracker 2026</span>
                    </h1>
                    <p class="welcome-subtitle">Your journey to discipline starts here</p>
                </div>
                
                <!-- Input section -->
                <div class="welcome-body">
                    <!-- Profile Photo Upload (Optional) -->
                    <div class="welcome-avatar-section">
                        <div class="welcome-avatar-preview" id="welcome-avatar-preview">
                            <span class="welcome-avatar-placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </span>
                        </div>
                        <div class="welcome-avatar-upload">
                            <label for="avatar-upload" class="welcome-avatar-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <span>Add photo</span>
                            </label>
                            <input 
                                type="file" 
                                id="avatar-upload" 
                                accept="image/*"
                                class="welcome-avatar-input"
                            >
                            <p class="welcome-avatar-hint">Optional · Opens camera on mobile</p>
                        </div>
                    </div>
                    
                    <!-- Name Input -->
                    <div class="welcome-input-group">
                        <label class="welcome-label" for="user-name-input">
                            What should we call you?
                        </label>
                        <div class="welcome-input-wrapper">
                            <input 
                                type="text" 
                                id="user-name-input" 
                                class="welcome-input" 
                                placeholder="Enter your name"
                                maxlength="50"
                                autocomplete="off"
                                spellcheck="false"
                            >
                            <div class="welcome-input-glow"></div>
                            <div class="welcome-input-border"></div>
                        </div>
                        <p class="welcome-hint">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                            <span>This personalizes your experience with motivational greetings</span>
                        </p>
                    </div>
                </div>
                
                <!-- CTA button -->
                <div class="welcome-footer">
                    <button class="welcome-btn" id="name-modal-submit" disabled>
                        <span class="welcome-btn-text">Start My Journey</span>
                        <span class="welcome-btn-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14"/>
                                <path d="M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                        <div class="welcome-btn-glow"></div>
                    </button>
                    
                    <!-- Privacy assurance -->
                    <div class="welcome-privacy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Your data stays on your device. Photo is never uploaded.</span>
                    </div>
                </div>
                
                <!-- Decorative particles -->
                <div class="welcome-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const modal = document.getElementById('name-modal-overlay');
    const modalCard = document.getElementById('welcome-modal');
    const input = document.getElementById('user-name-input');
    const submitBtn = document.getElementById('name-modal-submit');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('welcome-avatar-preview');
    
    // Trigger entrance animation after DOM insertion
    requestAnimationFrame(() => {
        modal.classList.add('is-visible');
    });
    
    // Handle avatar upload
    avatarUpload.addEventListener('change', (e) => {
        handleAvatarUpload(e, avatarPreview);
    });
    
    // Enable/disable button based on input with micro-interaction
    input.addEventListener('input', () => {
        const hasValue = input.value.trim().length > 0;
        submitBtn.disabled = !hasValue;
        
        // Add typing indicator class
        if (hasValue) {
            modalCard.classList.add('has-input');
        } else {
            modalCard.classList.remove('has-input');
        }
    });
    
    // Input focus effects
    input.addEventListener('focus', () => {
        modalCard.classList.add('input-focused');
    });
    
    input.addEventListener('blur', () => {
        modalCard.classList.remove('input-focused');
    });
    
    // Handle Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            handleNameSubmit(input, modal);
        }
    });
    
    // Handle submit button click
    submitBtn.addEventListener('click', () => {
        handleNameSubmit(input, modal);
    });
    
    // Focus input after entrance animation completes
    setTimeout(() => input.focus(), 600);
}

/**
 * Handle name submission from modal
 * Includes loading state with premium animation
 */
async function handleNameSubmit(input, modal) {
    const name = input.value.trim();
    if (!name) return;
    
    // Get avatar if uploaded
    const avatarPreview = document.getElementById('welcome-avatar-preview');
    const avatarBase64 = avatarPreview?.dataset?.avatarBase64 || null;
    
    // Show loading state with animation
    const submitBtn = document.getElementById('name-modal-submit');
    const modalCard = document.getElementById('welcome-modal');
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = `
        <span class="welcome-btn-text">Creating your journey...</span>
        <span class="welcome-btn-spinner"></span>
    `;
    
    try {
        // Register user
        await registerUser(name);
        
        // Save avatar if provided
        if (avatarBase64) {
            saveAvatar(avatarBase64);
        }
        
        // Success state before closing
        submitBtn.classList.remove('is-loading');
        submitBtn.classList.add('is-success');
        submitBtn.innerHTML = `
            <span class="welcome-btn-text">Let's go!</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
        `;
        
        // Close modal with exit animation
        setTimeout(() => {
            modal.classList.add('is-closing');
            setTimeout(() => {
                modal.remove();
                
                // Update greeting if it's displayed
                updateGreetingDisplay();
                
                // Render avatar
                renderUserAvatar();
            }, 500);
        }, 600);
        
    } catch (error) {
        console.error('[Modal] Error during registration:', error);
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.innerHTML = `
            <span class="welcome-btn-text">Start My Journey</span>
            <span class="welcome-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
            </span>
        `;
    }
}

// ==================== GREETING DISPLAY ====================

/**
 * Update the greeting display (if greeting element exists)
 * @deprecated Use updateHeroGreeting() for the new hero greeting
 */
function updateGreetingDisplay() {
    // Legacy support - redirect to hero greeting
    updateHeroGreeting();
}

/**
 * Update the hero greeting display
 * Shows personalized, time-based motivational message above the badge
 * 
 * Features:
 * - Time-based greeting (morning/afternoon/evening/night)
 * - Personalized with user's name from localStorage
 * - Graceful fallback if no name stored
 * - Auto-updates on visibility for long page sessions
 */
function updateHeroGreeting() {
    const greetingWrapper = document.getElementById('hero-greeting-wrapper');
    const greetingEl = document.getElementById('hero-greeting');
    const greetingText = greetingEl?.querySelector('.hero-greeting-text');
    
    if (!greetingEl || !greetingText) {
        console.warn('[Greeting] Hero greeting element not found');
        return;
    }
    
    // Check if user exists
    const user = getStoredUser();
    
    if (!user) {
        // No user yet - hide greeting wrapper entirely
        greetingWrapper.style.display = 'none';
        return;
    }
    
    // Ensure wrapper is visible
    greetingWrapper.style.display = 'flex';
    
    // Get the personalized greeting message
    const greeting = getHeroGreeting(user.name);
    
    // Update text content
    greetingText.textContent = greeting;
    
    // Trigger visibility animation (slight delay for smooth entrance)
    requestAnimationFrame(() => {
        greetingEl.classList.add('is-visible');
    });
    
    console.log('[Greeting] Hero greeting updated:', greeting);
}

/**
 * Get hero-specific greeting message
 * Optimized messages for the hero section context
 * 
 * @param {string} name - User's name
 * @returns {string} - Greeting message
 */
function getHeroGreeting(name) {
    const hour = new Date().getHours();
    const userName = name || 'there';
    
    // Time-based greetings optimized for hero section
    // These are shorter and more impactful than general greetings
    const greetings = {
        morning: [
            `Good morning, ${userName}. Today is your chance.`,
            `Rise and conquer, ${userName}.`,
            `Good morning, ${userName}. Make today count.`,
            `A fresh start, ${userName}. Let's go.`
        ],
        afternoon: [
            `Good afternoon, ${userName}. Stay disciplined.`,
            `Keep going, ${userName}. You're doing great.`,
            `Good afternoon, ${userName}. Stay focused.`,
            `Halfway there, ${userName}. Push through.`
        ],
        evening: [
            `Good evening, ${userName}. Finish strong.`,
            `Evening, ${userName}. Reflect and prepare.`,
            `Good evening, ${userName}. End the day proud.`,
            `Almost there, ${userName}. Strong finish.`
        ],
        night: [
            `Good night, ${userName}. Tomorrow is another chance.`,
            `Rest well, ${userName}. You've earned it.`,
            `Good night, ${userName}. Dream big.`,
            `Night owl, ${userName}? Plan your tomorrow.`
        ]
    };
    
    // Determine time period (matches user's requirement)
    let period;
    if (hour >= 5 && hour < 12) {
        period = 'morning';
    } else if (hour >= 12 && hour < 17) {
        period = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
        period = 'evening';
    } else {
        period = 'night';
    }
    
    // Pick a consistent greeting based on the current hour
    // This prevents message changing on every refresh within the same hour
    const options = greetings[period];
    const index = hour % options.length;
    
    return options[index];
}

/**
 * Setup auto-refresh for greeting when page becomes visible
 * Handles cases where user leaves tab open for a long time
 */
function setupGreetingAutoRefresh() {
    // Update greeting when page becomes visible (user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateHeroGreeting();
        }
    });
    
    // Also update every hour while page is open
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateHeroGreeting();
        }
    }, 60 * 60 * 1000); // 1 hour
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the Supabase integration
 * This should be called after the main app initializes
 */
async function initSupabaseIntegration() {
    console.log('[Supabase Integration] Initializing...');
    
    // Setup greeting auto-refresh for long sessions
    setupGreetingAutoRefresh();
    
    // Check if first visit and show name modal
    if (isFirstVisit()) {
        // Small delay to let main app render first
        setTimeout(showNameModal, 500);
    } else {
        // Existing user - update last active
        updateLastActive();
        
        // Update hero greeting display
        updateHeroGreeting();
        
        // Render user avatar
        renderUserAvatar();
    }
    
    console.log('[Supabase Integration] Ready');
}

// ==================== EXPORTS ====================

// Make functions available globally for use in main script
window.SupabaseIntegration = {
    // User functions
    isFirstVisit,
    getStoredUser,
    getUserName,
    registerUser,
    
    // Avatar functions
    getStoredAvatar,
    saveAvatar,
    getInitials,
    renderUserAvatar,
    
    // Greeting
    getPersonalizedGreeting,
    updateGreetingDisplay,
    updateHeroGreeting,
    getHeroGreeting,
    
    // Analytics (admin only)
    getAnalyticsSummary,
    getAnonymousLocalStats,
    
    // Initialization
    init: initSupabaseIntegration
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseIntegration);
} else {
    // DOM already loaded - init on next tick to not block main script
    setTimeout(initSupabaseIntegration, 0);
}
