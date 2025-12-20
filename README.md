# BarWatch - Bar Exam Tracker Bot

> Automated X/Twitter bot that tracks whether Kim Kardashian has passed the California Bar Exam.

![Status](https://img.shields.io/badge/Status-Active-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 What is BarWatch?

BarWatch is a fully automated bot that:
- 🔍 **Searches daily** for news about Kim Kardashian's bar exam status
- 🤖 **Analyzes results** using Claude AI for accuracy
- 📱 **Posts tweets** automatically to X (Twitter)
- 🔄 **Runs 24/7** on GitHub Actions (free hosting)
- 💰 **Costs less than $1/month** to operate

**Next bar exam**: February 2026

---

## 🚀 Quick Start

### Prerequisites
- GitHub account
- X (Twitter) Developer account
- Claude API key (Anthropic)
- 30 minutes to set up

### Deploy in 3 Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/barwatch.git
   cd barwatch
   npm install
   ```

2. **Add your credentials** to GitHub Secrets:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`
   - `CLAUDE_API_KEY`

3. **Enable GitHub Actions**
   - Go to Actions tab → Enable workflows
   - Bot starts running automatically!

📖 **[Full deployment guide →](./DEPLOYMENT.md)**

---

## 📊 How It Works

```
┌─────────────────────────────────────────────┐
│  Daily at 8 AM PST (GitHub Actions)        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 1️⃣  Scrape News Sources       │
    │    - AP News, Reuters, TMZ     │
    │    - Official bar results      │
    └────────────────┬───────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ 2️⃣  Analyze with Claude AI    │
    │    - Determine bar status      │
    │    - Generate message          │
    └────────────────┬───────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ 3️⃣  Post to Twitter/X         │
    │    - Send automated tweet      │
    │    - Log results               │
    └────────────────────────────────┘
```

---

## 📂 Project Structure

```
barwatch/
├── .github/workflows/
│   └── barwatch.yml                  # Daily automation scheduler
├── src/
│   ├── index.js                      # Main bot orchestrator
│   ├── scraper.js                    # Web scraping (news sources)
│   ├── analyzer.js                   # Claude AI analysis
│   └── twitter.js                    # X API integration
├── scripts/
│   ├── verify-twitter.js             # Twitter credential verification
│   ├── verify-claude.js              # Claude API verification
│   └── health-check.js               # Environment check
├── package.json                      # Dependencies
├── .env.example                      # Configuration template
├── DEPLOYMENT.md                     # Setup guide
└── README.md                         # This file
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# X (Twitter) Credentials
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_TOKEN_SECRET=your_token_secret

# Claude API
CLAUDE_API_KEY=your_api_key

# Bot Settings
DRY_RUN=false              # Set to 'true' to test without posting
TIMEZONE=America/Los_Angeles
CHECK_TIME_PST=8           # Hour to run (8 = 8 AM PST)
```

### Customize Tweet Messages

Edit `src/analyzer.js`:

```javascript
const templates = {
  passed: `🎉 Kim Kardashian passed the bar! 👩‍⚖️`,
  failed: `Update: Not this time, but never giving up! 💪`,
  pending: `Still waiting for results... 📚`
};
```

---

## 🧪 Testing

### Local Dry Run (No Tweets Posted)

```bash
# Test without posting to Twitter
DRY_RUN=true npm start
```

### Verify Credentials

```bash
npm run verify-twitter
npm run verify-claude
npm run health-check
```

### Manual Test via GitHub Actions

1. Go to Actions tab
2. Select "BarWatch Daily Check"
3. Click "Run workflow"

---

## 📅 Scheduling

Bot runs automatically **every day at 8 AM PST**.

To change schedule, edit `.github/workflows/barwatch.yml`:

```yaml
schedule:
  - cron: '0 16 * * *'  # 4 PM UTC = 8 AM PST
```

Use [crontab.guru](https://crontab.guru) to generate your preferred time.

---

## 💰 Costs

| Service | Cost |
|---------|------|
| GitHub Actions | FREE (2,000 min/month) |
| X API | FREE (basic posting) |
| Claude API | ~$0.01 per check |
| **Total/Month** | **~$0.30** |

---

## ✨ Features

- ✅ Fully automated daily checks
- ✅ AI-powered news analysis (Claude)
- ✅ Multi-source scraping
- ✅ Free GitHub Actions hosting
- ✅ Error logging and monitoring
- ✅ Customizable messages
- ✅ Dry-run mode for testing
- ✅ Health check scripts

### Roadmap

- [ ] Profile picture & header images
- [ ] Sentiment analysis
- [ ] Multi-lawyer tracking
- [ ] SMS/Email notifications
- [ ] Dashboard visualization
- [ ] Advanced analytics
- [ ] Slack integration

---

## 🔧 Troubleshooting

### Bot not posting tweets?

```bash
# 1. Check credentials
npm run verify-twitter
npm run verify-claude

# 2. Run in dry-run mode
DRY_RUN=true npm start

# 3. Check GitHub Actions logs
# Go to: repo → Actions → Latest run
```

### Common Errors

| Error | Solution |
|-------|----------|
| "Secrets not found" | Verify all 5 secrets added to GitHub |
| "Tweet not posting" | Check X API has WRITE permission |
| "Claude API error" | Verify API key and account has credits |
| "Bot doesn't run daily" | Check cron time in UTC, enable Actions |

---

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step setup
- [X API Docs](https://developer.x.com/docs) - Twitter bot API
- [Claude API Docs](https://docs.anthropic.com) - AI analysis
- [GitHub Actions](https://docs.github.com/en/actions) - Automation

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Have ideas for improvements?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

- 🐛 Found a bug? Open an issue
- 💡 Have a feature idea? Create a discussion
- 📧 Email: contact@barwatch.dev

---

## 🎉 Get Started

Ready to launch? **[Follow the deployment guide →](./DEPLOYMENT.md)**

Your bot will be live and tracking within 30 minutes!

---

**Made with ❤️ and AI**

*BarWatch v1.0 - December 2025*
*Next exam: February 2026*
