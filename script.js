/**
 * ========================================
 * HABIT TRACKER - SCRIPT.JS
 * A complete habit tracking application
 * ========================================
 */

// ==================== CONSTANTS ====================
const STORAGE_KEY_STREAK = 'habitTracker2026_streak';
const STORAGE_KEY_NOTES = 'habitTracker2026_notes';
const STORAGE_KEY_REMINDERS = 'habitTracker2026_reminders';

// Habit Categories
const HABIT_CATEGORIES = [
    { id: 'health', name: 'Health', icon: '🧘' },
    { id: 'study', name: 'Study', icon: '📚' },
    { id: 'discipline', name: 'Discipline', icon: '⏰' },
    { id: 'mind', name: 'Mind', icon: '🧠' },
    { id: 'other', name: 'Other', icon: '➕' }
];

const MONTHS = [
    { name: 'January', days: 31, icon: '❄️' },
    { name: 'February', days: 29, icon: '💝' }, // 2026 is not a leap year, but we'll use 29 for flexibility
    { name: 'March', days: 31, icon: '🌸' },
    { name: 'April', days: 30, icon: '🌷' },
    { name: 'May', days: 31, icon: '🌻' },
    { name: 'June', days: 30, icon: '☀️' },
    { name: 'July', days: 31, icon: '🏖️' },
    { name: 'August', days: 31, icon: '🌴' },
    { name: 'September', days: 30, icon: '🍂' },
    { name: 'October', days: 31, icon: '🎃' },
    { name: 'November', days: 30, icon: '🍁' },
    { name: 'December', days: 31, icon: '🎄' }
];

const STORAGE_KEY = 'habitTracker2026';

// Nature panorama images for each month - Beautiful World Wonders
const MONTH_PANORAMAS = [
    'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?q=80&w=2070&auto=format&fit=crop', // January - Snowy Alps
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop', // February - Mountains above clouds
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop', // March - Japanese Cherry Blossoms
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto=format&fit=crop', // April - Tulip Fields
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2070&auto=format&fit=crop', // May - Green Hills
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=2070&auto=format&fit=crop', // June - Waterfall
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', // July - Lake & Mountains
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070&auto=format&fit=crop', // August - Mountain Sunrise
    'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?q=80&w=2070&auto=format&fit=crop', // September - Autumn Forest
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop', // October - Autumn Lake Reflection
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2070&auto=format&fit=crop', // November - Misty Forest
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2070&auto=format&fit=crop'  // December - Starry Night Sky
];

// ==================== STATE ====================
let appState = {
    currentMonth: null,
    data: {},
    currentView: 'landing', // 'landing', 'app', 'month'
    focusMode: false,       // Today Focus Mode state
    streakData: {           // Streak tracking
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null
    },
    notes: {},              // Habit notes { habitId_date: "note text" }
    reminders: {            // Smart reminder settings
        enabled: false,
        reminderTime: '21:00',      // Default: 9 PM
        lastNotifiedDate: null
    },
    categoryFilter: 'all'       // Current category filter ('all' or category id)
};

// Chart instances
let pieChart = null;
let lineChart = null;

// ==================== DOM ELEMENTS ====================
let elements = {};

// Rotating text messages for hero
const ROTATING_TEXTS = [
    "You are the only hope of your family",
    "You retire your mother in 2026",
    "Your success becomes their peace",
    "You break the cycle this year"
];

let currentTextIndex = 0;

// ==================== INITIALIZATION ====================

/**
 * Initialize DOM elements
 */
function initElements() {
    elements = {
        // Landing page elements
        landingPage: document.getElementById('landing-page'),
        startTrackingBtn: document.getElementById('start-tracking-btn'),
        viewProgressBtn: document.getElementById('view-progress-btn'),
        finalStartBtn: document.getElementById('final-start-btn'),
        previewMonths: document.getElementById('preview-months'),
        
        // Month view elements
        monthView: document.getElementById('month-view'),
        backBtn: document.getElementById('back-btn'),
        monthTitle: document.getElementById('month-title'),
        addHabitBtn: document.getElementById('add-habit-btn'),
        emptyState: document.getElementById('empty-state'),
        tableContainer: document.getElementById('table-container'),
        tableHeader: document.getElementById('table-header'),
        tableBody: document.getElementById('table-body'),
        progressSection: document.getElementById('progress-section'),
        piePercentage: document.getElementById('pie-percentage'),
        
        // New feature elements
        focusModeBtn: document.getElementById('focus-mode-btn'),
        streakContainer: document.getElementById('streak-container'),
        summaryContainer: document.getElementById('summary-container'),
        
        // Modal elements
        modalOverlay: document.getElementById('modal-overlay'),
        modalClose: document.getElementById('modal-close'),
        modalCancel: document.getElementById('modal-cancel'),
        modalSave: document.getElementById('modal-save'),
        habitInput: document.getElementById('habit-input')
    };
}

/**
 * Initialize the application
 */
function init() {
    initElements();
    loadData();
    renderPreviewMonths();
    attachEventListeners();
    startTextRotation();
    initReminderSystem();
    initDailySpace();  // Initialize Daily Space (Notes) feature
    
    // Initialize Live Clock and Calendar
    startClock();
    initCalendar2026();
    
    console.log('Habit Tracker 2026 initialized!');
}

/**
 * Load data from localStorage
 */
function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            appState.data = JSON.parse(savedData);
        } catch (e) {
            console.error('Error loading data:', e);
            appState.data = {};
        }
    }
    
    // Load streak data
    const savedStreak = localStorage.getItem(STORAGE_KEY_STREAK);
    if (savedStreak) {
        try {
            appState.streakData = JSON.parse(savedStreak);
        } catch (e) {
            console.error('Error loading streak data:', e);
        }
    }
    
    // Load notes data
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    if (savedNotes) {
        try {
            appState.notes = JSON.parse(savedNotes);
        } catch (e) {
            console.error('Error loading notes:', e);
            appState.notes = {};
        }
    }
    
    // Load reminder settings
    const savedReminders = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (savedReminders) {
        try {
            appState.reminders = { ...appState.reminders, ...JSON.parse(savedReminders) };
        } catch (e) {
            console.error('Error loading reminders:', e);
        }
    }
}

/**
 * Save data to localStorage
 */
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

/**
 * Save streak data to localStorage
 */
function saveStreakData() {
    try {
        localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(appState.streakData));
    } catch (e) {
        console.error('Error saving streak data:', e);
    }
}

/**
 * Save notes to localStorage
 */
function saveNotes() {
    try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(appState.notes));
    } catch (e) {
        console.error('Error saving notes:', e);
    }
}

/**
 * Save reminder settings to localStorage
 */
function saveReminders() {
    try {
        localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(appState.reminders));
    } catch (e) {
        console.error('Error saving reminders:', e);
    }
}

/**
 * Get month data or initialize if not exists
 */
function getMonthData(monthIndex) {
    const monthKey = `month_${monthIndex}`;
    if (!appState.data[monthKey]) {
        appState.data[monthKey] = {
            habits: [],
            completions: {}
        };
    }
    return appState.data[monthKey];
}

// ==================== RENDERING ====================

/**
 * Render preview month cards on landing page
 */
function renderPreviewMonths() {
    if (!elements.previewMonths) return;
    
    elements.previewMonths.innerHTML = '';
    
    MONTHS.forEach((month, index) => {
        const monthData = getMonthData(index);
        const hasHabits = monthData.habits.length > 0;
        const progress = hasHabits ? calculateMonthProgress(index) : 0;
        
        const card = document.createElement('div');
        card.className = 'preview-month-card';
        card.dataset.month = index;
        
        card.innerHTML = `
            <div class="preview-month-image" style="background-image: url('${MONTH_PANORAMAS[index]}')"></div>
            <div class="preview-month-info">
                <div class="preview-month-name">
                    <span>${month.icon}</span>
                    ${month.name}
                </div>
                <div class="preview-month-status">
                    ${hasHabits ? `${progress}% complete` : 'Ready to start'}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            openMonthFromLanding(index);
        });
        
        elements.previewMonths.appendChild(card);
    });
}

/**
 * Render month cards on dashboard
 */
function renderMonthCards() {
    if (!elements.monthsGrid) return;
    
    elements.monthsGrid.innerHTML = '';
    
    MONTHS.forEach((month, index) => {
        const monthData = getMonthData(index);
        const hasHabits = monthData.habits.length > 0;
        const progress = hasHabits ? calculateMonthProgress(index) : 0;
        
        const card = document.createElement('div');
        card.className = 'month-card';
        card.dataset.month = index;
        
        card.innerHTML = `
            <div class="month-card-image"></div>
            <div class="month-card-content">
                <div class="month-card-name">
                    <span class="month-icon">${month.icon}</span>
                    ${month.name}
                </div>
                <div class="month-card-progress ${hasHabits ? 'has-data' : ''}">
                    ${hasHabits ? `${progress}% complete` : 'No habits yet'}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openMonth(index));
        elements.monthsGrid.appendChild(card);
    });
}

/**
 * Calculate overall progress for a month
 */
function calculateMonthProgress(monthIndex) {
    const monthData = getMonthData(monthIndex);
    const month = MONTHS[monthIndex];
    
    if (monthData.habits.length === 0) return 0;
    
    let totalCheckboxes = monthData.habits.length * month.days;
    let checkedCount = 0;
    
    monthData.habits.forEach(habit => {
        for (let day = 1; day <= month.days; day++) {
            const key = `${habit.id}_${day}`;
            if (monthData.completions[key]) {
                checkedCount++;
            }
        }
    });
    
    return Math.round((checkedCount / totalCheckboxes) * 100);
}

// ==================== NAVIGATION ====================

/**
 * Show the main app (hide landing page)
 */
function showApp() {
    // Scroll to the dashboard preview section instead of switching views
    const previewSection = document.getElementById('dashboard-preview');
    if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * View current month's progress
 */
function viewProgress() {
    // Find the month with most recent activity, or default to current month
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0 = January
    
    // Check if any month has habits, prefer the one with data
    let monthToOpen = currentMonthIndex;
    
    for (let i = 0; i < 12; i++) {
        const monthData = getMonthData(i);
        if (monthData.habits.length > 0) {
            monthToOpen = i;
            break;
        }
    }
    
    // Open the habit tracker for that month
    openMonthFromLanding(monthToOpen);
}

/**
 * Show landing page (hide app)
 */
function showLanding() {
    console.log('showLanding called');
    appState.currentView = 'landing';
    appState.currentMonth = null;
    
    // Hide month view, show landing
    if (elements.monthView) {
        elements.monthView.classList.add('hidden');
    }
    if (elements.landingPage) {
        elements.landingPage.classList.remove('hidden');
    }
    document.body.classList.remove('app-mode');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update preview months with latest progress
    renderPreviewMonths();
    
    // Destroy charts
    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }
    if (lineChart) {
        lineChart.destroy();
        lineChart = null;
    }
}

/**
 * Open month from landing page (show habit tracker overlay)
 */
