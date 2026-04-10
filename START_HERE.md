# 🎯 RUN THESE COMMANDS NOW TO TEST

Copy and paste any of these commands to test the backend immediately:

---

## ✅ Test Option 1: Quickest Test (30 seconds)

```bash
cd /home/edve/netrunner && ./test.sh
```

**What happens:** Validates syntax, checks npm, runs Jest tests, shows success

---

## ✅ Test Option 2: Just Run Tests (2 seconds)

```bash
cd /home/edve/netrunner/backend && npm test
```

**What happens:** Runs 18 Jest tests, shows results, exits

---

## ✅ Test Option 3: Full Docker Stack (3-5 minutes)

```bash
cd /home/edve/netrunner/backend && docker-compose up -d
```

**What happens:** Starts MongoDB, Redis, Nginx, and Backend
Then test it:
```bash
curl http://localhost:3000/health
```

Stop it with:
```bash
cd /home/edve/netrunner/backend && docker-compose down
```

---

## ✅ Test Option 4: View Project Stats

```bash
# Count lines of code
find /home/edve/netrunner/backend/src -name "*.js" | xargs wc -l | tail -1

# Count test cases
wc -l /home/edve/netrunner/backend/tests/api.test.js

# View latest commits
cd /home/edve/netrunner && git log --oneline -10

# Check dependencies
cd /home/edve/netrunner/backend && npm list | head -20
```

---

## 📚 Read Documentation

```bash
# Quick reference
cat /home/edve/netrunner/QUICK_REFERENCE.md

# Testing guide
cat /home/edve/netrunner/TESTING_GUIDE.md

# What's ready to test
cat /home/edve/netrunner/TESTING_READY.md

# Testing instructions
cat /home/edve/netrunner/TEST_NOW.md
```

---

## 🔗 Check GitHub

```bash
# View commits
cd /home/edve/netrunner && git log --oneline -5

# Check status
cd /home/edve/netrunner && git status

# View current branch
cd /home/edve/netrunner && git branch -v
```

---

**RECOMMENDATION: Start with Test Option 1 - it's the easiest and fastest! ⭐**

```bash
cd /home/edve/netrunner && ./test.sh
```
