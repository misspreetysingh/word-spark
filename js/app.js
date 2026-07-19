// WordSpark Main Application Coordinator
// Binds UI events, coordinates database states, manages views, streaks, theme switches, and file imports.

import { dbService } from './db.js';
import { streakService } from './streak.js';
import { shareService } from './share.js';
import { widgetService } from './widget.js';

class WordSparkApp {
  constructor() {
    this.currentWord = null;
    this.activeView = 'home';
    this.lastWordId = null;
    
    // Settings state
    this.theme = 'light';
    this.fontSize = 'md';
    this.highContrast = false;
    this.reminderEnabled = false;
    this.reminderTime = '09:00';
    this.customSeed = null;
    
    // UI elements references
    this.views = {};
    this.navItems = [];
  }

  async start() {
    try {
      // 1. Initialize IndexedDB
      await dbService.init();
      
      // 2. Load settings from localStorage
      this.loadSettings();
      
      // 3. Register service worker for PWA
      this.registerServiceWorker();
      
      // 4. Update streaks and check milestones
      const streakInfo = streakService.updateStreak();
      this.updateStreakUI(streakInfo.streakCount);
      
      if (streakInfo.milestoneAchieved) {
        this.showMilestoneCelebration(streakInfo.milestoneAchieved);
      }
      
      // 5. Initialize UI elements
      this.cacheUIElements();
      this.bindEvents();
      
      // 6. Select initial word: Daily Word
      await this.loadDailyWord();
      
      // 7. Render initial widget preview
      this.updateWidgetPreview();
      
      // 8. Schedule reminder checks
      this.startReminderChecker();
      
      this.showToast("Welcome to WordSpark!");
    } catch (err) {
      console.error("Initialization error:", err);
      this.showToast("Failed to initialize database. Running offline mode.");
    }
  }

  // Load and apply persistent settings
  loadSettings() {
    this.theme = localStorage.getItem('spark_setting_theme') || 'light';
    this.fontSize = localStorage.getItem('spark_setting_font_size') || 'md';
    this.highContrast = localStorage.getItem('spark_setting_high_contrast') === 'true';
    this.reminderEnabled = localStorage.getItem('spark_setting_reminder_enabled') === 'true';
    this.reminderTime = localStorage.getItem('spark_setting_reminder_time') || '09:00';
    
    const seedVal = localStorage.getItem('spark_setting_custom_seed');
    this.customSeed = seedVal ? parseInt(seedVal, 10) : null;
    
    // Apply visual properties to document
    document.documentElement.setAttribute('data-theme', this.theme);
    
    // Font scale
    document.body.className = ''; // reset classes
    document.body.classList.add(`font-scale-${this.fontSize}`);
    if (this.highContrast) {
      document.body.classList.add('high-contrast');
    }
  }

  cacheUIElements() {
    // Nav bar items
    this.navItems = document.querySelectorAll('.nav-item');
    
    // Views
    this.views = {
      home: document.getElementById('home-view'),
      search: document.getElementById('search-view'),
      favorites: document.getElementById('favorites-view'),
      history: document.getElementById('history-view'),
      stats: document.getElementById('stats-view'),
      settings: document.getElementById('settings-view')
    };
  }