function openMonthFromLanding(monthIndex) {
    appState.currentMonth = monthIndex;
    appState.currentView = 'month';
    appState.focusMode = false; // Reset focus mode when opening new month
    
    // Hide landing, show month view
    if (elements.landingPage) {
        elements.landingPage.classList.add('hidden');
    }
    if (elements.monthView) {
        elements.monthView.classList.remove('hidden');
        elements.monthView.classList.remove('focus-mode-active');
    }
    
    document.body.classList.add('app-mode');
    elements.monthTitle.textContent = MONTHS[monthIndex].name;
    
    // Set the nature panorama background for this month
    const panorama = document.getElementById('month-panorama');
    if (panorama) {
        panorama.style.backgroundImage = `url('${MONTH_PANORAMAS[monthIndex]}')`;
    }
    
    // Reset focus button state
    const focusBtn = document.getElementById('focus-mode-btn');
    if (focusBtn) {
        focusBtn.classList.remove('focus-active');
        focusBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            🎯 Focus on Today
        `;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    renderHabitTable();
    updateCharts();
    
    // Initialize new features
    calculateStreak();
    renderStreakDisplay();
    renderMonthlySummary();
    renderHeatmap();
}

/**
 * Start rotating hero text
 */
function startTextRotation() {
    const textElement = document.getElementById('rotating-text');
    if (!textElement) return;
    
    setInterval(() => {
        currentTextIndex = (currentTextIndex + 1) % ROTATING_TEXTS.length;
        textElement.style.opacity = '0';
        textElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            textElement.textContent = ROTATING_TEXTS[currentTextIndex];
            textElement.style.opacity = '1';
            textElement.style.transform = 'translateY(0)';
        }, 300);
    }, 4000);
}

/**
 * Open a specific month view
 */
function openMonth(monthIndex) {
    appState.currentMonth = monthIndex;
    appState.currentView = 'month';
    
    // Make sure app is visible
    if (elements.landingPage && !elements.landingPage.classList.contains('hidden')) {
        showApp();
    }
    
    // Update UI
    elements.dashboardView.classList.add('hidden');
    elements.monthView.classList.remove('hidden');
    elements.monthTitle.textContent = MONTHS[monthIndex].name;
    
    // Set the nature panorama background for this month
    const panorama = document.getElementById('month-panorama');
    if (panorama) {
        panorama.style.backgroundImage = `url('${MONTH_PANORAMAS[monthIndex]}')`;
    }
    
    renderHabitTable();
    updateCharts();
}

/**
 * Go back to dashboard
 */
function goToDashboard() {
    appState.currentMonth = null;
    appState.currentView = 'app';
    elements.monthView.classList.add('hidden');
    elements.dashboardView.classList.remove('hidden');
    
    // Re-render month cards to update progress
    renderMonthCards();
    
    // Destroy charts to prevent memory leaks
    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }
    if (lineChart) {
        lineChart.destroy();
        lineChart = null;
    }
}

/**
 * Render the habit tracking table
 */
function renderHabitTable() {
    const monthIndex = appState.currentMonth;
    const month = MONTHS[monthIndex];
    const monthData = getMonthData(monthIndex);
    
    // Show/hide empty state and table
    if (monthData.habits.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.tableContainer.classList.add('hidden');
        elements.progressSection.classList.add('hidden');
        
        // Hide summary when no habits
        const summaryContainer = document.getElementById('summary-container');
        if (summaryContainer) summaryContainer.classList.add('hidden');
        
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.tableContainer.classList.remove('hidden');
    elements.progressSection.classList.remove('hidden');
    
    // Reset table container to table mode (in case coming from focus mode)
    elements.tableContainer.innerHTML = `
        <table class="habit-table" id="habit-table">
            <thead id="table-header"></thead>
            <tbody id="table-body"></tbody>
        </table>
    `;
    
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    
    // Render header
    let headerHTML = '<tr><th>Habit</th>';
    for (let day = 1; day <= month.days; day++) {
        headerHTML += `<th class="date-cell">${day}</th>`;
    }
    headerHTML += '<th>Done</th></tr>';
    tableHeader.innerHTML = headerHTML;
    
    // Render body with category filter
    let bodyHTML = '';
    monthData.habits.forEach(habit => {
        // Apply category filter
        if (appState.categoryFilter !== 'all') {
            const habitCategory = habit.category || 'other';
            if (habitCategory !== appState.categoryFilter) {
                return; // Skip habits that don't match filter
            }
        }
        bodyHTML += renderHabitRow(habit, month.days, monthData);
    });
    tableBody.innerHTML = bodyHTML;
    
    // Show message if no habits match filter
    if (bodyHTML === '' && monthData.habits.length > 0) {
        tableBody.innerHTML = `
            <tr class="no-habits-filtered">
                <td colspan="${month.days + 2}" style="text-align: center; padding: 2rem; color: #6b7280;">
                    No habits in this category. 
                    <button class="show-all-btn" onclick="document.querySelector('.filter-pill[data-category=\\'all\\']').click()">
                        Show all
                    </button>
                </td>
            </tr>
        `;
    }
    
    // Attach event listeners
    attachCheckboxListeners();
    attachDeleteListeners();
    attachNoteListeners();
    
    // Add click-to-add-note on checkbox cells
    attachCellNoteListeners();
}

/**
 * Render a single habit row
 */
function renderHabitRow(habit, totalDays, monthData) {
    let completedCount = 0;
    let cellsHTML = '';
    
    for (let day = 1; day <= totalDays; day++) {
        const key = `${habit.id}_${day}`;
        const isChecked = monthData.completions[key] || false;
        if (isChecked) completedCount++;
        
        // Check if this cell has a note
        const noteKey = `${habit.id}_${appState.currentMonth}_${day}`;
        const hasNote = appState.notes[noteKey];
        
        cellsHTML += `
            <td class="checkbox-cell ${hasNote ? 'has-note-indicator' : ''}">
                <input type="checkbox" 
                       class="habit-checkbox" 
                       data-habit-id="${habit.id}" 
                       data-day="${day}"
                       ${isChecked ? 'checked' : ''}>
                ${hasNote ? '<span class="note-dot" title="Has note"></span>' : ''}
            </td>
        `;
    }
    
    const percentage = Math.round((completedCount / totalDays) * 100);
    let completionClass = 'low';
    if (percentage >= 80) completionClass = 'high';
    else if (percentage >= 50) completionClass = 'medium';
    
    // Get category info
    const category = HABIT_CATEGORIES.find(c => c.id === habit.category) || HABIT_CATEGORIES.find(c => c.id === 'other');
    
    return `
        <tr data-habit-id="${habit.id}" data-category="${habit.category || 'other'}">
            <td>
                <div class="habit-name-cell">
                    <button class="delete-habit-btn" data-habit-id="${habit.id}" title="Delete habit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                    <span class="habit-category-tag" title="${category.name}">${category.icon}</span>
                    <span class="habit-name-text">${escapeHTML(habit.name)}</span>
                    <button class="note-btn table-note-btn" 
                            data-habit-id="${habit.id}" 
                            data-day="1"
                            title="Add notes">
                        📝
                    </button>
                </div>
            </td>
            ${cellsHTML}
            <td class="completion-cell ${completionClass}">${percentage}%</td>
        </tr>
    `;
}

/**
 * Attach event listeners to checkboxes
 */
function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.habit-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

/**
 * Attach event listeners to delete buttons
 */
function attachDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.delete-habit-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleDeleteHabit);
    });
}

/**
 * Handle checkbox change
 */
function handleCheckboxChange(e) {
    const habitId = e.target.dataset.habitId;
    const day = parseInt(e.target.dataset.day);
    const isChecked = e.target.checked;
    
    const monthData = getMonthData(appState.currentMonth);
    const key = `${habitId}_${day}`;
    
    monthData.completions[key] = isChecked;
    saveData();
    
    // Update the completion percentage for this row
    updateRowCompletion(habitId);
    
    // Update charts
    updateCharts();
    
    // Update streak system
    const streakIncreased = calculateStreak();
    renderStreakDisplay();
    if (streakIncreased) {
        animateStreakIncrease();
    }
    
    // Update monthly summary
    renderMonthlySummary();
    
    // Update heatmap
    renderHeatmap();
}

/**
 * Update completion percentage for a specific habit row
 */
function updateRowCompletion(habitId) {
    const monthIndex = appState.currentMonth;
    const month = MONTHS[monthIndex];
    const monthData = getMonthData(monthIndex);
    
    let completedCount = 0;
    for (let day = 1; day <= month.days; day++) {
        const key = `${habitId}_${day}`;
        if (monthData.completions[key]) completedCount++;
    }
    
    const percentage = Math.round((completedCount / month.days) * 100);
    const row = document.querySelector(`tr[data-habit-id="${habitId}"]`);
    const completionCell = row.querySelector('.completion-cell');
    
    completionCell.textContent = `${percentage}%`;
    completionCell.className = 'completion-cell';
    
    if (percentage >= 80) completionCell.classList.add('high');
    else if (percentage >= 50) completionCell.classList.add('medium');
    else completionCell.classList.add('low');
}

/**
 * Handle delete habit
 */
function handleDeleteHabit(e) {
    const habitId = e.currentTarget.dataset.habitId;
    
    if (!confirm('Are you sure you want to delete this habit? All progress will be lost.')) {
        return;
    }
    
    const monthData = getMonthData(appState.currentMonth);
    
    // Remove habit
    monthData.habits = monthData.habits.filter(h => h.id !== habitId);
    
    // Remove all completions for this habit
    Object.keys(monthData.completions).forEach(key => {
        if (key.startsWith(`${habitId}_`)) {
            delete monthData.completions[key];
        }
    });
    
    saveData();
    renderHabitTable();
    updateCharts();
    renderHeatmap();
    renderMonthlySummary();
}

// ==================== CHARTS ====================

/**
 * Update both charts
 */
function updateCharts() {
    updatePieChart();
    updateLineChart();
}

/**
 * Update pie chart
 */
function updatePieChart() {
    const monthIndex = appState.currentMonth;
    const progress = calculateMonthProgress(monthIndex);
    const remaining = 100 - progress;
    
    // Update center text
    elements.piePercentage.textContent = `${progress}%`;
    
    const ctx = document.getElementById('pie-chart').getContext('2d');
    
    const data = {
        labels: ['Completed', 'Remaining'],
        datasets: [{
            data: [progress, remaining],
            backgroundColor: [
                '#2383e2',
                '#e5e5e3'
            ],
            borderWidth: 0,
            cutout: '70%'
        }]
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw}%`;
                    }
                }
            }
        }
    };
    
    if (pieChart) {
        pieChart.data = data;
        pieChart.update();
    } else {
        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
}

/**
 * Update line chart
 */
