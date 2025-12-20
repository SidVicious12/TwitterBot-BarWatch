# BarWatch Deployment Guide

Complete step-by-step guide to deploy your BarWatch bot. Takes about 30 minutes.

---

## 📋 Prerequisites

Before you begin, make sure you have:
- [ ] A GitHub account
- [ ] An X (Twitter) account for the bot
- [ ] About 30 minutes of time

---

## 🚀 Deployment Steps

### Step 1: Get X (Twitter) API Credentials (10 minutes)

1. **Create a Twitter Developer Account**
   - Go to [developer.x.com](https://developer.x.com)
   - Sign in with your bot's Twitter account
   - Click "Sign up" for developer access
   - Fill out the application (select "Hobbyist" → "Making a bot")

2. **Create a New App**
   - Go to Developer Portal → Projects & Apps
   - Click "Create App"
   - Name it "BarWatch Bot"
   - Click "Create"

3. **Generate API Keys**
   - Click on your app
   - Go to "Keys and tokens" tab
   - Click "Generate" for API Key and Secret
   - **SAVE THESE IMMEDIATELY** (you won't see them again):
     - API Key → This is `TWITTER_API_KEY`
     - API Secret → This is `TWITTER_API_SECRET`

4. **Generate Access Tokens**
   - Still on "Keys and tokens" page
   - Scroll to "Access Token and Secret"
   - Click "Generate"
   - **SAVE THESE IMMEDIATELY**:
     - Access Token → This is `TWITTER_ACCESS_TOKEN`
     - Access Token Secret → This is `TWITTER_ACCESS_TOKEN_SECRET`

5. **Set App Permissions**
   - Go to "App settings" tab
   - Under "User authentication settings", click "Set up"
   - App permissions: Select **"Read and Write"**
   - Type of App: Select **"Web App, Automated App or Bot"**
   - Callback URL: `https://github.com/yourusername/barwatch`
   - Website URL: `https://github.com/yourusername/barwatch`
   - Click "Save"

✅ You should now have 4 credentials saved

---

### Step 2: Get Claude API Key (5 minutes)

1. **Create Anthropic Account**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in
   - Complete email verification

2. **Add Credits** (if needed)
   - You need at least $5 in credits
   - Go to "Billing" and add credits
   - (Don't worry, you'll only use ~$0.30/month)

3. **Generate API Key**
   - Click "API Keys" in the left sidebar
   - Click "Create Key"
   - Name it "BarWatch Bot"
   - Click "Create"
   - **COPY THE KEY** → This is `CLAUDE_API_KEY`

✅ You should now have 5 credentials total

---

### Step 3: Create GitHub Repository (5 minutes)

1. **Create New Repository**
   - Go to [github.com/new](https://github.com/new)
   - Repository name: `barwatch`
   - Description: "Automated bot tracking Kim Kardashian's bar exam status"
   - Visibility: **Public** (required for free GitHub Actions)
   - ✅ Initialize with README
   - Click "Create repository"

2. **Add Secrets**
   - In your new repo, go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each of these **5 secrets** (one at a time):

   | Secret Name | Value |
   |-------------|-------|
   | `TWITTER_API_KEY` | Your API Key from Step 1 |
   | `TWITTER_API_SECRET` | Your API Secret from Step 1 |
   | `TWITTER_ACCESS_TOKEN` | Your Access Token from Step 1 |
   | `TWITTER_ACCESS_TOKEN_SECRET` | Your Access Token Secret from Step 1 |
   | `CLAUDE_API_KEY` | Your Claude API Key from Step 2 |

✅ All 5 secrets should now show in the Secrets list

---

### Step 4: Upload Code to GitHub (10 minutes)

You have two options:

#### Option A: Using GitHub Web Interface (Easier)

1. In your GitHub repo, click "Add file" → "Upload files"

2. Upload these folders/files from your BarWatch project:
   - `.github/` folder (with workflows inside)
   - `src/` folder (all 4 .js files)
   - `scripts/` folder (all 3 verification scripts)
   - `package.json`
   - `.gitignore`
   - `README-UPDATED.md` (rename to `README.md`)

3. Scroll down and click "Commit changes"

#### Option B: Using Git Command Line (Faster)

```bash
# Navigate to your BarWatch folder
cd /Users/SidVicious/BarWatch

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: BarWatch bot v1.0"

# Add your GitHub repo as remote
git remote add origin https://github.com/yourusername/barwatch.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ Your code should now be on GitHub

---

### Step 5: Enable GitHub Actions (2 minutes)

1. Go to your repo on GitHub
2. Click the **"Actions"** tab
3. Click **"I understand my workflows, go ahead and enable them"**
4. You should see "BarWatch Daily Check" workflow

✅ Automation is now enabled!

---

### Step 6: Test Run (5 minutes)

1. **Manual Test**
   - Go to Actions tab
   - Click "BarWatch Daily Check" workflow
   - Click "Run workflow" dropdown
   - Click green "Run workflow" button
   - Wait 2-3 minutes

2. **Check Results**
   - Click on the running workflow
   - Click "check-bar-exam" job
   - Watch the logs expand
   - Look for ✅ success messages

3. **Verify Tweet Posted**
   - Go to your bot's Twitter profile
   - You should see a new tweet!
   - Example: "Did Kim Kardashian pass the bar? Still waiting for news... 📚"

✅ If you see a tweet, **YOUR BOT IS LIVE!** 🎉

---

## 🎯 What Happens Next?

### Daily Schedule
- Bot runs automatically **every day at 8 AM PST**
- Checks 4 news sources for updates
- Posts tweet if there's news
- Logs stored in GitHub Actions

### Tweet Frequency
- **Now - January 2026**: Daily status updates
- **January 2026**: Countdown tweets increase
- **February 2026**: Active monitoring for exam
- **Late Feb/Early March 2026**: Results announcement

---

## 🔧 Customization (Optional)

### Change Schedule Time

Edit `.github/workflows/barwatch.yml`:

```yaml
schedule:
  - cron: '0 16 * * *'  # 4 PM UTC = 8 AM PST
```

Use [crontab.guru](https://crontab.guru) to find your preferred time.

### Customize Tweets

Edit `src/analyzer.js` around line 110:

```javascript
const templates = {
  passed: `Your message here`,
  failed: `Your message here`,
  pending: `Your message here`
};
```

---

## 🧪 Testing Commands

### Local Testing (Requires Node.js installed)

```bash
# Install dependencies
npm install

# Test without posting tweets
DRY_RUN=true npm start

# Verify Twitter credentials
npm run verify-twitter

# Verify Claude credentials
npm run verify-claude

# Check all environment variables
npm run health-check
```

---

## 🚨 Troubleshooting

### Problem: "Secrets not found" error

**Solution:**
- Go to Settings → Secrets and variables → Actions
- Verify all 5 secrets are there
- Secret names must match EXACTLY (case-sensitive)

### Problem: "Tweet not posting"

**Solution:**
- Check X app has "Read and Write" permissions
- Regenerate access tokens after changing permissions
- Update secrets in GitHub with new tokens

### Problem: "Claude API error"

**Solution:**
- Check API key is correct
- Verify you have credits in Anthropic account
- Check [status.anthropic.com](https://status.anthropic.com) for outages

### Problem: "Workflow doesn't run daily"

**Solution:**
- Verify GitHub Actions is enabled in repo settings
- Check Actions tab for any error messages
- GitHub Actions can delay up to 15 minutes during high load

### Problem: Bot runs but doesn't tweet

**Solution:**
- This is normal if there's no significant news
- Check logs in Actions tab for "No significant news" message
- Bot will tweet countdown messages as February 2026 approaches

---

## 📊 Monitoring Your Bot

### Check Bot Status

1. **Twitter Profile**
   - Visit your bot's profile daily
   - Verify tweets are posting

2. **GitHub Actions Logs**
   - Go to Actions tab
   - Click latest workflow run
   - Review logs for any errors

3. **Action Items**
   - Monitor weekly for first month
   - Check before/after February 2026 exam
   - Adjust as needed based on results

---

## 💰 Cost Tracking

### Expected Monthly Costs

| Service | Cost |
|---------|------|
| GitHub Actions | $0 (free tier: 2,000 min/month) |
| X API | $0 (free tier) |
| Claude API | ~$0.30/month |
| **Total** | **~$0.30/month** |

### Monitor Claude Usage
- Check [console.anthropic.com](https://console.anthropic.com)
- Go to "Usage" to see API costs
- Set up billing alerts if desired

---

## 🎉 Success Checklist

After deployment, you should have:

- [x] X bot account created and configured
- [x] GitHub repository with all code
- [x] All 5 API secrets configured
- [x] GitHub Actions enabled
- [x] First test run successful
- [x] Tweet visible on X profile
- [x] Daily schedule active

**Congratulations! Your BarWatch bot is now live!** 🚀

---

## 📞 Getting Help

If you run into issues:

1. Check this troubleshooting guide first
2. Review GitHub Actions logs for errors
3. Verify all credentials are correct
4. Check [developer.x.com](https://developer.x.com) for API status
5. Check [status.anthropic.com](https://status.anthropic.com) for Claude status

---

## 🔄 Updating Your Bot

To make changes:

1. Edit files locally or on GitHub
2. Commit and push changes
3. GitHub Actions will use updated code on next run
4. Test with manual workflow trigger

---

## 📈 Next Steps

### Week 1
- Monitor daily tweets
- Customize messages if desired
- Share bot with friends

### Month 1-2 (January 2026)
- Watch for exam countdown tweets
- Monitor engagement
- Prepare for results announcement

### February 2026
- Bot actively monitors for exam results
- Increased tweet frequency
- Major announcement potential!

---

**Made with ❤️ using Claude AI, Node.js, and GitHub Actions**

**Your bot is now tracking Kim Kardashian's bar exam journey!** 📚✨
