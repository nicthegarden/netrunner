# 🚀 NETRUNNER — Quick Start Guide

## Option 1: Direct File (Easiest for Testing)

1. Navigate to the `netrunner` directory
2. **Double-click `index.html`** or drag it into your browser
3. Game starts immediately!

⚠️ **Note:** This works but may have CORS issues with some browsers. Use Option 2 if you encounter problems.

## Option 2: Local Server (Recommended)

### On Mac/Linux:
```bash
cd netrunner
./serve.sh
```
Then open: http://localhost:8000

### On Windows (PowerShell):
```powershell
cd netrunner
python -m http.server 8000
```
Then open: http://localhost:8000

### Using Node.js (any OS):
```bash
cd netrunner
npx http-server -p 8000
```
Then open: http://localhost:8000

## 🎮 First Steps

1. **Game loads** with starting resources (10 Data Shards, 5 Circuit Boards, 500 Eurodollars)
2. **Pick a skill** from the left sidebar
3. **Click "Start"** on any skill card
4. **Watch the progress bar** fill up as you grind
5. **Level up** and unlock harder activities

## 💡 Beginner Tips

- **Start with Hacking** — Intrusion is easiest early game
- **Alternate skills** — Build up multiple skills for synergies
- **Check your inventory** — You'll accumulate lots of loot
- **Go AFK** — Log off for 24 hours and come back to rewards
- **Save regularly** — Use the 💾 Save button in the header

## 💾 Saving Your Progress

**Auto-save:** Every 30 seconds (automatic)

**Manual save:** Click 💾 Save button

**Backup save:** 
- Click 📥 Export Save → code copied to clipboard
- Paste it somewhere safe
- Click 📤 Import Save to restore from backup

## 🐛 Troubleshooting

**"Module not found" error:**
- Make sure you're using a local HTTP server (Option 2)
- Check that all files are in the correct directories

**No sounds/music:**
- This is an idle game — no audio included (yet!)

**Save not persisting:**
- Check if localStorage is enabled in your browser
- Private/Incognito mode may block localStorage

**Game running slow:**
- Try refreshing the page
- Close other tabs
- Try a different browser

## 📊 Game Stats

- **24 Skills** to master
- **99 Levels** per skill (RuneScape-style XP curve)
- **6 Skill Categories**
- **12 Enemy Types**
- **50+ Crafting Materials**
- **~2000 lines of code**
- **Zero dependencies** — pure vanilla JS

## 🎯 Long-term Goals

1. Reach level 99 in all 24 skills
2. Accumulate 10,000,000 Eurodollars
3. Unlock all achievements
4. Export your save and share it

---

**Ready to run? Start with Option 1 or 2 above!**

*Welcome to the future, netrunner. ⚡*