function updateLineChart() {
    const monthIndex = appState.currentMonth;
    const month = MONTHS[monthIndex];
    const monthData = getMonthData(monthIndex);
    
    // Calculate daily completion percentages
    const dailyPercentages = [];
    const labels = [];
    
    for (let day = 1; day <= month.days; day++) {
        labels.push(day.toString());
        
        if (monthData.habits.length === 0) {
            dailyPercentages.push(0);
            continue;
        }
        
        let completedCount = 0;
        monthData.habits.forEach(habit => {
            const key = `${habit.id}_${day}`;
            if (monthData.completions[key]) completedCount++;
        });
        
        const percentage = Math.round((completedCount / monthData.habits.length) * 100);
        dailyPercentages.push(percentage);
    }
    
    const ctx = document.getElementById('line-chart').getContext('2d');
    
    const data = {
        labels: labels,
        datasets: [{
            label: 'Daily Completion %',
            data: dailyPercentages,
            borderColor: '#2383e2',
            backgroundColor: 'rgba(35, 131, 226, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#2383e2',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        }]
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    maxRotation: 0,
                    callback: function(value, index) {
                        // Show every 5th label to avoid crowding
                        return (index + 1) % 5 === 0 || index === 0 ? labels[index] : '';
                    }
                }
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    callback: function(value) {
                        return value + '%';
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Completion: ${context.raw}%`;
                    },
                    title: function(context) {
                        return `Day ${context[0].label}`;
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };
    
    if (lineChart) {
        lineChart.data = data;
        lineChart.update();
    } else {
        lineChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
}

// ==================== MODAL ====================

/**
 * Open add habit modal
 */
function openModal() {
    elements.habitInput.value = '';
    elements.modalOverlay.classList.remove('hidden');
    elements.habitInput.focus();
    
    // Reset category selection to 'other' (default)
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'other') {
            btn.classList.add('active');
        }
    });
}

/**
 * Close add habit modal
 */
function closeModal() {
    elements.modalOverlay.classList.add('hidden');
    elements.habitInput.value = '';
}

/**
 * Save new habit
 */
function saveHabit() {
    const habitName = elements.habitInput.value.trim();
    
    // Get category from active button
    const activeCategory = document.querySelector('.category-btn.active');
    const category = activeCategory ? activeCategory.dataset.category : 'other';
    
    if (!habitName) {
        elements.habitInput.focus();
        return;
    }
    
    const monthData = getMonthData(appState.currentMonth);
    
    // Generate unique ID
    const habitId = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add habit with category
    monthData.habits.push({
        id: habitId,
        name: habitName,
        category: category,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    closeModal();
    renderHabitTable();
    updateCharts();
    renderHeatmap();
}

// ==================== EVENT LISTENERS ====================

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Landing page buttons
    if (elements.startTrackingBtn) {
        elements.startTrackingBtn.addEventListener('click', showApp);
    }
    if (elements.viewProgressBtn) {
        elements.viewProgressBtn.addEventListener('click', viewProgress);
    }
    if (elements.finalStartBtn) {
        elements.finalStartBtn.addEventListener('click', showApp);
    }
    
    // Back to home button (from month view)
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', showLanding);
    }
    
    // Add habit button
    if (elements.addHabitBtn) {
        elements.addHabitBtn.addEventListener('click', openModal);
    }
    
    // Focus mode button
    if (elements.focusModeBtn) {
        elements.focusModeBtn.addEventListener('click', toggleFocusMode);
    }
    
    // Modal controls
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    if (elements.modalCancel) {
        elements.modalCancel.addEventListener('click', closeModal);
    }
    if (elements.modalSave) {
        elements.modalSave.addEventListener('click', saveHabit);
    }
    
    // Close modal on overlay click
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) {
                closeModal();
            }
        });
    }
    
    // Handle Enter key in input
    if (elements.habitInput) {
        elements.habitInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveHabit();
            }
        });
    }
    
    // Handle Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modalOverlay && !elements.modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    // Smooth scroll for landing page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Category selector buttons in Add Habit modal
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
        });
    });
    
    // Category filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const category = pill.dataset.category;
            appState.categoryFilter = category;
            
            // Update active state
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            // Re-render habits with filter
            if (appState.currentMonth !== null) {
                renderHabits();
            }
        });
    });
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== STREAK SYSTEM ====================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Get date string for a specific date
 */
function getDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Check if at least one habit was completed on a given date
 */
function hasCompletionOnDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const monthIndex = month - 1; // Convert to 0-based
    const monthData = getMonthData(monthIndex);
    
    if (monthData.habits.length === 0) return false;
    
    for (const habit of monthData.habits) {
        const key = `${habit.id}_${day}`;
        if (monthData.completions[key]) {
            return true;
        }
    }
    return false;
}

/**
 * Calculate streak from all data
 * Current streak: consecutive days with ≥1 habit completed (up to today)
 * Longest streak: best ever recorded
 */
function calculateStreak() {
    const today = new Date();
    const todayString = getTodayDateString();
    
    // Check if user completed anything today
    const completedToday = hasCompletionOnDate(todayString);
    
    // Calculate current streak by going backwards from today (or yesterday if not completed today)
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // If completed today, start counting from today; otherwise from yesterday
    if (!completedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days going backwards
    while (true) {
        const dateString = getDateString(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        
        // Don't go before Jan 1, 2026
        if (checkDate.getFullYear() < 2026) break;
        
        if (hasCompletionOnDate(dateString)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Update longest streak if current is higher
    const longestStreak = Math.max(currentStreak, appState.streakData.longestStreak || 0);
    const previousStreak = appState.streakData.currentStreak || 0;
    
    // Update state
    appState.streakData = {
        currentStreak,
        longestStreak,
        lastActiveDate: completedToday ? todayString : appState.streakData.lastActiveDate
    };
    
    saveStreakData();
    
    // Return whether streak increased (for animation)
    return currentStreak > previousStreak;
}

/**
 * Render streak display in the month view
 */
function renderStreakDisplay() {
    const streakContainer = document.getElementById('streak-container');
    if (!streakContainer) return;
    
    const { currentStreak, longestStreak } = appState.streakData;
    
    streakContainer.innerHTML = `
        <div class="streak-card streak-current">
            <div class="streak-icon">🔥</div>
            <div class="streak-info">
                <span class="streak-value" id="current-streak-value">${currentStreak}</span>
                <span class="streak-label">Current Streak</span>
            </div>
        </div>
        <div class="streak-card streak-best">
            <div class="streak-icon">🏆</div>
            <div class="streak-info">
                <span class="streak-value">${longestStreak}</span>
                <span class="streak-label">Best Streak</span>
            </div>
        </div>
    `;
}

/**
 * Animate streak increase
 */
function animateStreakIncrease() {
    const streakValue = document.getElementById('current-streak-value');
    if (!streakValue) return;
    
    streakValue.classList.add('streak-pulse');
    setTimeout(() => {
        streakValue.classList.remove('streak-pulse');
    }, 600);
}

// ==================== TODAY FOCUS MODE ====================

/**
 * Get today's date info (month index and day number)
 * Returns info relevant to 2026 calendar - if we're close to 2026,
 * returns January 1st info; if in 2026, returns actual today
 */
function getTodayInfo() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // If we're in 2026, return actual date
    if (year === 2026) {
        return { 
            monthIndex: month, 
            day: day,
            year: 2026,
            isInYear: true
        };
    }
    
    // If we're in late December 2025 (after 25th), 
    // prepare for January by returning January info
    if (year === 2025 && month === 11 && day >= 25) {
        const daysUntil2026 = 31 - day + 1; // days remaining + Jan 1
        return { 
            monthIndex: 0, // January
            day: 1,
            year: 2026,
            daysUntil2026: daysUntil2026,
            isInYear: false,
            currentDate: { year, month, day }
        };
    }
    
    // For other dates, return current month/day for testing purposes
    return { 
        monthIndex: month, 
        day: day,
        year: year,
        isInYear: year === 2026
    };
}

/**
 * Toggle Focus Mode
 */
function toggleFocusMode() {
    appState.focusMode = !appState.focusMode;
    
    const focusBtn = document.getElementById('focus-mode-btn');
    const monthView = document.getElementById('month-view');
    
    if (appState.focusMode) {
        monthView.classList.add('focus-mode-active');
        focusBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M12 3v18"/>
            </svg>
            Exit Focus Mode
        `;
        focusBtn.classList.add('focus-active');
        renderFocusModeView();
    } else {
        monthView.classList.remove('focus-mode-active');
        focusBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            🎯 Focus on Today
        `;
        focusBtn.classList.remove('focus-active');
        renderHabitTable();
    }
}

/**
 * Render Focus Mode view - shows only today's habits
 */
function renderFocusModeView() {
    const monthIndex = appState.currentMonth;
    const monthData = getMonthData(monthIndex);
    const todayInfo = getTodayInfo();
    
    // Check if viewing the current month
    const isCurrentMonth = monthIndex === todayInfo.monthIndex;
    const todayDay = isCurrentMonth ? todayInfo.day : 1;
    
    if (monthData.habits.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.tableContainer.classList.add('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.tableContainer.classList.remove('hidden');
    
    // Build countdown message if we're close to 2026
    let countdownHTML = '';
    if (todayInfo.daysUntil2026 && !todayInfo.isInYear) {
        countdownHTML = `
            <div class="focus-countdown">
                <span class="countdown-emoji">🚀</span>
                <span class="countdown-text">${todayInfo.daysUntil2026} day${todayInfo.daysUntil2026 > 1 ? 's' : ''} until 2026 begins!</span>
            </div>
        `;
    }
    
    // Build focus mode table
    const focusHTML = `
        <div class="focus-mode-container">
            <div class="focus-header">
                <h3 class="focus-title">🎯 Today's Focus</h3>
                <span class="focus-date">${MONTHS[monthIndex].name} ${todayDay}, 2026</span>
            </div>
            ${countdownHTML}
            <div class="focus-habits-list">
                ${monthData.habits.map(habit => {
                    const key = `${habit.id}_${todayDay}`;
                    const isChecked = monthData.completions[key] || false;
                    const noteKey = `${habit.id}_${monthIndex}_${todayDay}`;
                    const hasNote = appState.notes[noteKey];
                    
                    return `
                        <div class="focus-habit-item ${isChecked ? 'completed' : ''}">
                            <label class="focus-checkbox-label">
                                <input type="checkbox" 
                                       class="focus-checkbox" 
                                       data-habit-id="${habit.id}" 
                                       data-day="${todayDay}"
                                       ${isChecked ? 'checked' : ''}>
                                <span class="focus-checkmark"></span>
                                <span class="focus-habit-name">${escapeHTML(habit.name)}</span>
                            </label>
                            <button class="note-btn focus-note-btn ${hasNote ? 'has-note' : ''}" 
                                    data-habit-id="${habit.id}" 
                                    data-day="${todayDay}"
                                    title="${hasNote ? 'Edit note' : 'Add note'}">
                                📝
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="focus-progress">
                <div class="focus-progress-text">
                    <span>Today's Progress</span>
                    <span id="focus-progress-value">0%</span>
                </div>
                <div class="focus-progress-bar">
                    <div class="focus-progress-fill" id="focus-progress-fill"></div>
                </div>
            </div>
        </div>
    `;
    
    elements.tableContainer.innerHTML = focusHTML;
    
    // Update progress
    updateFocusProgress(todayDay, monthData);
    
    // Attach event listeners
    attachFocusCheckboxListeners();
    attachNoteListeners();
}

/**
 * Update focus mode progress bar
 */
function updateFocusProgress(day, monthData) {
    if (monthData.habits.length === 0) return;
    
    let completed = 0;
    monthData.habits.forEach(habit => {
        const key = `${habit.id}_${day}`;
        if (monthData.completions[key]) completed++;
    });
    
    const percentage = Math.round((completed / monthData.habits.length) * 100);
    
    const progressValue = document.getElementById('focus-progress-value');
    const progressFill = document.getElementById('focus-progress-fill');
    
    if (progressValue) progressValue.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
}

/**
 * Attach event listeners to focus mode checkboxes
 */
function attachFocusCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.focus-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFocusCheckboxChange);
    });
}

/**
 * Handle focus mode checkbox change
 */
function handleFocusCheckboxChange(e) {
    const habitId = e.target.dataset.habitId;
    const day = parseInt(e.target.dataset.day);
    const isChecked = e.target.checked;
    
    const monthData = getMonthData(appState.currentMonth);
    const key = `${habitId}_${day}`;
    
    monthData.completions[key] = isChecked;
    saveData();
    
    // Update UI
    const habitItem = e.target.closest('.focus-habit-item');
    if (isChecked) {
        habitItem.classList.add('completed');
    } else {
        habitItem.classList.remove('completed');
    }
    
    updateFocusProgress(day, monthData);
    
    // Update streak
    const streakIncreased = calculateStreak();
    renderStreakDisplay();
    if (streakIncreased) {
        animateStreakIncrease();
    }
}

// ==================== HABIT NOTES (MICRO-JOURNALING) ====================

/**
 * Open notes modal for a specific habit and day
 */
