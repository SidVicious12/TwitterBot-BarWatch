# BarWatch - Quick Start Guide

Deploy your bot in under 30 minutes! 🚀

---

## ✅ **What You Have**

Your complete BarWatch bot is ready with:
- ✅ All source code files
- ✅ GitHub Actions automation
- ✅ Documentation
- ✅ Test scripts
- ✅ Git repository initialized

---

## 🎯 **3 Steps to Deploy**

### Step 1: Get API Keys (15 min)

**Twitter API** (developer.x.com):
- Create developer account
- Create new app "BarWatch"
- Generate 4 credentials:
  - `TWITTER_API_KEY`
  - `TWITTER_API_SECRET`
  - `TWITTER_ACCESS_TOKEN`
  - `TWITTER_ACCESS_TOKEN_SECRET`

**Claude API** (console.anthropic.com):
- Create account
- Add $5 credits
- Generate API key:
  - `CLAUDE_API_KEY`

### Step 2: Create GitHub Repo (5 min)

1. Go to github.com/new
2. Name: `barwatch`
3. Visibility: **Public**
4. Create repository
5. Add all 5 secrets in Settings → Secrets → Actions

### Step 3: Push Code (5 min)

```bash
cd /Users/SidVicious/BarWatch

# Add your GitHub repo URL
git remote add origin https://github.com/YOUR-USERNAME/barwatch.git

# Commit and push
git commit -m "Initial commit: BarWatch bot v1.0"
git push -u origin main
```

---

## 🧪 **Test Your Bot**

### Option 1: Local Test (Dry Run)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Test without posting
DRY_RUN=true npm start
```

### Option 2: GitHub Actions Test

1. Go to repo → Actions tab
2. Enable workflows
3. Click "BarWatch Daily Check"
4. Click "Run workflow"
5. Wait 2 minutes
6. Check your Twitter bot account for tweet!

---

## 📅 **What Happens Next**

- **Automatically**: Bot runs every day at 8 AM PST
- **December 2025 - January 2026**: Daily status updates
- **February 2026**: Active exam monitoring
- **March 2026**: Results announcement

---

## 🔧 **Commands**

```bash
# Run bot
npm start

# Test without posting
DRY_RUN=true npm start

# Verify credentials
npm run verify-twitter
npm run verify-claude
npm run health-check
```

---

## 📚 **Full Documentation**

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete step-by-step guide
- [README.md](./README.md) - Project overview
- [PROJECT-SUMMARY-UPDATED.md](./PROJECT-SUMMARY-UPDATED.md) - Detailed summary

---

## 🆘 **Need Help?**

**Common Issues:**

1. **"Secrets not found"**
   - Add all 5 secrets to GitHub repo settings
   - Names must match exactly (case-sensitive)

2. **"Tweet not posting"**
   - Check Twitter app has "Read and Write" permissions
   - Regenerate access tokens after changing permissions

3. **"Bot doesn't run daily"**
   - Enable GitHub Actions in repo settings
   - Verify workflow file is in `.github/workflows/`

---

## 🎉 **Success Checklist**

- [ ] Got 5 API credentials
- [ ] Created GitHub repository
- [ ] Added 5 secrets to GitHub
- [ ] Pushed code to GitHub
- [ ] Enabled GitHub Actions
- [ ] Ran manual test
- [ ] Saw tweet on Twitter
- [ ] **BOT IS LIVE!** 🚀

---

**Your bot is ready to track Kim Kardashian's bar exam journey!**

Next exam: **February 2026** 📚
