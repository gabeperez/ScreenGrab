# ScreenGrab Setup Guide

Complete step-by-step guide to get ScreenGrab running on Cloudflare.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- Cloudflare account (free tier works!)
- Google Cloud account (for OAuth)
- [Resend](https://resend.com/) account (for emails, free tier)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Cloudflare Setup

### 2.1 Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window for you to authorize Wrangler.

### 2.2 Create R2 Bucket

```bash
npx wrangler r2 bucket create screengrab-videos
```

### 2.3 Create D1 Database

```bash
npx wrangler d1 create screengrab-db
```

**Important:** Copy the `database_id` from the output and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "screengrab-db"
database_id = "your-database-id-here"  # Replace this!
```

### 2.4 Initialize Database Tables

```bash
npm run db:init
```

---

## Step 3: Google OAuth Setup

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

### 3.2 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI:
   ```
   http://localhost:8787/api/auth/google/callback  (for development)
   https://YOUR_WORKER_URL.workers.dev/api/auth/google/callback  (for production)
   ```
5. Copy the **Client ID** and **Client Secret**

### 3.3 Update wrangler.toml

Edit `wrangler.toml` and add your Google Client ID:

```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"
```

For the Client Secret, use Wrangler secrets (more secure):

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google Client Secret when prompted
```

---

## Step 4: Resend Email Setup

### 4.1 Create Resend Account

1. Go to [resend.com](https://resend.com/)
2. Sign up for free (3,000 emails/month)
3. Get your API key from the dashboard

### 4.2 Add Resend API Key

```bash
npx wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted
```

### 4.3 Verify Domain (Optional but Recommended)

1. In Resend dashboard, add your domain
2. Follow DNS verification steps
3. Update `from` email in `src/email.js`:
   ```javascript
   from: 'ScreenGrab <noreply@yourdomain.com>'
   ```

**Note:** For testing, you can use Resend's sandbox domain.

---

## Step 5: Generate JWT Secret

Generate a random secret for JWT tokens:

```bash
npx wrangler secret put JWT_SECRET
# Enter a random string (e.g., generate one with: openssl rand -base64 32)
```

Or update `wrangler.toml`:

```toml
[vars]
JWT_SECRET = "your-random-secret-here"
```

---

## Step 6: Local Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:8787`

**Note:** For OAuth to work locally, make sure you added `http://localhost:8787/api/auth/google/callback` to your Google OAuth redirect URIs.

---

## Step 7: Deploy to Production

### 7.1 Deploy Worker

```bash
npm run deploy
```

After deployment, you'll see your Worker URL (e.g., `https://screengrab.YOUR_SUBDOMAIN.workers.dev`).

### 7.2 Deploy Frontend to Cloudflare Pages

```bash
npx wrangler pages deploy public --project-name=screengrab
```

After deployment, you'll get your Pages URL (e.g., `https://screengrab.pages.dev`).

### 7.3 Update Configuration

1. Update `wrangler.toml` with your Pages URL:
   ```toml
   [vars]
   APP_URL = "https://screengrab.pages.dev"
   ```

2. Update Google OAuth redirect URI:
   - Go to Google Cloud Console > Credentials
   - Edit your OAuth client
   - Add: `https://screengrab.pages.dev/api/auth/google/callback`

3. Redeploy Worker:
   ```bash
   npm run deploy
   ```

---

## Step 8: Configure Pages to Use Worker

### Option A: Custom Domain (Recommended)

1. In Cloudflare dashboard, add a custom domain to your Pages project
2. Configure the Worker to run on the same domain
3. Both frontend and backend will be on the same domain (no CORS issues)

### Option B: Separate Domains

If using separate domains (Pages and Workers):

1. Update `public/utils.js` to point to your Worker URL:
   ```javascript
   const API_BASE = 'https://screengrab.YOUR_SUBDOMAIN.workers.dev';
   ```

2. Ensure CORS is properly configured in `src/index.js`

---

## Testing the Setup

1. Visit your Pages URL
2. Click "Get Started with Google"
3. Sign in with Google
4. Try recording a screen video
5. Check that the video uploads and you can view/share it

---

## Troubleshooting

### Database errors

```bash
# Check if database was initialized
npx wrangler d1 execute screengrab-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Re-run initialization if needed
npm run db:init
```

### R2 bucket errors

```bash
# List buckets
npx wrangler r2 bucket list

# Verify bucket exists
npx wrangler r2 bucket info screengrab-videos
```

### OAuth not working

- Verify redirect URIs match exactly
- Check that Google+ API is enabled
- Ensure Client ID and Secret are correct
- Check browser console for errors

### Videos not uploading

- Check R2 bucket binding in `wrangler.toml`
- Verify bucket exists and is accessible
- Check browser console for upload errors

---

## Free Tier Limits

- **R2:** 10GB storage, 1M writes/month, 10M reads/month
- **Workers:** 100,000 requests/day
- **D1:** 5GB storage, 25M rows read/day, 50,000 rows written/day
- **Pages:** Unlimited bandwidth
- **Resend:** 3,000 emails/month

---

## Next Steps

- Set up a custom domain
- Configure automatic backups for D1
- Add analytics tracking
- Customize email templates
- Add more video formats support

---

## Support

For issues or questions:
- Check the [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- Check the [Cloudflare R2 docs](https://developers.cloudflare.com/r2/)
- Review error logs: `npx wrangler tail`