function openNotesModal(habitId, day) {
    const monthIndex = appState.currentMonth;
    const monthData = getMonthData(monthIndex);
    const habit = monthData.habits.find(h => h.id === habitId);
    
    if (!habit) return;
    
    const noteKey = `${habitId}_${monthIndex}_${day}`;
    const existingNote = appState.notes[noteKey] || '';
    
    // Create notes modal
    const modal = document.createElement('div');
    modal.className = 'notes-modal-overlay';
    modal.id = 'notes-modal-overlay';
    modal.innerHTML = `
        <div class="notes-modal">
            <div class="notes-modal-header">
                <div class="notes-modal-title">
                    <span class="notes-icon">📝</span>
                    <div>
                        <h4>${escapeHTML(habit.name)}</h4>
                        <span class="notes-date">${MONTHS[monthIndex].name} ${day}, 2026</span>
                    </div>
                </div>
                <button class="notes-modal-close" id="notes-modal-close">&times;</button>
            </div>
            <div class="notes-modal-body">
                <textarea 
                    id="note-textarea" 
                    class="note-textarea" 
                    placeholder="Add a quick note about today's progress, thoughts, or reflections..."
                    maxlength="500">${escapeHTML(existingNote)}</textarea>
                <div class="note-char-count">
                    <span id="note-char-current">${existingNote.length}</span>/500
                </div>
            </div>
            <div class="notes-modal-footer">
                ${existingNote ? '<button class="btn btn-danger-outline" id="note-delete">Delete Note</button>' : ''}
                <button class="btn btn-secondary" id="note-cancel">Cancel</button>
                <button class="btn btn-primary-app" id="note-save">Save Note</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus textarea
    const textarea = document.getElementById('note-textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // Character count update
    textarea.addEventListener('input', () => {
        document.getElementById('note-char-current').textContent = textarea.value.length;
    });
    
    // Close button
    document.getElementById('notes-modal-close').addEventListener('click', closeNotesModal);
    document.getElementById('note-cancel').addEventListener('click', closeNotesModal);
    
    // Overlay click to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeNotesModal();
    });
    
    // Save button
    document.getElementById('note-save').addEventListener('click', () => {
        saveNote(habitId, monthIndex, day, textarea.value);
    });
    
    // Delete button (if exists)
    const deleteBtn = document.getElementById('note-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteNote(habitId, monthIndex, day);
        });
    }
    
    // Escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeNotesModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Close notes modal
 */
function closeNotesModal() {
    const modal = document.getElementById('notes-modal-overlay');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 200);
    }
}

/**
 * Save note
 */
function saveNote(habitId, monthIndex, day, noteText) {
    const noteKey = `${habitId}_${monthIndex}_${day}`;
    const trimmedNote = noteText.trim();
    
    if (trimmedNote) {
        appState.notes[noteKey] = trimmedNote;
    } else {
        delete appState.notes[noteKey];
    }
    
    saveNotes();
    closeNotesModal();
    
    // Update UI to reflect note status
    updateNoteButtonStates();
    
    if (appState.focusMode) {
        renderFocusModeView();
    }
}

/**
 * Delete note
 */
function deleteNote(habitId, monthIndex, day) {
    const noteKey = `${habitId}_${monthIndex}_${day}`;
    delete appState.notes[noteKey];
    saveNotes();
    closeNotesModal();
    updateNoteButtonStates();
    
    if (appState.focusMode) {
        renderFocusModeView();
    }
}

/**
 * Update note button visual states
 */
function updateNoteButtonStates() {
    const noteButtons = document.querySelectorAll('.note-btn');
    noteButtons.forEach(btn => {
        const habitId = btn.dataset.habitId;
        const day = btn.dataset.day;
        const noteKey = `${habitId}_${appState.currentMonth}_${day}`;
        
        if (appState.notes[noteKey]) {
            btn.classList.add('has-note');
        } else {
            btn.classList.remove('has-note');
        }
    });
}

/**
 * Attach event listeners to note buttons
 */
function attachNoteListeners() {
    const noteButtons = document.querySelectorAll('.note-btn');
    noteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const habitId = btn.dataset.habitId;
            const day = parseInt(btn.dataset.day);
            openNotesModal(habitId, day);
        });
    });
}

/**
 * Attach double-click to checkbox cells for notes
 */
function attachCellNoteListeners() {
    const checkboxCells = document.querySelectorAll('.checkbox-cell');
    checkboxCells.forEach(cell => {
        cell.addEventListener('dblclick', (e) => {
            // Don't trigger if clicking on checkbox itself
            if (e.target.classList.contains('habit-checkbox')) return;
            
            const checkbox = cell.querySelector('.habit-checkbox');
            if (checkbox) {
                const habitId = checkbox.dataset.habitId;
                const day = parseInt(checkbox.dataset.day);
                openNotesModal(habitId, day);
            }
        });
    });
}

// ==================== MONTHLY SUMMARY CARD ====================

/**
 * Generate monthly summary data
 */
function generateMonthlySummary(monthIndex) {
    const month = MONTHS[monthIndex];
    const monthData = getMonthData(monthIndex);
    
    if (monthData.habits.length === 0) {
        return null;
    }
    
    // Calculate per-habit stats
    const habitStats = monthData.habits.map(habit => {
        let completed = 0;
        for (let day = 1; day <= month.days; day++) {
            const key = `${habit.id}_${day}`;
            if (monthData.completions[key]) completed++;
        }
        const percentage = Math.round((completed / month.days) * 100);
        return {
            name: habit.name,
            completed,
            percentage
        };
    });
    
    // Find best and weakest habits
    const sortedByPercentage = [...habitStats].sort((a, b) => b.percentage - a.percentage);
    const bestHabit = sortedByPercentage[0];
    const weakestHabit = sortedByPercentage[sortedByPercentage.length - 1];
    
    // Calculate average consistency
    const totalPercentage = habitStats.reduce((sum, h) => sum + h.percentage, 0);
    const avgConsistency = Math.round(totalPercentage / habitStats.length);
    
    // Calculate missed days (days with zero completions)
    let missedDays = 0;
    for (let day = 1; day <= month.days; day++) {
        let anyCompleted = false;
        for (const habit of monthData.habits) {
            const key = `${habit.id}_${day}`;
            if (monthData.completions[key]) {
                anyCompleted = true;
                break;
            }
        }
        if (!anyCompleted) missedDays++;
    }
    
    // Determine encouragement message based on performance
    let encouragement = '';
    if (avgConsistency >= 80) {
        encouragement = "Outstanding discipline! You're building an unstoppable version of yourself. 🚀";
    } else if (avgConsistency >= 60) {
        encouragement = "Great progress! Keep pushing—consistency compounds into excellence. 💪";
    } else if (avgConsistency >= 40) {
        encouragement = "You're on the path! Every checked box is a vote for your future self. 🌱";
    } else if (avgConsistency >= 20) {
        encouragement = "Progress over perfection. Small steps lead to big transformations. 🌟";
    } else {
        encouragement = "Every journey starts somewhere. Tomorrow is a new opportunity. 🌅";
    }
    
    return {
        bestHabit,
        weakestHabit,
        avgConsistency,
        missedDays,
        activeDays: month.days - missedDays,
        totalHabits: monthData.habits.length,
        encouragement
    };
}

/**
 * Render monthly summary card
 */
function renderMonthlySummary() {
    const summaryContainer = document.getElementById('summary-container');
    if (!summaryContainer) return;
    
    const monthIndex = appState.currentMonth;
    const summary = generateMonthlySummary(monthIndex);
    
    if (!summary) {
        summaryContainer.innerHTML = '';
        summaryContainer.classList.add('hidden');
        return;
    }
    
    summaryContainer.classList.remove('hidden');
    
    // Determine performance tier for styling
    let performanceTier = 'needs-work';
    if (summary.avgConsistency >= 80) performanceTier = 'excellent';
    else if (summary.avgConsistency >= 60) performanceTier = 'good';
    else if (summary.avgConsistency >= 40) performanceTier = 'fair';
    
    summaryContainer.innerHTML = `
        <div class="summary-card ${performanceTier}">
            <div class="summary-header">
                <h3 class="summary-title">📊 ${MONTHS[monthIndex].name} Summary</h3>
            </div>
            
            <div class="summary-stats">
                <div class="summary-stat best">
                    <span class="stat-icon">🥇</span>
                    <div class="stat-content">
                        <span class="stat-label">Best Habit</span>
                        <span class="stat-value">${escapeHTML(summary.bestHabit.name)}</span>
                        <span class="stat-detail">${summary.bestHabit.percentage}% completion</span>
                    </div>
                </div>
                
                <div class="summary-stat weak">
                    <span class="stat-icon">⚠️</span>
                    <div class="stat-content">
                        <span class="stat-label">Needs Attention</span>
                        <span class="stat-value">${escapeHTML(summary.weakestHabit.name)}</span>
                        <span class="stat-detail">${summary.weakestHabit.percentage}% completion</span>
                    </div>
                </div>
                
                <div class="summary-stat average">
                    <span class="stat-icon">📈</span>
                    <div class="stat-content">
                        <span class="stat-label">Avg Consistency</span>
                        <span class="stat-value stat-percentage">${summary.avgConsistency}%</span>
                    </div>
                </div>
                
                <div class="summary-stat missed">
                    <span class="stat-icon">${summary.missedDays === 0 ? '✅' : '📅'}</span>
                    <div class="stat-content">
                        <span class="stat-label">${summary.missedDays === 0 ? 'Perfect Attendance!' : 'Missed Days'}</span>
                        <span class="stat-value">${summary.missedDays === 0 ? 'None!' : summary.missedDays + ' days'}</span>
                        ${summary.missedDays > 0 ? `<span class="stat-detail">${summary.activeDays} active days</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="summary-encouragement">
                <p>${summary.encouragement}</p>
            </div>
        </div>
    `;
}

// ==================== HEATMAP VISUALIZATION ====================

/**
 * Calculate daily completion data for heatmap
 */
function calculateHeatmapData() {
    const monthIndex = appState.currentMonth;
    if (monthIndex === null) return [];
    
    const monthData = getMonthData(monthIndex);
    const month = MONTHS[monthIndex];
    const heatmapData = [];
    
    // If no habits, return empty data
    if (monthData.habits.length === 0) {
        for (let day = 1; day <= month.days; day++) {
            heatmapData.push({
                day,
                completed: 0,
                total: 0,
                percentage: 0
            });
        }
        return heatmapData;
    }
    
    // Calculate completion percentage for each day
    for (let day = 1; day <= month.days; day++) {
        let completed = 0;
        const total = monthData.habits.length;
        
        monthData.habits.forEach(habit => {
            const key = `${habit.id}_${day}`;
            if (monthData.completions[key]) {
                completed++;
            }
        });
        
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        heatmapData.push({
            day,
            completed,
            total,
            percentage
        });
    }
    
    return heatmapData;
}

/**
 * Get heatmap color level based on percentage
 * 0: No activity (0%)
 * 1: Light (1-30%)
 * 2: Medium (31-60%)
 * 3: Good (61-80%)
 * 4: Excellent (81-100%)
 */
function getHeatmapLevel(percentage) {
    if (percentage === 0) return 0;
    if (percentage <= 30) return 1;
    if (percentage <= 60) return 2;
    if (percentage <= 80) return 3;
    return 4;
}

/**
 * Render the activity heatmap
 */
function renderHeatmap() {
    const heatmapGrid = document.getElementById('heatmap-grid');
    const heatmapSection = document.getElementById('heatmap-section');
    
    if (!heatmapGrid || !heatmapSection) return;
    
    const monthIndex = appState.currentMonth;
    if (monthIndex === null) {
        heatmapSection.style.display = 'none';
        return;
    }
    
    const month = MONTHS[monthIndex];
    const heatmapData = calculateHeatmapData();
    
    // Show section
    heatmapSection.style.display = 'block';
    
    // Calculate the starting day of the week (0 = Sunday)
    // For 2026, we'll calculate it properly
    const firstDayOfMonth = new Date(2026, monthIndex, 1).getDay();
    
    // Generate heatmap grid HTML
    let gridHTML = '';
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
        gridHTML += '<div class="heatmap-cell empty"></div>';
    }
    
    // Add cells for each day
    heatmapData.forEach(data => {
        const level = getHeatmapLevel(data.percentage);
        const tooltip = data.total > 0 
            ? `${month.name} ${data.day} — ${data.completed}/${data.total} habits (${data.percentage}%)`
            : `${month.name} ${data.day} — No habits yet`;
        
        gridHTML += `
            <div class="heatmap-cell level-${level}" 
                 data-day="${data.day}"
                 data-percentage="${data.percentage}"
                 title="${tooltip}">
            </div>
        `;
    });
    
    heatmapGrid.innerHTML = gridHTML;
}