  bindEvents() {
    // Navigation bar routing
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const viewId = item.getAttribute('data-view');
        this.navigateTo(viewId);
      });
    });
    
    // Home View actions
    document.getElementById('action-fav').addEventListener('click', () => this.toggleFavorite());
    document.getElementById('action-share').addEventListener('click', () => this.shareCurrentWord());
    document.getElementById('action-copy').addEventListener('click', () => this.copyCurrentWord());
    document.getElementById('fab-next-word').addEventListener('click', () => this.nextRandomWord());
    
    // Search inputs
    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', (e) => this.performSearch(e.target.value));
    
    // Favorites sort selection
    const sortSelect = document.getElementById('fav-sort-select');
    sortSelect.addEventListener('change', () => this.loadFavorites());
    
    // Clear history button
    document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());
    
    // Settings adjustments
    // 1. Theme Pickers
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.getAttribute('data-theme-id');
        this.setTheme(themeId);
      });
    });
    
    // Set active button state
    const currentThemeBtn = document.querySelector(`.theme-btn[data-theme-id="${this.theme}"]`);
    if (currentThemeBtn) currentThemeBtn.classList.add('active');
    
    // 2. Font Size Slider
    const fontSlider = document.getElementById('font-slider');
    fontSlider.value = this.fontSize === 'sm' ? 1 : this.fontSize === 'md' ? 2 : 3;
    fontSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const sizes = ['sm', 'md', 'lg'];
      this.setFontSize(sizes[val - 1]);
    });
    
    // 3. Contrast toggle
    const contrastToggle = document.getElementById('contrast-toggle');
    contrastToggle.checked = this.highContrast;
    contrastToggle.addEventListener('change', (e) => {
      this.setHighContrast(e.target.checked);
    });
    
    // 4. Notifications time & enable
    const reminderToggle = document.getElementById('reminder-toggle');
    const reminderTimeInput = document.getElementById('reminder-time');
    
    reminderToggle.checked = this.reminderEnabled;
    reminderTimeInput.value = this.reminderTime;
    
    reminderToggle.addEventListener('change', (e) => {
      this.reminderEnabled = e.target.checked;
      localStorage.setItem('spark_setting_reminder_enabled', this.reminderEnabled);
      this.showToast(`Daily reminders ${this.reminderEnabled ? 'enabled' : 'disabled'}`);
    });
    
    reminderTimeInput.addEventListener('change', (e) => {
      this.reminderTime = e.target.value;
      localStorage.setItem('spark_setting_reminder_time', this.reminderTime);
      this.showToast(`Reminder set for ${this.reminderTime}`);
    });
    
    // 5. Seed input
    const seedSelect = document.getElementById('seed-select');
    seedSelect.value = this.customSeed === null ? 'random' : 'seeded';
    
    seedSelect.addEventListener('change', (e) => {
      if (e.target.value === 'seeded') {
        const userSeed = prompt("Enter a custom random seed integer (e.g. 42):", "42");
        const parsed = parseInt(userSeed, 10);
        if (!isNaN(parsed)) {
          this.customSeed = parsed;
          localStorage.setItem('spark_setting_custom_seed', parsed);
          this.showToast(`Seeded randomizer set to: ${parsed}`);
        } else {
          seedSelect.value = 'random';
          this.customSeed = null;
          localStorage.removeItem('spark_setting_custom_seed');
        }
      } else {
        this.customSeed = null;
        localStorage.removeItem('spark_setting_custom_seed');
        this.showToast("Randomizer reset to true random mode");
      }
    });
    
    // 6. Data Import triggers
    const fileInput = document.getElementById('import-file-input');
    fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    
    // 7. Backup and Restore triggers
    document.getElementById('backup-btn').addEventListener('click', () => this.backupDatabase());
    const restoreInput = document.getElementById('restore-file-input');
    restoreInput.addEventListener('change', (e) => this.restoreDatabase(e));
    
    // Milestone preview trigger (in stats view, click milestone to celebrate!)
    document.querySelectorAll('.milestone-badge-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('unlocked')) {
          streakService.triggerConfetti();
          this.showToast(`Celebrating your milestone!`);
        } else {
          const target = card.getAttribute('data-milestone');
          this.showToast(`Lock: Complete a ${target}-day streak to earn this badge!`);
        }
      });
    });
  }

  // Router View Navigation
  navigateTo(viewId) {
    if (!this.views[viewId]) return;
    
    // Update active nav highlights
    this.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Show selected view
    Object.keys(this.views).forEach(key => {
      if (key === viewId) {
        this.views[key].classList.add('active');
      } else {
        this.views[key].classList.remove('active');
      }
    });
    
    this.activeView = viewId;
    
    // Fire sub-renders depending on view
    if (viewId === 'search') {
      const q = document.getElementById('search-bar').value;
      this.performSearch(q);
    } else if (viewId === 'favorites') {
      this.loadFavorites();
    } else if (viewId === 'history') {
      this.loadHistory();
    } else if (viewId === 'stats') {
      this.loadStats();
    }
  }

  // Core Streaks Banner and Confetti triggers
  updateStreakUI(streakCount) {
    const streakVal = document.getElementById('streak-value');
    if (streakVal) streakVal.innerText = streakCount;
  }

  showMilestoneCelebration(milestone) {
    streakService.triggerConfetti();
    
    const overlay = document.getElementById('dialog-overlay');
    overlay.innerHTML = `
      <div class="dialog-box">
        <h3 class="dialog-title">🔥 Streak Milestone Unlocked!</h3>
        <p class="dialog-text">Congratulations! You have completed a <strong>${milestone}-day streak</strong> of learning vocabulary. Your discipline is paying off!</p>
        <div class="dialog-actions">
          <button class="dialog-btn confirm" id="close-celebrate-btn">Awesome!</button>
        </div>
      </div>
    `;
    overlay.classList.add('active');
    
    document.getElementById('close-celebrate-btn').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  // Load and apply words states
  async renderWord(wordObj) {
    this.currentWord = wordObj;
    this.lastWordId = wordObj.id;
    
    // Set UI elements
    document.getElementById('word-title').innerText = wordObj.word;
    document.getElementById('word-pronunciation').innerText = wordObj.pronunciation || '';
    document.getElementById('word-meaning').innerText = wordObj.meaning;
    document.getElementById('word-example').innerText = wordObj.example ? `"${wordObj.example}"` : '';
    
    // Difficulty
    const diffPill = document.getElementById('word-difficulty');
    diffPill.className = 'difficulty-pill';
    const diff = (wordObj.difficulty || 'Medium').toLowerCase();
    diffPill.classList.add(diff);
    diffPill.innerText = diff;
    
    // Check favorites status
    const isFav = await dbService.isFavorite(wordObj.word);
    const favBtn = document.getElementById('action-fav');
    if (isFav) {
      favBtn.classList.add('fav-active');
    } else {
      favBtn.classList.remove('fav-active');
    }
    
    // Add to history
    await dbService.addToHistory(wordObj);
  }

  // Algorithm: Daily Word Selector (consistent per calendar date)
  async loadDailyWord() {
    const todayStr = streakService.getTodayDateString();
    const storedDate = localStorage.getItem('spark_daily_word_date');
    const storedId = localStorage.getItem('spark_daily_word_id');
    
    const wordCount = await dbService.getWordCount();
    if (wordCount === 0) return;
    
    let wordToLoad = null;
    
    if (storedDate === todayStr && storedId) {
      // Fetch stored daily word
      const allWords = await dbService.searchWords('');
      wordToLoad = allWords.find(w => w.id === parseInt(storedId, 10));
    }
    
    // If not found or date mismatch, calculate hash algorithm
    if (!wordToLoad) {
      const allWords = await dbService.searchWords('');
      
      // Basic hashing algorithm of string date e.g., '2026-07-11'
      let hash = 0;
      for (let i = 0; i < todayStr.length; i++) {
        hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % allWords.length;
      wordToLoad = allWords[index];
      
      // Store reference
      localStorage.setItem('spark_daily_word_date', todayStr);
      localStorage.setItem('spark_daily_word_id', wordToLoad.id.toString());
    }
    
    await this.renderWord(wordToLoad);
    
    // Update dashboard date text
    const dateText = document.getElementById('header-date-text');
    if (dateText) {
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      dateText.innerText = new Date().toLocaleDateString('en-US', options);
    }
  }

  // Random Word generation with fade transition
  async nextRandomWord() {
    const wordCard = document.getElementById('word-card');
    
    // Play card animation
    wordCard.classList.remove('card-enter-next');
    void wordCard.offsetWidth; // trigger reflow
    wordCard.classList.add('card-enter-next');
    
    const nextWord = await dbService.getRandomWord(this.customSeed, this.lastWordId);
    if (nextWord) {
      if (this.customSeed !== null) this.customSeed++; // increment seed to get next value
      await this.renderWord(nextWord);
    } else {
      this.showToast("Import vocabulary files first to see new words!");
    }
  }

  // Add/remove favorite
  async toggleFavorite() {
    if (!this.currentWord) return;
    const isFav = await dbService.toggleFavorite(this.currentWord);
    const favBtn = document.getElementById('action-fav');
    
    if (isFav) {
      favBtn.classList.add('fav-active');
      this.showToast("Added to bookmarked favorites");
    } else {
      favBtn.classList.remove('fav-active');
      this.showToast("Removed from favorites");
    }
  }

  // Share card generator
  shareCurrentWord() {
    if (!this.currentWord) return;
    this.showToast("Generating beautiful share card...");
    setTimeout(() => {
      shareService.downloadShareCard(this.currentWord, this.theme);
    }, 400);
  }

  // Clipboard copy
  copyCurrentWord() {
    if (!this.currentWord) return;
    const text = `${this.currentWord.word} [${this.currentWord.difficulty}] - ${this.currentWord.meaning}\nExample: ${this.currentWord.example || 'N/A'}`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast("Word details copied to clipboard!");
    }).catch(err => {
      this.showToast("Clipboard copy failed.");
    });
  }

  // Search execution
  async performSearch(query) {
    const listContainer = document.getElementById('search-results-list');
    const results = await dbService.searchWords(query);
    
    if (results.length === 0) {
      listContainer.innerHTML = `<div class="empty-state">No matching words found.</div>`;
      return;
    }
    
    listContainer.innerHTML = '';
    results.forEach(w => {
      const card = document.createElement('div');
      card.className = 'word-list-card';
      card.innerHTML = `
        <div class="word-list-left">
          <span class="word-list-title">${w.word}</span>
          <span class="word-list-definition">${w.meaning}</span>
          <span class="word-list-badge">${w.difficulty}</span>
        </div>
        <button class="icon-btn select-word-btn" data-word-id="${w.id}">
          <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </button>
      `;
      
      // Bind selection click to card
      card.querySelector('.select-word-btn').addEventListener('click', () => {
        this.renderWord(w);
        this.navigateTo('home');
      });
      
      listContainer.appendChild(card);
    });
  }

  // Favorites load
  async loadFavorites() {
    const container = document.getElementById('favorites-results-list');
    const sortBy = document.getElementById('fav-sort-select').value;
    const favorites = await dbService.getFavorites('', sortBy);
    
    if (favorites.length === 0) {
      container.innerHTML = `<div class="empty-state">Your favorited words will appear here.</div>`;
      return;
    }
    
    container.innerHTML = '';
    favorites.forEach(f => {
      const card = document.createElement('div');
      card.className = 'word-list-card';
      card.innerHTML = `
        <div class="word-list-left">
          <span class="word-list-title">${f.word}</span>
          <span class="word-list-definition">${f.meaning}</span>
        </div>
        <div style="display:flex; gap: 8px;">
          <button class="icon-btn remove-fav-btn" data-word="${f.word}" style="color: #E91E63;">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <button class="icon-btn go-word-btn">
            <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
          </button>
        </div>
      `;
      
      // Bind navigation to word card
      card.querySelector('.go-word-btn').addEventListener('click', () => {
        this.renderWord(f);
        this.navigateTo('home');
      });
      
      // Bind removal click
      card.querySelector('.remove-fav-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await dbService.toggleFavorite(f);
        this.loadFavorites();
        this.showToast("Removed from favorites");
        // Reset home screen heart if it matches
        if (this.currentWord && this.currentWord.word === f.word) {
          document.getElementById('action-fav').classList.remove('fav-active');
        }
      });
      
      container.appendChild(card);
    });
  }

  // History load
  async loadHistory() {
    const container = document.getElementById('history-list');
    const history = await dbService.getHistory();
    
    if (history.length === 0) {
      container.innerHTML = `<div class="empty-state">No viewed history yet.</div>`;
      return;
    }
    
    container.innerHTML = '';
    history.forEach(h => {
      const row = document.createElement('div');
      row.className = 'history-item';
      
      // Format timestamp
      const timeStr = new Date(h.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(h.viewed_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      row.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-weight:600;">${h.word}</span>
          <span class="history-time">${dateStr} • ${timeStr}</span>
        </div>
        <button class="icon-btn view-history-word-btn">
          <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </button>
      `;
      
      // Find full word object to view
      row.querySelector('.view-history-word-btn').addEventListener('click', async () => {
        const all = await dbService.searchWords('');
        const matchingWord = all.find(w => w.word === h.word);
        if (matchingWord) {
          this.renderWord(matchingWord);
          this.navigateTo('home');
        } else {
          // If deleted from list, show fallback text
          this.renderWord({ word: h.word, meaning: "Imported word details were cleared from the library." });
          this.navigateTo('home');
        }
      });
      
      container.appendChild(row);
    });
  }

  // Clear history
  async clearHistory() {
    if (confirm("Are you sure you want to clear your view history?")) {
      await dbService.clearHistory();
      this.loadHistory();
      this.showToast("History cleared.");
    }
  }

  // Load stats panel
  async loadStats() {
    const totalWords = await dbService.getWordCount();
    const history = await dbService.getHistory();
    const favoritesCount = await dbService.getFavoritesCount();
    const streakInfo = streakService.getStreakStats();
    
    // Unique words viewed
    const uniqueViewed = new Set(history.map(h => h.word)).size;
    
    // Updates UI elements
    document.getElementById('stat-total-words').innerText = totalWords;
    document.getElementById('stat-words-viewed').innerText = uniqueViewed;
    document.getElementById('stat-favorites').innerText = favoritesCount;
    document.getElementById('stat-streak').innerText = streakInfo.currentStreak;
    document.getElementById('stat-longest-streak').innerText = streakInfo.longestStreak;
    
    // Learning progress bar percentage
    const percentage = totalWords > 0 ? Math.min(100, Math.round((uniqueViewed / totalWords) * 100)) : 0;
    document.getElementById('progress-percentage-text').innerText = `${percentage}%`;
    document.getElementById('progress-fill-bar').style.width = `${percentage}%`;
    
    // Milestone badges status (lock/unlock)
    const milestoneCards = document.querySelectorAll('.milestone-badge-card');
    milestoneCards.forEach(card => {
      const milestoneVal = parseInt(card.getAttribute('data-milestone'), 10);
      if (streakInfo.longestStreak >= milestoneVal) {
        card.classList.add('unlocked');
      } else {
        card.classList.remove('unlocked');
      }
    });
  }

  // Settings: Themes adjustments
  setTheme(themeId) {
    this.theme = themeId;
    localStorage.setItem('spark_setting_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Update button states
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.getAttribute('data-theme-id') === themeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    this.updateWidgetPreview();
    this.showToast(`Theme changed to ${themeId.replace(/^\w/, c => c.toUpperCase())}`);
  }

  // Settings: Font Size scaling
  setFontSize(size) {
    this.fontSize = size;
    localStorage.setItem('spark_setting_font_size', size);
    
    document.body.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    document.body.classList.add(`font-scale-${size}`);
    this.showToast(`Font scale set to ${size.toUpperCase()}`);
  }

  // Settings: High Contrast Mode toggle
  setHighContrast(enabled) {
    this.highContrast = enabled;
    localStorage.setItem('spark_setting_high_contrast', enabled);
    
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    this.showToast(`High contrast ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Update Widget simulator frame
  updateWidgetPreview() {
    widgetService.renderWidgetPreview('widget-container-preview', this.currentWord, () => {
      this.nextRandomWord();
      // Render again after slight delay for word card loading
      setTimeout(() => this.updateWidgetPreview(), 400);
    });
  }

  // File Upload Handlers (CSV, JSON, TXT parsing)
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    this.showToast("Parsing file...");
    
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        let wordsList = [];
        
        if (fileName.endsWith('.json')) {
          wordsList = JSON.parse(text);
        } else if (fileName.endsWith('.csv')) {
          wordsList = this.parseCSV(text);
        } else if (fileName.endsWith('.txt')) {
          wordsList = this.parseTXT(text);
        } else {
          throw new Error("Unsupported file format. Please upload .csv, .json, or .txt");
        }
        
        if (!Array.isArray(wordsList) || wordsList.length === 0) {
          throw new Error("No words detected in file.");
        }
        
        // Import database
        const metrics = await dbService.importWords(wordsList);
        this.showToast(`Import finished: ${metrics.imported} added, ${metrics.skipped} duplicates skipped.`);
        
        // Reload word count and select word
        this.nextRandomWord();
        this.updateWidgetPreview();
      } catch (err) {
        alert("File Import Error: " + err.message);
        this.showToast("File import failed.");
      }
    };
    
    reader.readAsText(file);
  }

  // Simple CSV parser supporting double quotes and comma separation
  parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length <= 1) return [];
    
    // Header parsing
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const list = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Smart regex parsing to split commas but ignore commas inside double quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cells = matches.map(c => c.replace(/^"|"$/g, '').trim()); // remove quote wrappers
      
      const item = {};
      headers.forEach((header, index) => {
        if (cells[index]) {
          item[header] = cells[index];
        }
      });
      
      if (item.word) {
        list.push(item);
      }
    }
    
    return list;
  }

  // Text parser: assuming "word - meaning" format per line
  parseTXT(text) {
    const lines = text.split(/\r\n|\n/);
    const list = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const parts = trimmed.split('-');
      if (parts.length >= 2) {
        list.push({
          word: parts[0].trim(),
          meaning: parts.slice(1).join('-').trim()
        });
      }
    });
    
    return list;
  }

  // Backup data downloading
  async backupDatabase() {
    try {
      this.showToast("Creating backup...");
      const backupJSON = await dbService.backupDatabase();
      
      const blob = new Blob([backupJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wordspark_backup_${Date.now()}.json`;
      link.click();
      this.showToast("Backup downloaded!");
    } catch (err) {
      alert("Backup error: " + err.message);
    }
  }

  // Restore database handling
  restoreDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        this.showToast("Restoring database backup...");
        await dbService.restoreDatabase(text);
        
        this.showToast("Database successfully restored!");
        // Refresh values
        await this.loadDailyWord();
        this.updateWidgetPreview();
      } catch (err) {
        alert("Restore failed: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Register standard Progressive Web App Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('PWA Service Worker registered successfully:', reg.scope))
          .catch((err) => console.error('PWA Service Worker registration failed:', err));
      });
    }
  }

  // Banner notification check loops (Simulating push updates)
  startReminderChecker() {
    setInterval(() => {
      if (!this.reminderEnabled) return;
      
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      if (currentTimeStr === this.reminderTime && now.getSeconds() < 10) {
        this.triggerSystemReminderNotification();
      }
    }, 10000); // check every 10s
  }

  // Renders a system banner push inside the top viewport
  triggerSystemReminderNotification() {
    const reminderMsg = "Your daily vocabulary journey awaits. Time to learn today's word!";
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 400px;
      background: var(--accent-color);
      color: var(--accent-text);
      padding: 16px;
      border-radius: var(--border-radius-md);
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: popUp 0.3s var(--transition-bounce) forwards;
    `;
    
    toast.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; font-size:12px; letter-spacing:0.5px; opacity:0.9;">🔔 DAILY REMINDER</span>
        <button id="close-reminder-banner" style="color:inherit; font-weight:700; font-size:14px;">✕</button>
      </div>
      <p style="font-size:13px; line-height:1.4;">${reminderMsg}</p>
    `;
    
    document.body.appendChild(toast);
    
    // Bind click sound or dismiss
    toast.querySelector('#close-reminder-banner').addEventListener('click', () => toast.remove());
    
    // Dismiss automatically after 8 seconds
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 8000);
  }

  // Toast Notification service
  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.innerText = message;
    toast.classList.add('show');
    
    // Auto clear after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Start application on page load
window.addEventListener('DOMContentLoaded', () => {
  const app = new WordSparkApp();
  window.sparkAppInstance = app; // expose to window for testing console
  app.start();
});
