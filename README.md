# 🦅 SkyRush Legends

**The Celestial Sky Arcade Experience**

A full-stack, production-quality browser game inspired by the classic side-scrolling bird-and-pipes genre, built with completely original branding, mythic sci-fi celestial visuals, procedural audio, 8 campaign worlds, infinite endless mode, daily challenge trials, real-time leaderboards, accounts, and an in-game armory.

---

## 🌟 Key Features

### 🕹️ Gameplay & Original Mechanics
- **Celestial Hero "Astra"**: Dynamic aerodynamic wing flaps, smooth pitch rotation easing, and 9 customizable visual skins.
- **Original Obstacles**: Floating Celestial Gates with runic glyphs, jagged Crystal Spire geodes, crackling Storm Arc conductors, and ancient levitating Sky Ruins.
- **Near-Miss / Perfect Pass System**: Skim within inches of obstacle rims without crashing to trigger supersonic sonic shockwaves, bonus points, and combo increments.
- **Dynamic Combo Multiplier**: Chain passes and coin streaks to achieve `x2`, `x3`, `x5`, and `x10` score multipliers with escalating synthesizer audio pitch.
- **Tactical Power-Ups**:
  - 🛡️ **Shield**: Absorbs 1 fatal obstacle collision with shield shatter physics and brief grace period.
  - 🧲 **Magnet**: Attracts sky coins and gems with magnetic pull physics.
  - ⏳ **Slow-Mo**: Warps time and slows obstacle speeds by 35%.
  - 🪙 **Double Coins**: Multiplies coin values for 8 seconds.
  - 🚀 **Sonic Boost**: Ignites rocket thrusters and grants obstacle invulnerability for 3.5 seconds.

### 🗺️ World Progression (Campaign)
- **8 Distinct Realms (40 Levels Total)**:
  1. *Meadow Skies* (Rolling sunlit hills and floating obelisks)
  2. *Cloud Kingdom* (Pastel heavenly skies and cumulus castles)
  3. *Storm Valley* (Violent tempest rain and lightning flashes)
  4. *Sunset Canyon* (Sandstone monoliths and dusky amber glow)
  5. *Frozen Heights* (Glacial crags, blizzard snow, and aurora borealis)
  6. *Neon Sky* (Cyberpunk synthwave skyline and neon pillars)
  7. *Volcanic Skies* (Ash plumes, rising embers, and magma fissures)
  8. *Cosmic Flight* (Atmospheric transcendence into star clusters and nebulae)
- **3-Star Objective System**: Clear the distance goal, collect coin quotas, and execute daring near-miss passes.

### ♾️ Endless Mode & ⚡ Daily Trial
- **Endless Mode**: Procedurally generated infinite course with dynamic biome shifting every 500m and scaling velocity curves.
- **Daily Challenge Trial**: Deterministic daily seed generating unique modifier rules (Tempest Gale, Gravity Surge, Golden Harvest) with special rewards.

### 🛡️ Secure Backend & Real Database
- **SQLite Database** (`better-sqlite3` in WAL mode): Persistent users, profiles, game progress, scores, missions, achievements, shop inventory, and settings.
- **Authentication & Security**: Secure bcrypt password hashing, JWT session tokens, and input validation.
- **Server-Side Anti-Cheat**: Run session token generation, physical time/distance feasibility bounds, and coin rate checking before submitting to global leaderboards.
- **Offline & Guest Sync**: Seamless offline guest mode that automatically merges local progress into an authenticated cloud profile.

### 🎵 Procedural Web Audio Engine
- Zero external audio files or 404 risk: 100% synthesized polyphonic harmonies, arpeggios, and responsive SFX (jump whoosh, coin chimes, gem chords, powerup surges, combo stingers, victory fanfares, and impact thuds).
- Separate Music and SFX volume sliders, mute controls.

### 🎨 Visuals & Design System
- High-DPI canvas rendering (`devicePixelRatio` scaling).
- Multi-layer parallax environment with weather systems (rain, snow, embers, stardust, lightning flashes).
- Glassmorphic game HUD, floating combo indicators, and social bragging card generator (1200x630 PNG export).
- PWA ready with offline Service Worker and manifest.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Launch
```bash
# Install dependencies
npm install

# Start the game server
npm start
```

Open your browser at:
```
http://localhost:3000
```

---

## 🎮 Controls

### Desktop:
- **SPACEBAR**, **LEFT CLICK**, **W**, or **UP ARROW**: Aerodynamic flap (ascend)
- **ESC** or **P**: Pause / Resume flight
- **FULLSCREEN**: Click the "Expand" icon in the bottom menu dock

### Mobile / Tablet:
- **TAP ANYWHERE**: Aerodynamic flap
- Responsive HUD that adapts to orientation changes seamlessly.

---

## 📁 Project Architecture

```
/
├── server/
│   ├── server.js               # Express application & static server
│   ├── db.js                   # SQLite database schema, WAL mode, migrations
│   ├── auth.js                 # JWT token generation & bcrypt password hashing
│   ├── antiCheat.js            # Run session token issuing & score validation
│   └── routes/                 # REST API endpoints
├── public/
│   ├── index.html              # Single page application entry & SEO tags
│   ├── manifest.json           # PWA web manifest
│   ├── sw.js                   # Offline caching service worker
│   ├── assets/                 # High-resolution game icons and badges
│   ├── css/                    # Modular CSS design system & animations
│   └── js/
│       ├── audio/              # Procedural Web Audio synthesizer engine
│       ├── engine/             # 60 FPS Canvas loop, Physics, Camera, Particles
│       ├── entities/           # Player (9 skins), Obstacles, Collectibles, Environments
│       ├── systems/            # LevelManager, EndlessManager, Powerups, Combos
│       ├── storage/            # LocalStorage sync & REST API Client
│       └── ui/                 # UIManager, ShareCard, Toast notifications
└── package.json
```