// ==================== SMART REMINDER SYSTEM ====================

/**
 * Check if browser supports notifications
 */
function supportsNotifications() {
    return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
function getNotificationPermission() {
    if (!supportsNotifications()) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
}

/**
 * Request notification permission from user
 * Returns promise that resolves to permission status
 */
async function requestNotificationPermission() {
    if (!supportsNotifications()) {
        return 'unsupported';
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (e) {
        console.error('Error requesting notification permission:', e);
        return 'error';
    }
}

/**
 * Show a browser notification
 * Uses Service Worker API for mobile compatibility
 */
async function showNotification(title, body, options = {}) {
    if (!supportsNotifications()) {
        console.log('Notifications not supported');
        return null;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted:', Notification.permission);
        return null;
    }
    
    try {
        // Use Service Worker notification API for mobile compatibility
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: options.tag || 'habit-reminder-' + Date.now(),
                requireInteraction: false,
                silent: false,
                data: { url: window.location.href },
                ...options
            });
            return true;
        } else {
            // Fallback for desktop or when SW not available
            const notification = new Notification(title, {
                body: body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: options.tag || 'habit-reminder-' + Date.now(),
                requireInteraction: false,
                silent: false,
                ...options
            });
            
            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                notification.close();
            };
            
            return notification;
        }
    } catch (e) {
        console.error('Error showing notification:', e);
        return null;
    }
}

/**
 * Check if user has any habits set up
 */
function hasAnyHabits() {
    for (let i = 0; i < 12; i++) {
        const monthData = getMonthData(i);
        if (monthData.habits && monthData.habits.length > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Check if reminder should be sent today
 * Returns true if:
 * - Reminders are enabled
 * - User has habits
 * - No habits completed today
 * - Haven't notified today yet
 */
function shouldSendReminder() {
    if (!appState.reminders.enabled) return false;
    if (!hasAnyHabits()) return false;
    
    const todayString = getTodayDateString();
    
    // Already notified today
    if (appState.reminders.lastNotifiedDate === todayString) return false;
    
    // Check if any habit completed today
    if (hasCompletionOnDate(todayString)) return false;
    
    return true;
}

/**
 * Send the daily reminder notification
 */
function sendDailyReminder() {
    if (!shouldSendReminder()) return;
    
    const notification = showNotification(
        '🔔 Habit Tracker 2026',
        "Have you completed today's habits? Don't break your streak! 💪"
    );
    
    if (notification) {
        // Mark as notified today
        appState.reminders.lastNotifiedDate = getTodayDateString();
        saveReminders();
    }
}

/**
 * Calculate milliseconds until next reminder time
 */
function getMillisecondsUntilReminder() {
    const now = new Date();
    const [hours, minutes] = appState.reminders.reminderTime.split(':').map(Number);
    
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If reminder time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    return reminderTime.getTime() - now.getTime();
}

// Reminder check interval ID
let reminderIntervalId = null;

/**
 * Start the reminder scheduler
 * Checks every minute if it's time to send a reminder
 */
function startReminderScheduler() {
    // Clear any existing interval
    if (reminderIntervalId) {
        clearInterval(reminderIntervalId);
    }
    
    if (!appState.reminders.enabled) return;
    
    // Check immediately if we should send (in case page was just opened at reminder time)
    checkAndSendReminder();
    
    // Check every minute
    reminderIntervalId = setInterval(checkAndSendReminder, 60000);
}

/**
 * Check if current time matches reminder time and send if needed
 */
function checkAndSendReminder() {
    if (!appState.reminders.enabled) return;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Check if current time matches reminder time (within the same minute)
    if (currentTime === appState.reminders.reminderTime) {
        sendDailyReminder();
    }
}

/**
 * Stop the reminder scheduler
 */
function stopReminderScheduler() {
    if (reminderIntervalId) {
        clearInterval(reminderIntervalId);
        reminderIntervalId = null;
    }
}

/**
 * Toggle reminders on/off
 * Handles permission request if enabling
 */
async function toggleReminders() {
    const wasEnabled = appState.reminders.enabled;
    
    if (!wasEnabled) {
        // Trying to enable - need to request permission
        const permission = await requestNotificationPermission();
        
        if (permission === 'granted') {
            appState.reminders.enabled = true;
            saveReminders();
            startReminderScheduler();
            updateReminderUI();
            updateReminderIndicator();
            showReminderToast('Reminders enabled! We\'ll remind you at ' + formatTime(appState.reminders.reminderTime));
        } else if (permission === 'denied') {
            showReminderToast('Notifications blocked. Please enable in browser settings.', 'warning');
        } else if (permission === 'unsupported') {
            showReminderToast('Your browser doesn\'t support notifications.', 'warning');
        }
    } else {
        // Disabling
        appState.reminders.enabled = false;
        saveReminders();
        stopReminderScheduler();
        updateReminderUI();
        updateReminderIndicator();
        showReminderToast('Daily reminders disabled.');
    }
}

/**
 * Update reminder time
 */
function updateReminderTime(newTime) {
    appState.reminders.reminderTime = newTime;
    saveReminders();
    
    // Restart scheduler with new time
    if (appState.reminders.enabled) {
        startReminderScheduler();
    }
    
    updateReminderUI();
}

/**
 * Format time for display (24h to 12h format)
 */
function formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Convert 12h format to 24h format
 */
function convertTo24Hour(hour, minute, period) {
    let hours24 = parseInt(hour);
    if (period === 'PM' && hours24 !== 12) {
        hours24 += 12;
    } else if (period === 'AM' && hours24 === 12) {
        hours24 = 0;
    }
    return `${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Get current time parts from 24h format
 */
function getTimeParts(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return { hour: hours12, minute: minutes, period };
}

/**
 * Generate hour options (1-12)
 */
function generateHourOptions() {
    const currentParts = getTimeParts(appState.reminders.reminderTime);
    let options = '';
    for (let i = 1; i <= 12; i++) {
        const selected = i === currentParts.hour ? 'selected' : '';
        options += `<option value="${i}" ${selected}>${i}</option>`;
    }
    return options;
}

/**
 * Generate minute options (00, 15, 30, 45)
 */
function generateMinuteOptions() {
    const currentParts = getTimeParts(appState.reminders.reminderTime);
    const minutes = [0, 15, 30, 45];
    let options = '';
    minutes.forEach(m => {
        const selected = m === currentParts.minute ? 'selected' : '';
        options += `<option value="${m}" ${selected}>${String(m).padStart(2, '0')}</option>`;
    });
    return options;
}

/**
 * Generate AM/PM options
 */
function generatePeriodOptions() {
    const currentParts = getTimeParts(appState.reminders.reminderTime);
    return `
        <option value="AM" ${currentParts.period === 'AM' ? 'selected' : ''}>AM</option>
        <option value="PM" ${currentParts.period === 'PM' ? 'selected' : ''}>PM</option>
    `;
}

/**
 * Update the reminder UI elements
 */
function updateReminderUI() {
    const toggle = document.getElementById('reminder-toggle');
    const timeInput = document.getElementById('reminder-time');
    const statusText = document.getElementById('reminder-status');
    
    if (toggle) {
        toggle.checked = appState.reminders.enabled;
    }
    
    if (timeInput) {
        timeInput.value = appState.reminders.reminderTime;
        timeInput.disabled = !appState.reminders.enabled;
    }
    
    if (statusText) {
        if (!supportsNotifications()) {
            statusText.textContent = 'Not supported';
            statusText.className = 'reminder-status unsupported';
        } else if (appState.reminders.enabled) {
            statusText.textContent = `Active · ${formatTime(appState.reminders.reminderTime)}`;
            statusText.className = 'reminder-status active';
        } else {
            statusText.textContent = 'Off';
            statusText.className = 'reminder-status inactive';
        }
    }
}

/**
 * Show a toast notification for reminder actions
 */
function showReminderToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.reminder-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `reminder-toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '⚠️'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Open reminder settings modal
 */
function openReminderSettings() {
    const modal = document.createElement('div');
    modal.className = 'reminder-modal-overlay';
    modal.id = 'reminder-modal-overlay';
    
    const permissionStatus = getNotificationPermission();
    const isSupported = supportsNotifications();
    const isGranted = permissionStatus === 'granted';
    const isDenied = permissionStatus === 'denied';
    
    modal.innerHTML = `
        <div class="reminder-modal">
            <div class="reminder-modal-header">
                <div class="reminder-modal-title">
                    <span class="reminder-icon">🔔</span>
                    <h4>Smart Reminders</h4>
                </div>
                <button class="reminder-modal-close" id="reminder-modal-close">&times;</button>
            </div>
            
            <div class="reminder-modal-body">
                ${!isSupported ? `
                    <div class="reminder-warning">
                        <span>⚠️</span>
                        <p>Your browser doesn't support notifications. Try using Chrome, Firefox, or Edge.</p>
                    </div>
                ` : isDenied ? `
                    <div class="reminder-warning">
                        <span>🚫</span>
                        <p>Notifications are blocked. Please enable them in your browser settings to use reminders.</p>
                    </div>
                ` : `
                    <p class="reminder-description">
                        We'll send you a gentle reminder only if you haven't completed any habits that day.
                    </p>
                    
                    <div class="reminder-setting">
                        <div class="reminder-setting-info">
                            <span class="setting-label">Enable Daily Reminder</span>
                            <span class="setting-hint">One notification per day, only when needed</span>
                        </div>
                        <label class="reminder-switch">
                            <input type="checkbox" id="reminder-toggle" ${appState.reminders.enabled ? 'checked' : ''}>
                            <span class="reminder-slider"></span>
                        </label>
                    </div>
                    
                    <div class="reminder-setting ${!appState.reminders.enabled ? 'disabled' : ''}">
                        <div class="reminder-setting-info">
                            <span class="setting-label">Reminder Time</span>
                            <span class="setting-hint">When should we check in?</span>
                        </div>
                        <div class="reminder-time-picker" id="reminder-time-picker">
                            <select id="reminder-hour" class="reminder-select" ${!appState.reminders.enabled ? 'disabled' : ''}>
                                ${generateHourOptions()}
                            </select>
                            <span class="time-separator">:</span>
                            <select id="reminder-minute" class="reminder-select" ${!appState.reminders.enabled ? 'disabled' : ''}>
                                ${generateMinuteOptions()}
                            </select>
                            <select id="reminder-period" class="reminder-select" ${!appState.reminders.enabled ? 'disabled' : ''}>
                                ${generatePeriodOptions()}
                            </select>
                        </div>
                    </div>
                    
                    <div class="reminder-status-bar">
                        <span class="status-label">Status:</span>
                        <span id="reminder-status" class="reminder-status ${appState.reminders.enabled ? 'active' : 'inactive'}">
                            ${appState.reminders.enabled ? `Active · ${formatTime(appState.reminders.reminderTime)}` : 'Off'}
                        </span>
                    </div>
                `}
            </div>
            
            <div class="reminder-modal-footer">
                <button class="btn btn-secondary" id="reminder-close-btn">Close</button>
                ${isSupported && !isDenied ? `
                    <button class="btn btn-primary-app" id="reminder-test-btn" ${!appState.reminders.enabled ? 'disabled' : ''}>
                        Test Notification
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Attach event listeners
    document.getElementById('reminder-modal-close').addEventListener('click', closeReminderSettings);
    document.getElementById('reminder-close-btn').addEventListener('click', closeReminderSettings);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeReminderSettings();
    });
    
    // Toggle listener
    const toggle = document.getElementById('reminder-toggle');
    if (toggle) {
        toggle.addEventListener('change', async () => {
            await toggleReminders();
            
            // Update time selects disabled state
            const hourSelect = document.getElementById('reminder-hour');
            const minuteSelect = document.getElementById('reminder-minute');
            const periodSelect = document.getElementById('reminder-period');
            const timeSetting = hourSelect?.closest('.reminder-setting');
            const testBtn = document.getElementById('reminder-test-btn');
            
            if (hourSelect) hourSelect.disabled = !appState.reminders.enabled;
            if (minuteSelect) minuteSelect.disabled = !appState.reminders.enabled;
            if (periodSelect) periodSelect.disabled = !appState.reminders.enabled;
            if (timeSetting) {
                timeSetting.classList.toggle('disabled', !appState.reminders.enabled);
            }
            if (testBtn) {
                testBtn.disabled = !appState.reminders.enabled;
            }
        });
    }
    
    // Time change listeners for AM/PM selectors
    const hourSelect = document.getElementById('reminder-hour');
    const minuteSelect = document.getElementById('reminder-minute');
    const periodSelect = document.getElementById('reminder-period');
    
    const handleTimeChange = () => {
        if (hourSelect && minuteSelect && periodSelect) {
            const newTime = convertTo24Hour(
                hourSelect.value,
                minuteSelect.value,
                periodSelect.value
            );
            updateReminderTime(newTime);
            showReminderToast(`Reminder time updated to ${formatTime(newTime)}`);
        }
    };
    
    if (hourSelect) hourSelect.addEventListener('change', handleTimeChange);
    if (minuteSelect) minuteSelect.addEventListener('change', handleTimeChange);
    if (periodSelect) periodSelect.addEventListener('change', handleTimeChange);
    
    // Test button listener
    const testBtn = document.getElementById('reminder-test-btn');
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            // Check if notifications are supported
            if (!supportsNotifications()) {
                showReminderToast('Notifications not supported in this browser', 'warning');
                return;
            }
            
            // Request permission if not granted
            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            
            if (permission === 'denied') {
                showReminderToast('Notifications are blocked. Check browser settings.', 'warning');
                return;
            }
            
            if (permission === 'granted') {
                try {
                    // Use Service Worker notification for mobile compatibility
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.showNotification('🔔 Habit Tracker 2026', {
                            body: 'This is a test notification. Your reminders are working! 🎉',
                            icon: '/icons/icon-192x192.png',
                            badge: '/icons/icon-96x96.png',
                            tag: 'habit-test-' + Date.now(),
                            requireInteraction: false,
                            vibrate: [200, 100, 200]
                        });
                        showReminderToast('Test notification sent!');
                    } else {
                        // Fallback for browsers without SW
                        const notification = new Notification('🔔 Habit Tracker 2026', {
                            body: 'This is a test notification. Your reminders are working! 🎉',
                            tag: 'habit-test-' + Date.now(),
                            requireInteraction: false
                        });
                        notification.onclick = () => {
                            window.focus();
                            notification.close();
                        };
                        showReminderToast('Test notification sent!');
                    }
                } catch (error) {
                    console.error('Notification error:', error);
                    showReminderToast('Error: ' + error.message, 'warning');
                }
            } else {
                showReminderToast('Please allow notifications first', 'warning');
            }
        });
    }
    
    // Escape to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeReminderSettings();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Close reminder settings modal
 */
