# 👋 Welcome to ScreenGrab!

Your complete screen recording and sharing platform is ready to deploy!

---

## 🎯 What You Have

A fully functional screen recording app with:
- ✅ Screen recording in browser
- ✅ Video sharing with self-destruct links
- ✅ Google OAuth login
- ✅ Dashboard to manage videos
- ✅ Email notifications
- ✅ Download videos
- ✅ Re-upload expired videos
- ✅ Beautiful, modern UI
- ✅ 100% free hosting on Cloudflare

---

## 🚀 Quick Start (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup-helper.sh
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Login to Cloudflare
npx wrangler login

# 3. Create resources
npx wrangler r2 bucket create screengrab-videos
npx wrangler d1 create screengrab-db

# 4. Update wrangler.toml with database_id from step 3

# 5. Initialize database
npm run db:init

# 6. Set secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put RESEND_API_KEY

# 7. Update wrangler.toml with GOOGLE_CLIENT_ID
```

---

## 📋 What You Need

Before running the setup, gather these:

1. **Google OAuth Credentials** (2 min setup)
   - Visit: https://console.cloud.google.com/
   - Create OAuth client
   - Get Client ID & Secret
   - Guide: See GET_STARTED.md

2. **Resend API Key** (1 min setup)
   - Visit: https://resend.com/
   - Sign up for free
   - Get API key
   - Guide: See GET_STARTED.md

3. **Cloudflare Account** (already have!)
   - Just need to login: `npx wrangler login`

---

## 📖 Documentation Guide

**Start with one of these:**

### 🟢 Just want to get it running?
→ Read [GET_STARTED.md](./GET_STARTED.md) (step-by-step guide)

### 🟡 Want quick reference?
→ Read [QUICK_START.md](./QUICK_START.md) (5 min overview)

### 🟠 Need detailed info?
→ Read [SETUP.md](./SETUP.md) (complete setup guide)

### 🔵 Want to understand the project?
→ Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) (architecture & features)

### ⚪ General info?
→ Read [README.md](./README.md) (project overview)

---

## 🎬 After Setup

Once setup is complete, run:

```bash
npm run dev
```

Then visit: **http://localhost:8787**

Test the app:
1. Login with Google
2. Record a quick video
3. Share the link
4. Download the video

---

## 📦 Project Structure

```
ScreenGrab/
├── src/              # Backend (Workers)
├── public/           # Frontend (Pages)
├── wrangler.toml     # Config
├── schema.sql        # Database
└── docs/             # All the .md files
```

---

## 🎯 Deploy to Production

When ready to deploy:

```bash
# Deploy Worker
npm run deploy

# Deploy Pages
npx wrangler pages deploy public --project-name=screengrab
```

---

## ✨ Features

- 🎥 **Screen Recording** - Record screen/window/tab
- 🔗 **Instant Sharing** - Get shareable link immediately
- ⏱️ **Self-Destruct** - Videos expire (24h/1week/1month)
- 📥 **Downloads** - Save videos before expiration
- 📧 **Smart Requests** - Email notifications for expired videos
- 🔄 **Re-upload** - Share expired videos again
- 🎨 **Beautiful UI** - Modern, responsive design
- 🆓 **Free Hosting** - Cloudflare's generous free tier

---

## 💡 Tips

1. Start with local development (`npm run dev`)
2. Test all features before deploying
3. Set up custom domain for better URLs
4. Verify email domain on Resend for production
5. Monitor usage in Cloudflare dashboard

---

## 🆘 Need Help?

1. **Setup issues?** → Check [SETUP.md](./SETUP.md) troubleshooting section
2. **How does it work?** → Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
3. **Quick question?** → Check [QUICK_START.md](./QUICK_START.md)
4. **Step-by-step help?** → Follow [GET_STARTED.md](./GET_STARTED.md)

---

## 🎉 Ready?

**Next step:** Open [GET_STARTED.md](./GET_STARTED.md) and follow the guide!

Or run:
```bash
./setup-helper.sh
```

Happy recording! 🎥✨

