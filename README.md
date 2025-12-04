# 🎥 ScreenGrab

A modern screen recording and video sharing platform with self-destructing links, built entirely on Cloudflare's free tier.

![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## ✨ Features

- 🎬 **Browser-based Recording** - Record screen, window, or tab directly in your browser
- 🔗 **Instant Sharing** - Get shareable links immediately after recording
- ⏱️ **Self-Destructing Videos** - Choose expiration: 24h, 1 week, or 1 month
- 💾 **Download Anytime** - Save videos before they expire
- 🔐 **Google OAuth** - Secure authentication
- 📧 **Email Notifications** - Get notified when someone requests an expired video
- 🔄 **Re-upload Feature** - Restore expired videos
- 📊 **Video Dashboard** - Manage all your recordings
- 🆓 **Completely Free** - Built on Cloudflare's free tier

## 🏗️ Architecture

**Built with:**
- **Frontend**: Vanilla JavaScript, HTML, CSS (no frameworks!)
- **Backend**: Cloudflare Pages Functions (Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: Google OAuth 2.0 + JWT
- **Email**: Resend API
- **Framework**: Hono (lightweight web framework)

**All on one domain** - Frontend and API run together on Cloudflare Pages for seamless authentication and zero CORS issues.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier)
- Google Cloud account (for OAuth)
- Resend account (for emails)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ScreenGrab.git
cd ScreenGrab
npm install
```

### 2. Set Up Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create R2 bucket
npx wrangler r2 bucket create screengrab-videos

# Create D1 database
npx wrangler d1 create screengrab-db

# Initialize database tables
npx wrangler d1 execute screengrab-db --remote --file=./schema.sql
```

Update `wrangler.toml` with your database ID from the create command.

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://YOUR_PAGES_URL/api/auth/google/callback`
4. Copy Client ID and Client Secret

### 4. Configure Cloudflare Pages

Connect this repo to Cloudflare Pages:

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Connect to GitHub and select this repository
4. Configure build settings:
   - **Build command**: Leave empty (no build needed)
   - **Build output directory**: `public`
5. Add environment variables (encrypted):
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `RESEND_API_KEY`: From Resend dashboard
   - `APP_URL`: Your Pages URL (e.g., `https://screengrab.pages.dev`)
6. Add bindings:
   - **D1 Database**: `DB` → `screengrab-db`
   - **R2 Bucket**: `VIDEOS_BUCKET` → `screengrab-videos`
7. Deploy!

### 5. Enable Cron Trigger

In Pages settings, enable the cron trigger:
- Schedule: `0 2 * * *` (daily at 2 AM UTC)
- This cleans up expired videos automatically

## 📁 Project Structure

```
ScreenGrab/
├── public/                 # Frontend (static files)
│   ├── index.html         # Landing page
│   ├── dashboard.html     # User dashboard
│   ├── record.html        # Recording interface
│   ├── video.html         # Video player
│   ├── expired.html       # Expired video page
│   ├── styles.css         # Global styles
│   └── utils.js           # Shared utilities
│
├── functions/             # Backend (Pages Functions)
│   ├── api/
│   │   └── [[path]].js   # API routes handler
│   └── _scheduled.js     # Cron job handler
│
├── src/                   # Backend modules
│   ├── auth.js           # Authentication logic
│   ├── videos.js         # Video CRUD operations
│   ├── storage.js        # R2 storage utilities
│   ├── email.js          # Email notifications
│   └── cron.js           # Scheduled tasks
│
├── schema.sql             # Database schema
├── wrangler.toml          # Cloudflare configuration
└── package.json           # Dependencies
```

## 🔧 Local Development

```bash
# Run locally with Wrangler
npx wrangler pages dev public --compatibility-date=2024-12-01

# Test database locally
npx wrangler d1 execute screengrab-db --local --file=./schema.sql

# View local database
npx wrangler d1 execute screengrab-db --local --command "SELECT * FROM users"
```

## 🌐 Deployment

### Automatic Deployment (Recommended)

Push to GitHub and Cloudflare Pages will automatically deploy:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployment

```bash
npx wrangler pages deploy public --project-name=screengrab
```

## 📊 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Videos
- `POST /api/videos/prepare-upload` - Get upload URL
- `PUT /api/videos/:id/upload` - Upload video
- `POST /api/videos/:id/finalize` - Finalize upload
- `GET /api/videos/:id` - Get video metadata
- `GET /api/videos/:id/stream` - Stream video
- `GET /api/videos/:id/download` - Download video
- `POST /api/videos/:id/request` - Request expired video
- `POST /api/videos/:id/reupload` - Re-upload expired video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/user/videos` - List user's videos

## 🗄️ Database Schema

### users
- `id` - UUID primary key
- `email` - User email
- `name` - Display name
- `google_id` - Google account ID
- `created_at` - Timestamp

### videos
- `id` - Video UUID
- `user_id` - Owner user ID
- `filename` - Original filename
- `r2_key` - R2 storage key
- `size_bytes` - File size
- `duration_seconds` - Video duration
- `expiration_type` - '24h', '1week', or '1month'
- `expires_at` - Expiration timestamp
- `is_expired` - Boolean flag
- `created_at` - Upload timestamp
- `view_count` - Number of views

### video_requests
- `id` - Auto-increment ID
- `video_id` - Requested video ID
- `requester_email` - Email of requester
- `requested_at` - Request timestamp
- `fulfilled` - Boolean flag

## 💰 Cost Breakdown

All on Cloudflare's **free tier**:

| Service | Free Tier | Monthly Usage |
|---------|-----------|---------------|
| Pages | Unlimited bandwidth | 100% covered |
| Workers (Functions) | 100k requests/day | ~3M/month |
| D1 Database | 5GB + 25M reads | Plenty for 1000s of users |
| R2 Storage | 10GB + 1M writes | ~100-200 videos |
| Resend Emails | 3,000/month | Plenty for notifications |

**Total Monthly Cost: $0** 🎉

## 🔒 Security

- HTTP-only JWT cookies + localStorage tokens
- Secure cookie settings (httpOnly, secure, sameSite)
- Google OAuth for authentication (no passwords stored)
- User ownership validation for all operations
- CORS configured properly
- Presigned URLs for temporary R2 access

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - feel free to use this for your own projects!

## 🙏 Built With

- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Hono](https://hono.dev/) - Lightweight web framework
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Resend](https://resend.com/) - Email API
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

**Enjoy ScreenGrab! 🎥✨**

Questions? Open an issue or reach out!