function closeReminderSettings() {
    const modal = document.getElementById('reminder-modal-overlay');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 200);
    }
}

/**
 * Initialize the reminder system
 * Called on app load
 */
function initReminderSystem() {
    // Start scheduler if reminders are enabled and permission granted
    if (appState.reminders.enabled && getNotificationPermission() === 'granted') {
        startReminderScheduler();
    }
    
    // Update indicator on the reminder button
    updateReminderIndicator();
    
    // Attach reminder button listener
    const reminderBtn = document.getElementById('reminder-settings-btn');
    if (reminderBtn) {
        reminderBtn.addEventListener('click', openReminderSettings);
    }
}

/**
 * Update the reminder indicator dot on the button
 */
function updateReminderIndicator() {
    const indicator = document.getElementById('reminder-indicator');
    if (indicator) {
        if (appState.reminders.enabled && getNotificationPermission() === 'granted') {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
}

// ========================================
// DAILY SPACE - Full Page Notes App (Google Keep Style)
// Features: Text Notes, Checklists, Labels, Search, Grid/List View
// Offline-first with localStorage persistence
// ========================================

// Storage key for Daily Space notes
const STORAGE_KEY_DAILY_SPACE = 'quickNotes';

// Available labels
const DS_LABELS = ['personal', 'work', 'college', 'ideas', 'shopping'];

// Daily Space state
let dailySpaceState = {
    notes: [],
    editingNoteId: null,
    noteToDelete: null,
    currentView: 'grid', // 'grid' or 'list'
    activeLabel: 'all',
    searchQuery: ''
};

/**
 * Generate a unique ID for notes
 */
function dsGenerateId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Load notes from localStorage
 */
function dsLoadNotes() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_DAILY_SPACE);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migrate old notes that don't have new fields
            dailySpaceState.notes = parsed.map(note => ({
                id: note.id,
                type: note.type || 'text',
                title: note.title || '',
                text: note.text || '',
                checklist: note.checklist || [],
                labels: note.labels || [],
                pinned: note.pinned || false,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt || note.createdAt
            }));
        }
    } catch (e) {
        console.error('Error loading Daily Space notes:', e);
        dailySpaceState.notes = [];
    }
}

/**
 * Save notes to localStorage (auto-save)
 */
function dsSaveNotes() {
    try {
        localStorage.setItem(STORAGE_KEY_DAILY_SPACE, JSON.stringify(dailySpaceState.notes));
    } catch (e) {
        console.error('Error saving Daily Space notes:', e);
    }
}

/**
 * Sort notes: pinned first, then by update date
 */
function dsSortNotes() {
    dailySpaceState.notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

/**
 * Create a new note
 */
function dsCreateNote(noteData) {
    const now = new Date().toISOString();
    const newNote = {
        id: dsGenerateId(),
        type: noteData.type || 'text',
        title: (noteData.title || '').trim(),
        text: (noteData.text || '').trim(),
        checklist: noteData.checklist || [],
        labels: noteData.labels || [],
        pinned: false,
        createdAt: now,
        updatedAt: now
    };
    
    dailySpaceState.notes.unshift(newNote);
    dsSortNotes();
    dsSaveNotes();
    dsRenderNotes();
    
    return newNote;
}

/**
 * Update an existing note
 */
function dsUpdateNote(noteId, updates) {
    const note = dailySpaceState.notes.find(n => n.id === noteId);
    if (!note) return false;
    
    if (updates.title !== undefined) note.title = updates.title.trim();
    if (updates.text !== undefined) note.text = updates.text.trim();
    if (updates.type !== undefined) note.type = updates.type;
    if (updates.checklist !== undefined) note.checklist = updates.checklist;
    if (updates.labels !== undefined) note.labels = updates.labels;
    if (updates.pinned !== undefined) note.pinned = updates.pinned;
    
    note.updatedAt = new Date().toISOString();
    
    dsSortNotes();
    dsSaveNotes();
    dsRenderNotes();
    
    return true;
}

/**
 * Delete a note
 */
function dsDeleteNote(noteId) {
    const index = dailySpaceState.notes.findIndex(n => n.id === noteId);
    if (index === -1) return false;
    
    dailySpaceState.notes.splice(index, 1);
    dsSaveNotes();
    dsRenderNotes();
    
    return true;
}

/**
 * Toggle note pin status
 */
function dsTogglePin(noteId) {
    const note = dailySpaceState.notes.find(n => n.id === noteId);
    if (!note) return false;
    
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    
    dsSortNotes();
    dsSaveNotes();
    dsRenderNotes();
    
    return note.pinned;
}

/**
 * Filter notes based on search query and active label
 */
function dsGetFilteredNotes() {
    let filtered = [...dailySpaceState.notes];
    
    // Filter by label
    if (dailySpaceState.activeLabel !== 'all') {
        filtered = filtered.filter(note => 
            note.labels.includes(dailySpaceState.activeLabel)
        );
    }
    
    // Filter by search query
    if (dailySpaceState.searchQuery.trim()) {
        const query = dailySpaceState.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(query);
            const textMatch = note.text.toLowerCase().includes(query);
            const checklistMatch = note.checklist.some(item => 
                item.text.toLowerCase().includes(query)
            );
            return titleMatch || textMatch || checklistMatch;
        });
    }
    
    return filtered;
}

/**
 * Format date for display
 */
function dsFormatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    
    if (isToday) {
        return `Today, ${timeStr}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${timeStr}`;
    }
    
    const dateOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
        dateOptions.year = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', dateOptions) + ', ' + timeStr;
}

/**
 * Escape HTML to prevent XSS
 */
function dsEscapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render all notes to the grid
 */
function dsRenderNotes() {
    const grid = document.getElementById('ds-notes-grid');
    const emptyAll = document.getElementById('ds-empty-state');
    const emptySearch = document.getElementById('ds-no-results');
    
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filteredNotes = dsGetFilteredNotes();
    const hasFilters = dailySpaceState.searchQuery.trim() || dailySpaceState.activeLabel !== 'all';
    
    // Handle empty states
    if (filteredNotes.length === 0) {
        if (hasFilters) {
            emptyAll?.classList.add('hidden');
            emptySearch?.classList.remove('hidden');
        } else {
            emptyAll?.classList.remove('hidden');
            emptySearch?.classList.add('hidden');
        }
        return;
    }
    
    emptyAll?.classList.add('hidden');
    emptySearch?.classList.add('hidden');
    
    // Separate pinned and unpinned notes
    const pinnedNotes = filteredNotes.filter(n => n.pinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.pinned);
    
    // Render pinned section
    if (pinnedNotes.length > 0) {
        const pinnedLabel = document.createElement('div');
        pinnedLabel.className = 'ds-section-label';
        pinnedLabel.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pinned`;
        grid.appendChild(pinnedLabel);
        
        pinnedNotes.forEach(note => {
            grid.appendChild(dsCreateNoteCard(note));
        });
    }
    
    // Render others section
    if (unpinnedNotes.length > 0 && pinnedNotes.length > 0) {
        const othersLabel = document.createElement('div');
        othersLabel.className = 'ds-section-label';
        othersLabel.textContent = 'Others';
        grid.appendChild(othersLabel);
    }
    
    unpinnedNotes.forEach(note => {
        grid.appendChild(dsCreateNoteCard(note));
    });
}

/**
 * Create a note card element
 */
function dsCreateNoteCard(note) {
    const card = document.createElement('div');
    card.className = `ds-note-card${note.pinned ? ' pinned' : ''}`;
    card.dataset.noteId = note.id;
    
    // Build content based on note type
    let contentHtml = '';
    
    if (note.title) {
        contentHtml += `<h4 class="ds-note-title">${dsEscapeHtml(note.title)}</h4>`;
    }
    
    if (note.type === 'checklist' && note.checklist.length > 0) {
        const previewItems = note.checklist.slice(0, 5);
        const moreCount = note.checklist.length - 5;
        
        contentHtml += '<div class="ds-checklist-preview">';
        previewItems.forEach(item => {
            contentHtml += `
                <div class="ds-checklist-item${item.checked ? ' checked' : ''}">
                    <span class="ds-check-icon">${item.checked ? '☑' : '☐'}</span>
                    <span class="ds-check-text">${dsEscapeHtml(item.text)}</span>
                </div>
            `;
        });
        if (moreCount > 0) {
            contentHtml += `<div class="ds-checklist-more">+${moreCount} more items</div>`;
        }
        contentHtml += '</div>';
    } else if (note.text) {
        // Truncate text for preview
        const previewText = note.text.length > 200 ? note.text.substring(0, 200) + '...' : note.text;
        contentHtml += `<p class="ds-note-text">${dsEscapeHtml(previewText).replace(/\n/g, '<br>')}</p>`;
    }
    
    // Labels
    let labelsHtml = '';
    if (note.labels.length > 0) {
        labelsHtml = '<div class="ds-note-labels">';
        note.labels.forEach(label => {
            labelsHtml += `<span class="ds-note-label" data-label="${label}">${label}</span>`;
        });
        labelsHtml += '</div>';
    }
    
    card.innerHTML = `
        <div class="ds-note-content">
            ${contentHtml || '<p class="ds-note-empty">Empty note</p>'}
        </div>
        ${labelsHtml}
        <div class="ds-note-footer">
            <span class="ds-note-date">${dsFormatDate(note.updatedAt)}</span>
            <div class="ds-note-actions">
                <button class="ds-action-btn ds-pin-btn${note.pinned ? ' active' : ''}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                    <svg viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/>
                    </svg>
                </button>
                <button class="ds-action-btn ds-delete-btn" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Click to edit (not on action buttons)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.ds-action-btn')) {
            dsOpenEditor(note.id);
        }
    });
    
    // Pin button
    card.querySelector('.ds-pin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        dsTogglePin(note.id);
    });
    
    // Delete button
    card.querySelector('.ds-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        dsOpenDeleteModal(note.id);
    });
    
    return card;
}

