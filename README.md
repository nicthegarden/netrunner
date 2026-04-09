# 🎮 NETRUNNER — Cyberpunk Idle Game

A Melvor Idle-style grind fest with a futuristic cyberpunk aesthetic. Hack systems, fight enemies, craft cyberware, and climb the ranks in a gritty digital world.

## 🚀 Quick Start

1. Open `index.html` in your browser (just double-click it or drag it to a browser window)
2. Start grinding!

## 🎯 Features

### 24 Skills Across 6 Categories

**HACKING (🔓)**
- Intrusion — Break into systems
- Decryption — Process stolen data
- ICE Breaking — Defeat security AI
- Daemon Coding — Write combat buffs

**NETRUNNING (🌊)**
- Deep Dive — Explore deeper NET layers
- Data Mining — Extract passive income
- Black ICE Combat — Fight hostile AI
- Neural Surfing — Unlock new zones

**STREET (🤺)**
- Combat — Fight enemies for loot
- Stealth — Pickpocket and infiltrate
- Street Cred — Build reputation
- Smuggling — Transport contraband

**TECH (🦾)**
- Cyberware Crafting — Build implants
- Weapon Modding — Upgrade weapons
- Vehicle Tuning — Faster smuggling
- Drone Engineering — Passive gathering

**FIXER (💰)**
- Trading — Buy low, sell high
- Corpo Infiltration — High-risk heists
- Info Brokering — Sell intelligence
- Fencing — Sell stolen goods

**RIPPER (🔌)**
- Cyberware Installation — Stat boosts
- Biotech — Create healing items
- Neural Enhancement — Boost XP rates
- Chrome Surgery — High-end implants

### Core Mechanics

- **99 Levels** per skill (RuneScape-style XP curve)
- **Mastery System** — Sub-levels for each activity type
- **Auto-save** every 30 seconds (localStorage)
- **Offline Progress** — Up to 24 hours offline grinding
- **Combat System** — Real-time battles with enemies
- **Inventory** — Collect and manage resources
- **Achievements** — Unlock milestones
- **Save/Export** — Copy your save code to share or backup

## 🎨 Cyberpunk Aesthetic

- Neon green/magenta/cyan color scheme
- Terminal monospace font
- CRT scanline overlay
- Glowing text shadows
- Dark vaporwave background

## 💾 Save System

**Auto-Save:** Game saves every 30 seconds to localStorage

**Manual Save:** Click the "💾 Save" button in the header

**Export Save:** 
- Click "📥 Export Save" in the sidebar
- Your save is copied as a base64 string
- Share it or keep it as backup

**Import Save:**
- Click "📤 Import Save"
- Paste your save code
- Game reloads with your data

**Reset:**
- Click "⚠️ Reset Game" to start fresh
- Warning: This deletes your current save!

## 🕹️ How to Play

1. **Pick a skill** from the sidebar
2. **Click "Start"** to begin an action
3. **Watch the progress bar** fill up
4. **Gain XP and loot** when complete
5. **Level up skills** to unlock harder activities
6. **Combine skills** for synergies (higher hacking helps stealth, etc.)
7. **Reach level 99** for bragging rights

### Combat

- **Click "Start"** on Combat skill
- **Auto-attack** enemies in real-time
- **Defeat enemies** for XP and loot
- **Get stronger** and fight tougher foes

## 🛠️ Technical Details

- **No build step required** — vanilla HTML/CSS/JS
- **No frameworks** — pure ES6 modules
- **Browser storage** — saves to localStorage
- **Modular architecture** — easy to extend
- **Event-driven** — decoupled game systems

## 📁 Project Structure

```
netrunner/
├── index.html              # Main page
├── css/main.css            # Cyberpunk styling
├── js/
│   ├── app.js              # Entry point
│   ├── main.js             # Game instance
│   ├── engine/             # Core systems
│   │   ├── events.js       # Event bus
│   │   ├── save.js         # Save/load
│   │   ├── gameLoop.js     # Game loop
│   │   └── offline.js      # Offline progress
│   ├── systems/            # Game mechanics
│   │   ├── skills.js       # Skill system
│   │   ├── combat.js       # Combat engine
│   │   └── player.js       # Player & achievements
│   ├── ui/                 # UI system
│   │   └── main.js         # UI manager
│   └── data/               # Data definitions
│       └── skillData.js    # All game data
```

## 🎮 Tips for Grinding

1. **Unlock higher-level skills first** — they grant more XP
2. **Farm common enemies** early to build currency
3. **Craft cyberware** to boost your stats
4. **Diversify** — rotate between skills to unlock synergies
5. **Go AFK** — offline progress works up to 24 hours
6. **Export saves** before major resets

## 🚀 Future Expansions

- More skills and activities
- Prestige/Prestige system
- Trading market
- Guilds/factions
- Leaderboards
- Mobile optimization
- Dark/Light theme toggle

## 🐛 Known Issues

- None yet! Report bugs at the GitHub repo

## 📝 License

Free to use, modify, and distribute

---

**Enjoy the grind, runner! ⚡**
