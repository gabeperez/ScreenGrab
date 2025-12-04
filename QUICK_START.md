# ScreenGrab - Quick Start Guide

Get up and running in 5 minutes! 🚀

## What You'll Need

Before starting, gather these credentials:

- [ ] Cloudflare account
- [ ] Google Cloud project (for OAuth)
- [ ] Resend account (for emails)

---

## Quick Setup Commands

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Create Resources

```bash
# Create R2 bucket for video storage
npx wrangler r2 bucket create screengrab-videos

# Create D1 database
npx wrangler d1 create screengrab-db
```

**📝 After running the D1 command:**
- Copy the `database_id` from the output
- Open `wrangler.toml` 
- Replace `YOUR_DATABASE_ID_HERE` with your actual database ID

### 4. Initialize Database

```bash
npm run db:init
```

### 5. Configure Secrets

```bash
# JWT Secret (generate random string)
npx wrangler secret put JWT_SECRET
# Enter: (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Google OAuth (get from Google Cloud Console)
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google OAuth Client Secret

# Resend API Key (get from resend.com)
npx wrangler secret put RESEND_API_KEY
# Enter your Resend API key
```

### 6. Update Configuration

Edit `wrangler.toml` and update:

```toml
GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"
```

### 7. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:8787` 🎉

---

## Google OAuth Setup (3 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**: "APIs & Services" > "Library" > Search "Google+" > Enable
4. Create credentials: "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add redirect URI: `http://localhost:8787/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

---

## Resend Email Setup (2 minutes)

1. Go to [resend.com](https://resend.com/) and sign up (free)
2. Get your API key from the dashboard
3. (Optional) Add and verify your domain for custom sender

---

## Deploy to Production

```bash
# Deploy Worker
npm run deploy

# Deploy Frontend to Pages
npx wrangler pages deploy public --project-name=screengrab
```

**After deployment:**
1. Copy your Pages URL (e.g., `https://screengrab.pages.dev`)
2. Update `wrangler.toml`:
   ```toml
   APP_URL = "https://screengrab.pages.dev"
   ```
3. Add production redirect URI to Google OAuth:
   ```
   https://screengrab.pages.dev/api/auth/google/callback
   ```
4. Redeploy: `npm run deploy`

---

## Verification Checklist

- [ ] Can access the homepage
- [ ] Can login with Google
- [ ] Can start a screen recording
- [ ] Video uploads successfully
- [ ] Can view/share video link
- [ ] Can download video
- [ ] Video expires correctly
- [ ] Email notifications work (for expired video requests)

---

## Need Help?

See [SETUP.md](./SETUP.md) for detailed troubleshooting and configuration options.

## Architecture

```
┌─────────────────┐
│  Cloudflare     │
│  Pages          │  ← Frontend (HTML/CSS/JS)
│  (Static Site)  │
└────────┬────────┘
         │
         │ API calls
         ↓
┌─────────────────┐
│  Cloudflare     │
│  Workers        │  ← Backend (API + Auth)
│  (Serverless)   │
└────┬──────┬─────┘
     │      │
     │      └─────────→ ┌─────────────┐
     │                  │  Cloudflare │
     │                  │  D1         │  ← Database (SQLite)
     │                  └─────────────┘
     │
     └────────────────→ ┌─────────────┐
                        │  Cloudflare │
                        │  R2         │  ← Video Storage
                        └─────────────┘
```

---

## Tech Stack

- **Frontend:** Vanilla JavaScript, MediaRecorder API
- **Backend:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Auth:** Google OAuth 2.0 + JWT
- **Email:** Resend API
- **Hosting:** Cloudflare Pages

---

Enjoy building with ScreenGrab! 🎬✨