/**
 * Open Daily Space view
 */
function dsOpenDailySpace() {
    const landingPage = document.getElementById('landing-page');
    const dailySpaceView = document.getElementById('daily-space-view');
    
    if (!landingPage || !dailySpaceView) return;
    
    landingPage.classList.add('hidden');
    dailySpaceView.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset filters
    dailySpaceState.searchQuery = '';
    dailySpaceState.activeLabel = 'all';
    
    const searchInput = document.getElementById('ds-search-input');
    if (searchInput) searchInput.value = '';
    
    // Update label pills
    dsUpdateLabelPills();
    
    // Render notes
    dsRenderNotes();
}

/**
 * Close Daily Space view
 */
function dsCloseDailySpace() {
    document.getElementById('daily-space-view').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
    document.body.style.overflow = '';
}

/**
 * Update label pills active state
 */
function dsUpdateLabelPills() {
    const pills = document.querySelectorAll('.ds-label-pill');
    pills.forEach(pill => {
        const label = pill.dataset.label;
        if (label === dailySpaceState.activeLabel) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

/**
 * Set active label filter
 */
function dsSetLabelFilter(label) {
    dailySpaceState.activeLabel = label;
    dsUpdateLabelPills();
    dsRenderNotes();
}

/**
 * Handle search input
 */
function dsHandleSearch(query) {
    dailySpaceState.searchQuery = query;
    dsRenderNotes();
}

/**
 * Set view mode (grid/list)
 */
function dsSetViewMode(mode) {
    dailySpaceState.currentView = mode;
    
    const grid = document.getElementById('ds-notes-grid');
    const gridBtn = document.getElementById('ds-grid-view');
    const listBtn = document.getElementById('ds-list-view');
    
    if (mode === 'grid') {
        grid?.classList.remove('list-view');
        gridBtn?.classList.add('active');
        listBtn?.classList.remove('active');
    } else {
        grid?.classList.add('list-view');
        gridBtn?.classList.remove('active');
        listBtn?.classList.add('active');
    }
}

/**
 * Open note editor modal
 */
function dsOpenEditor(noteId = null) {
    const modal = document.getElementById('ds-editor-overlay');
    const titleInput = document.getElementById('ds-note-title');
    const textEditor = document.getElementById('ds-text-editor');
    const checklistEditor = document.getElementById('ds-checklist-editor');
    const checklistItems = document.getElementById('ds-checklist-items');
    const textContent = document.getElementById('ds-note-content');
    const typeText = document.getElementById('ds-type-text');
    const typeChecklist = document.getElementById('ds-type-checklist');
    const pinBtn = document.getElementById('ds-pin-btn');
    const deleteBtn = document.getElementById('ds-delete-btn');
    
    dailySpaceState.editingNoteId = noteId;
    
    if (noteId) {
        // Editing existing note
        const note = dailySpaceState.notes.find(n => n.id === noteId);
        if (!note) return;
        
        titleInput.value = note.title;
        textContent.value = note.text;
        
        // Set type toggle
        if (note.type === 'checklist') {
            typeChecklist.classList.add('active');
            typeText.classList.remove('active');
            textEditor.classList.add('hidden');
            checklistEditor.classList.remove('hidden');
            dsRenderChecklistEditor(note.checklist);
        } else {
            typeText.classList.add('active');
            typeChecklist.classList.remove('active');
            textEditor.classList.remove('hidden');
            checklistEditor.classList.add('hidden');
        }
        
        // Set labels
        document.querySelectorAll('.ds-label-opt').forEach(label => {
            label.classList.toggle('active', note.labels.includes(label.dataset.label));
        });
        
        // Show pin state
        pinBtn.classList.toggle('active', note.pinned);
        pinBtn.innerHTML = note.pinned 
            ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pinned'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pin';
        
        deleteBtn.classList.remove('hidden');
    } else {
        // New note
        titleInput.value = '';
        textContent.value = '';
        
        // Default to text type
        typeText.classList.add('active');
        typeChecklist.classList.remove('active');
        textEditor.classList.remove('hidden');
        checklistEditor.classList.add('hidden');
        checklistItems.innerHTML = '';
        
        // Clear labels
        document.querySelectorAll('.ds-label-opt').forEach(label => {
            label.classList.remove('active');
        });
        
        // Reset pin button
        pinBtn.classList.remove('active');
        pinBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pin';
        
        deleteBtn.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => titleInput.focus(), 100);
}

/**
 * Close note editor modal
 */
function dsCloseEditor() {
    const modal = document.getElementById('ds-editor-overlay');
    modal.classList.add('hidden');
    dailySpaceState.editingNoteId = null;
}

/**
 * Render checklist items in editor
 */
function dsRenderChecklistEditor(items = []) {
    const container = document.getElementById('ds-checklist-items');
    container.innerHTML = '';
    
    items.forEach((item, index) => {
        const itemEl = dsCreateChecklistItemElement(item, index);
        container.appendChild(itemEl);
    });
}

/**
 * Create a checklist item element for editor
 */
function dsCreateChecklistItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'ds-checklist-edit-item';
    div.dataset.index = index;
    
    div.innerHTML = `
        <input type="checkbox" class="ds-check-toggle" ${item.checked ? 'checked' : ''}>
        <input type="text" class="ds-check-input" value="${dsEscapeHtml(item.text)}" placeholder="List item">
        <button class="ds-check-remove" title="Remove">×</button>
    `;
    
    // Checkbox toggle
    div.querySelector('.ds-check-toggle').addEventListener('change', (e) => {
        // Just update UI, will save on close
    });
    
    // Remove button
    div.querySelector('.ds-check-remove').addEventListener('click', () => {
        div.remove();
    });
    
    // Enter key to add new item
    div.querySelector('.ds-check-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            dsAddChecklistItem();
        }
    });
    
    return div;
}

/**
 * Add new checklist item in editor
 */
function dsAddChecklistItem() {
    const container = document.getElementById('ds-checklist-items');
    const newItem = { text: '', checked: false };
    const index = container.children.length;
    const itemEl = dsCreateChecklistItemElement(newItem, index);
    container.appendChild(itemEl);
    
    // Focus the new input
    itemEl.querySelector('.ds-check-input').focus();
}

/**
 * Get checklist items from editor
 */
function dsGetChecklistFromEditor() {
    const items = [];
    document.querySelectorAll('.ds-checklist-edit-item').forEach(itemEl => {
        const text = itemEl.querySelector('.ds-check-input').value.trim();
        if (text) {
            items.push({
                text: text,
                checked: itemEl.querySelector('.ds-check-toggle').checked
            });
        }
    });
    return items;
}

/**
 * Get selected labels from editor
 */
function dsGetLabelsFromEditor() {
    const labels = [];
    document.querySelectorAll('.ds-label-opt.active').forEach(el => {
        labels.push(el.dataset.label);
    });
    return labels;
}

/**
 * Save note from editor
 */
function dsSaveFromEditor() {
    const titleInput = document.getElementById('ds-note-title');
    const textContent = document.getElementById('ds-note-content');
    const isChecklist = document.getElementById('ds-type-checklist').classList.contains('active');
    const pinBtn = document.getElementById('ds-pin-btn');
    
    const noteData = {
        title: titleInput.value,
        type: isChecklist ? 'checklist' : 'text',
        text: isChecklist ? '' : textContent.value,
        checklist: isChecklist ? dsGetChecklistFromEditor() : [],
        labels: dsGetLabelsFromEditor(),
        pinned: pinBtn.classList.contains('active')
    };
    
    // Check if note has content
    const hasContent = noteData.title.trim() || noteData.text.trim() || noteData.checklist.length > 0;
    
    if (dailySpaceState.editingNoteId) {
        if (hasContent) {
            dsUpdateNote(dailySpaceState.editingNoteId, noteData);
        } else {
            // Empty note - delete it
            dsDeleteNote(dailySpaceState.editingNoteId);
        }
    } else {
        if (hasContent) {
            dsCreateNote(noteData);
        }
    }
    
    dsCloseEditor();
}

/**
 * Open delete confirmation modal
 */
function dsOpenDeleteModal(noteId) {
    dailySpaceState.noteToDelete = noteId;
    document.getElementById('ds-delete-overlay').classList.remove('hidden');
}

/**
 * Close delete confirmation modal
 */
function dsCloseDeleteModal() {
    dailySpaceState.noteToDelete = null;
    document.getElementById('ds-delete-overlay').classList.add('hidden');
}

/**
 * Confirm delete
 */
function dsConfirmDelete() {
    if (dailySpaceState.noteToDelete) {
        dsDeleteNote(dailySpaceState.noteToDelete);
        
        // If we're in editor, close it too
        if (dailySpaceState.editingNoteId === dailySpaceState.noteToDelete) {
            dsCloseEditor();
        }
    }
    dsCloseDeleteModal();
}

/**
 * Toggle editor pin state
 */
function dsToggleEditorPin() {
    const pinBtn = document.getElementById('ds-pin-btn');
    const isPinned = pinBtn.classList.toggle('active');
    
    pinBtn.innerHTML = isPinned 
        ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pinned'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4a2 2 0 0 0-2 2v2H10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8l-1.5 1.5a.5.5 0 0 0 0 .7l.7.8H11v5l1 1 1-1v-5h5.8l.7-.8a.5.5 0 0 0 0-.7L18 14V6a2 2 0 0 0-2-2z"/></svg> Pin';
}

/**
 * Initialize Daily Space event listeners
 */
