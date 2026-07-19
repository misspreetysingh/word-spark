# WordSpark - Daily Random Vocabulary App

WordSpark is a premium, minimal, and elegant English vocabulary-building Progressive Web App (PWA) designed for long-term language growth. It functions completely offline and is optimized as a mobile-first native-like application.

---

## 🚀 Key Features

1. **Daily & Random Word View**: Instantly see a word of the day (selected via a date-hashing algorithm for calendar consistency) or explore random words via the floating shuffle button.
2. **Offline-First Storage**: Uses IndexedDB to store, index, and query over 100,000 words locally without lag or network requests.
3. **8 Premium Color Themes**: Dynamic theme switcher (Light Minimal, Dark AMOLED, Forest Green, Ocean Blue, Royal Purple, Sunset Orange, Rose Pink, and Midnight Neon) with fluid CSS variable morphing.
4. **Interactive Streak Calendar & Celebration**: Tracks consecutive days learning. Spawns an HTML5 Canvas-based confetti celebration on major milestones (3, 7, 15, 30, 50, 100, and 365 days).
5. **Smart Search & Filters**: Search instantly by word title, definition, or synonyms.
6. **Detailed Progress Dashboard**: Visualizes your vocabulary coverage, streak metrics, and achievements.
7. **Interactive Home Screen Widget Simulator**: Previews a Material You widget frame inside the settings, demonstrating mobile home screen integrations.
8. **Share Card Generation**: Renders high-resolution image cards (1080x1080) dynamically on canvas and downloads them for sharing.
9. **Data Management Tools**: Supports importing new vocabulary word lists (CSV, JSON, TXT), creating database backups, and restoring configurations.

---

## 📂 Folder Structure

```
word spark/
├── index.html            # Main HTML layout and navigation panels
├── manifest.json         # PWA Manifest metadata for device installation
├── sw.js                 # Service worker caching engine (offline capability)
├── server.ps1            # Lightweight PowerShell development HTTP server
├── words_demo.json       # Demo JSON wordlist for testing imports
├── words_demo.csv        # Demo CSV wordlist for testing imports
├── styles/
│   └── app.css           # Styling guidelines, 8 theme variables, animations
├── js/
│   ├── app.js            # Coordinator, binds click events and views routing
│   ├── db.js             # IndexedDB wrapper (seeds 100+ default SAT words)
│   ├── streak.js         # Streaks tracking, milestones, and Canvas confetti
│   ├── share.js          # Canvas rendering engine to export cards as PNG
│   └── widget.js         # Android Home Screen Widget simulator renderer
└── assets/
    └── icon.svg          # High-fidelity vector branding badge icon
```

---

## 🗄️ Database Schema (IndexedDB)

The IndexedDB uses three distinct object stores within the database `WordSparkDB` (Version 1):

### 1. `words`
Stores vocabulary terms. Seeding runs on first load with 100 default terms.
* **Primary Key**: `id` (Auto-increment integer)
* **Indexes**: 
  * `word` (String, unique): For fast exact-word searching and duplicate validation.
  * `difficulty` (String): For filtering words by Easy/Medium/Hard.
  * `created_at` (Timestamp): Record insertion tracker.

### 2. `favorites`
Stores bookmarked words.
* **Primary Key**: `word` (String, matching the word title)
* **Indexes**:
  * `added_at` (Timestamp): Used for sorting favorited entries.

### 3. `history`
Maintains log entries of viewed words.
* **Primary Key**: `id` (Auto-increment integer)
* **Indexes**:
  * `viewed_at` (Timestamp): Track date-time, used for streak validation and stats calculations.

---

## 💻 Local Development Server

WordSpark is designed to run in a secure context (`localhost` or `HTTPS`) to enable full Progressive Web App features (Service Workers, Local Storage, etc.).

We provide a lightweight development web server written in PowerShell that runs completely without admin rights.

### Starting the server:
1. Open a PowerShell terminal.
2. Navigate to the project root directory.
3. Run the script:
   ```powershell
   .\server.ps1
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## 📥 Vocabulary Import File Guidelines

You can import thousands of words through the Settings tab. The system supports three file formats:

### 1. JSON Format
Must be an array of objects matching the following schema:
```json
[
  {
    "word": "Serendipity",
    "meaning": "Finding valuable things by chance.",
    "pronunciation": "/ˌserənˈdipədē/",
    "example": "We found the café by serendipity.",
    "synonyms": "luck, fluke",
    "antonyms": "misfortune",
    "difficulty": "Medium"
  }
]
```

### 2. CSV Format
Commas serve as column boundaries. Double quotes wrap fields containing internal punctuation (like sentences). The header row is required:
```csv
word,meaning,pronunciation,example,synonyms,antonyms,difficulty
Alacrity,Brisk readiness.,/əˈlakrədē/,"She accepted with alacrity.","readiness","reluctance",Medium
```

### 3. TXT Format
A simple single-line list format, separating the word from the meaning with a hyphen `-`:
```text
Serendipity - Finding valuable things by chance
Ephemeral - Lasting for a very short time
```

---

## 🛠️ Future-Ready Expansion Roadmap

The application architecture follows strict separation of concerns, making it ready for future upgrades:
* **Text-to-Speech (TTS)**: Hook Web Speech API (`speechSynthesis`) directly inside `renderWord()` in `app.js` to pronounce words.
* **AI Sentence Generation**: Add a button on the word card that sends the word to a lightweight server API (e.g. OpenAI/Gemini SDK) to generate dynamic, user-tailored context examples.
* **Spaced Repetition (SRS)**: Add a `spaced_repetition` object store inside `db.js` tracking intervals using SuperMemo-2 (SM-2) scheduling algorithms.
* **Flashcards/Quizzes**: Implement a dynamic multiple-choice quiz dashboard mapping synonyms and definitions from the database.