function dsInitListeners() {
    // Open Daily Space from landing page
    const entryCard = document.getElementById('open-daily-space-btn');
    console.log('Setting up Daily Space listeners, entry card:', entryCard);
    
    if (entryCard) {
        entryCard.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Entry card clicked!');
            dsOpenDailySpace();
        });
        console.log('Daily Space click listener attached');
    } else {
        console.error('Daily Space entry card not found!');
    }
    
    // Back button
    const backBtn = document.getElementById('ds-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', dsCloseDailySpace);
    }
    
    // Search input
    const searchInput = document.getElementById('ds-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                dsHandleSearch(e.target.value);
            }, 200);
        });
    }
    
    // View toggle buttons
    document.getElementById('ds-grid-view')?.addEventListener('click', () => dsSetViewMode('grid'));
    document.getElementById('ds-list-view')?.addEventListener('click', () => dsSetViewMode('list'));
    
    // Label filter pills
    document.querySelectorAll('.ds-label-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            dsSetLabelFilter(pill.dataset.label);
        });
    });
    
    // FAB to add new note
    const fab = document.getElementById('ds-add-note-btn');
    if (fab) {
        fab.addEventListener('click', () => dsOpenEditor(null));
    }
    
    // Editor close button
    document.getElementById('ds-editor-close')?.addEventListener('click', dsSaveFromEditor);
    
    // Editor type toggle
    document.getElementById('ds-type-text')?.addEventListener('click', () => {
        document.getElementById('ds-type-text').classList.add('active');
        document.getElementById('ds-type-checklist').classList.remove('active');
        document.getElementById('ds-text-editor').classList.remove('hidden');
        document.getElementById('ds-checklist-editor').classList.add('hidden');
    });
    
    document.getElementById('ds-type-checklist')?.addEventListener('click', () => {
        document.getElementById('ds-type-checklist').classList.add('active');
        document.getElementById('ds-type-text').classList.remove('active');
        document.getElementById('ds-checklist-editor').classList.remove('hidden');
        document.getElementById('ds-text-editor').classList.add('hidden');
        
        // If switching to checklist and empty, add first item
        const container = document.getElementById('ds-checklist-items');
        if (container.children.length === 0) {
            dsAddChecklistItem();
        }
    });
    
    // Add checklist item - handle enter key on input
    const newItemInput = document.getElementById('ds-new-item-input');
    if (newItemInput) {
        newItemInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = newItemInput.value.trim();
                if (text) {
                    const container = document.getElementById('ds-checklist-items');
                    const newItem = { text: text, checked: false };
                    const index = container.children.length;
                    const itemEl = dsCreateChecklistItemElement(newItem, index);
                    container.appendChild(itemEl);
                    newItemInput.value = '';
                }
            }
        });
    }
    
    // Save button
    document.getElementById('ds-save-btn')?.addEventListener('click', dsSaveFromEditor);
    
    // Editor label toggles
    document.querySelectorAll('.ds-label-opt').forEach(label => {
        label.addEventListener('click', () => {
            label.classList.toggle('active');
        });
    });
    
    // Editor pin button
    document.getElementById('ds-pin-btn')?.addEventListener('click', dsToggleEditorPin);
    
    // Editor delete button
    document.getElementById('ds-delete-btn')?.addEventListener('click', () => {
        if (dailySpaceState.editingNoteId) {
            dsOpenDeleteModal(dailySpaceState.editingNoteId);
        }
    });
    
    // Delete modal buttons
    document.getElementById('ds-delete-cancel')?.addEventListener('click', dsCloseDeleteModal);
    document.getElementById('ds-delete-confirm')?.addEventListener('click', dsConfirmDelete);
    
    // Delete modal overlay click
    document.getElementById('ds-delete-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'ds-delete-overlay') {
            dsCloseDeleteModal();
        }
    });
    
    // Editor modal overlay click (save and close)
    document.getElementById('ds-editor-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'ds-editor-overlay') {
            dsSaveFromEditor();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only handle when Daily Space is open
        const dsView = document.getElementById('daily-space-view');
        if (dsView?.classList.contains('hidden')) return;
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const deleteModal = document.getElementById('ds-delete-overlay');
            const editorModal = document.getElementById('ds-editor-overlay');
            
            if (!deleteModal?.classList.contains('hidden')) {
                dsCloseDeleteModal();
            } else if (!editorModal?.classList.contains('hidden')) {
                dsSaveFromEditor();
            } else {
                dsCloseDailySpace();
            }
        }
        
        // Ctrl/Cmd + Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const editorModal = document.getElementById('ds-editor-overlay');
            if (!editorModal?.classList.contains('hidden')) {
                dsSaveFromEditor();
            }
        }
    });
}

/**
 * Initialize Daily Space feature
 */
function initDailySpace() {
    try {
        console.log('initDailySpace starting...');
        dsLoadNotes();
        console.log('Notes loaded');
        dsInitListeners();
        console.log('Listeners attached');
        console.log('Daily Space initialized!');
    } catch (e) {
        console.error('Error initializing Daily Space:', e);
    }
}

// Global click handler for Daily Space entry as fallback
document.addEventListener('click', function(e) {
    const btn = e.target.closest('#open-daily-space-btn');
    if (btn) {
        console.log('Daily Space button clicked via global handler!');
        e.preventDefault();
        dsOpenDailySpace();
    }
});

// ========================================
// LIVE CLOCK FEATURE
// Displays current time in 12-hour format
// Updates every minute with smooth animation
// ========================================

let clockInterval = null;

/**
 * Format time to 12-hour format with AM/PM
 * @param {Date} date - Date object
 * @returns {string} Formatted time string (e.g., "08:36 AM")
 */
function formatClockTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Update the clock display
 */
function updateClock() {
    const clockElement = document.getElementById('clock-time');
    if (!clockElement) return;
    
    const now = new Date();
    const newTime = formatClockTime(now);
    const currentTime = clockElement.textContent;
    
    // Only animate if time changed
    if (newTime !== currentTime) {
        clockElement.classList.add('updating');
        
        setTimeout(() => {
            clockElement.textContent = newTime;
            clockElement.classList.remove('updating');
        }, 150);
    }
}

/**
 * Start the live clock
 * Updates immediately and then every minute
 */
function startClock() {
    // Update immediately
    updateClock();
    
    // Calculate ms until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    // First update at the start of next minute
    setTimeout(() => {
        updateClock();
        // Then update every 60 seconds
        clockInterval = setInterval(updateClock, 60000);
    }, msUntilNextMinute);
    
    console.log('Live clock started');
}

/**
 * Stop the live clock (if needed)
 */
function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

// ========================================
// 2026 CALENDAR FEATURE
// Full-page calendar view with all 12 months
// Highlights today and weekends
// ========================================

// Calendar data for 2026
const CALENDAR_2026 = {
    year: 2026,
    months: [
        { name: 'January', days: 31, startDay: 4 },   // Thursday
        { name: 'February', days: 28, startDay: 0 }, // Sunday
        { name: 'March', days: 31, startDay: 0 },    // Sunday
        { name: 'April', days: 30, startDay: 3 },    // Wednesday
        { name: 'May', days: 31, startDay: 5 },      // Friday
        { name: 'June', days: 30, startDay: 1 },     // Monday
        { name: 'July', days: 31, startDay: 3 },     // Wednesday
        { name: 'August', days: 31, startDay: 6 },   // Saturday
        { name: 'September', days: 30, startDay: 2 },// Tuesday
        { name: 'October', days: 31, startDay: 4 },  // Thursday
        { name: 'November', days: 30, startDay: 0 }, // Sunday
        { name: 'December', days: 31, startDay: 2 }  // Tuesday
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

/**
 * Check if a date is today
 * @param {number} year - Year
 * @param {number} month - Month (0-indexed)
 * @param {number} day - Day of month
 * @returns {boolean}
 */
function isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
}

/**
 * Check if we're currently in a specific month of 2026
 * @param {number} monthIndex - 0-indexed month
 * @returns {boolean}
 */
function isCurrentMonth(monthIndex) {
    const today = new Date();
    return today.getFullYear() === 2026 && today.getMonth() === monthIndex;
}

/**
 * Check if this is the upcoming month (within next 7 days)
 * Used to highlight January when we're close to 2026
 * @param {number} monthIndex - 0-indexed month
 * @returns {boolean}
 */
function isUpcomingMonth(monthIndex) {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // If we're already in 2026, just check current month
    if (currentYear === 2026) {
        return today.getMonth() === monthIndex;
    }
    
    // If we're in late December 2025, highlight January 2026
    if (currentYear === 2025 && today.getMonth() === 11) {
        // Within last 7 days of December
        if (today.getDate() >= 25 && monthIndex === 0) {
            return true;
        }
    }
    
    return false;
}

/**
 * Render a single month card
 * @param {Object} monthData - Month data object
 * @param {number} monthIndex - 0-indexed month number
 * @returns {HTMLElement} Month card element
 */
function renderMonthCard(monthData, monthIndex) {
    const card = document.createElement('div');
    card.className = 'calendar-month-card';
    card.style.animationDelay = `${monthIndex * 0.05}s`;
    
    // Check if this is the current/upcoming month
    const isCurrent = isUpcomingMonth(monthIndex);
    if (isCurrent) {
        card.classList.add('current-month');
    }
    
    // Month header
    const header = document.createElement('div');
    header.className = 'month-card-header';
    header.innerHTML = `<h3 class="month-card-name${isCurrent ? ' current' : ''}">${monthData.name}</h3>`;
    card.appendChild(header);
    
    // Weekday headers
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-weekdays';
    CALENDAR_2026.weekdays.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-weekday';
        dayEl.textContent = day;
        weekdaysRow.appendChild(dayEl);
    });
    card.appendChild(weekdaysRow);
    
    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-days';
    
    // Empty cells for days before month starts
    for (let i = 0; i < monthData.startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysGrid.appendChild(emptyDay);
    }
    
    // Actual days
    for (let day = 1; day <= monthData.days; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Calculate day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = (monthData.startDay + day - 1) % 7;
        
        // Weekend styling
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayEl.classList.add('weekend');
        }
        
        // Today highlight
        if (isToday(CALENDAR_2026.year, monthIndex, day)) {
            dayEl.classList.add('today');
        }
        
        daysGrid.appendChild(dayEl);
    }
    
    card.appendChild(daysGrid);
    return card;
}

/**
 * Render the full 2026 calendar
 */
function renderCalendar2026() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    CALENDAR_2026.months.forEach((month, index) => {
        const monthCard = renderMonthCard(month, index);
        grid.appendChild(monthCard);
    });
}

/**
 * Open the calendar view
 */
function openCalendarView() {
    const landingPage = document.getElementById('landing-page');
    const calendarView = document.getElementById('calendar-view');
    const calendarNavBtn = document.getElementById('calendar-nav-btn');
    
    if (landingPage && calendarView) {
        landingPage.classList.add('hidden');
        calendarView.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Hide the floating calendar button
        if (calendarNavBtn) {
            calendarNavBtn.style.display = 'none';
        }
        
        // Render calendar if not already rendered
        renderCalendar2026();
    }
}

/**
 * Close the calendar view
 */
function closeCalendarView() {
    const landingPage = document.getElementById('landing-page');
    const calendarView = document.getElementById('calendar-view');
    const calendarNavBtn = document.getElementById('calendar-nav-btn');
    
    if (landingPage && calendarView) {
        calendarView.classList.add('hidden');
        landingPage.classList.remove('hidden');
        document.body.style.overflow = '';
        
        // Show the floating calendar button again
        if (calendarNavBtn) {
            calendarNavBtn.style.display = 'flex';
        }
    }
}

/**
 * Initialize calendar event listeners
 */
function initCalendar2026() {
    // Calendar nav button (top-left)
    const calendarNavBtn = document.getElementById('calendar-nav-btn');
    if (calendarNavBtn) {
        calendarNavBtn.addEventListener('click', openCalendarView);
    }
    
    // Back button
    const backBtn = document.getElementById('calendar-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', closeCalendarView);
    }
    
    // Keyboard shortcut (Escape to close)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const calendarView = document.getElementById('calendar-view');
            if (calendarView && !calendarView.classList.contains('hidden')) {
                closeCalendarView();
            }
        }
    });
    
    console.log('2026 Calendar initialized');
}

// ==================== INITIALIZE APP ====================
document.addEventListener('DOMContentLoaded', init);
