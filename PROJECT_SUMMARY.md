# ScreenGrab - Project Summary

## 🎯 Project Overview

ScreenGrab is a complete screen recording and video sharing platform built entirely on Cloudflare's free tier. It allows users to:

- Record their screen, window, or tab in the browser
- Get instant shareable links
- Set videos to self-destruct after 24h, 1 week, or 1 month
- Download videos before they expire
- Request expired videos (owner gets email notification)
- Re-upload expired videos without re-recording

**Key Features:**
- 100% free hosting (Cloudflare free tier)
- No storage bloat (automatic expiration)
- Google OAuth authentication
- Email notifications via Resend
- Beautiful, modern UI
- Mobile responsive

---

## 📁 Project Structure

```
ScreenGrab/
├── src/                      # Backend (Cloudflare Workers)
│   ├── index.js             # Main Worker entry point
│   ├── auth.js              # OAuth & JWT authentication
│   ├── videos.js            # Video CRUD endpoints
│   ├── storage.js           # R2 storage utilities
│   ├── email.js             # Email notifications (Resend)
│   └── cron.js              # Scheduled cleanup jobs
│
├── public/                   # Frontend (Cloudflare Pages)
│   ├── index.html           # Landing page
│   ├── record.html          # Screen recording interface
│   ├── dashboard.html       # User video management
│   ├── video.html           # Video player
│   ├── expired.html         # Self-destruct page
│   ├── styles.css           # Global styles
│   └── utils.js             # Shared JS utilities
│
├── wrangler.toml            # Cloudflare configuration
├── schema.sql               # D1 database schema
├── package.json             # Dependencies
├── README.md                # Project documentation
├── SETUP.md                 # Detailed setup guide
├── QUICK_START.md           # Quick setup guide
└── setup-helper.sh          # Automated setup script
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Vanilla JavaScript (no frameworks)
- MediaRecorder API for screen capture
- Modern CSS with CSS Grid/Flexbox
- Hosted on Cloudflare Pages

**Backend:**
- Cloudflare Workers (serverless)
- Hono framework (lightweight Express-like)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (S3-compatible storage)

**Authentication:**
- Google OAuth 2.0
- JWT tokens (HTTP-only cookies)

**Notifications:**
- Resend API (transactional emails)

### Data Flow

```
User Browser
    ↓
    ↓ 1. Record screen with MediaRecorder API
    ↓
    ↓ 2. Request presigned upload URL
    ↓
Cloudflare Worker (API)
    ↓
    ↓ 3. Generate video ID & return upload endpoint
    ↓
User Browser
    ↓
    ↓ 4. Upload video blob directly
    ↓
Cloudflare R2 (Storage)
    ↓
User Browser
    ↓
    ↓ 5. Finalize upload (store metadata)
    ↓
Cloudflare Worker (API)
    ↓
    ↓ 6. Save to D1 database
    ↓
Cloudflare D1 (Database)
```

### Database Schema

**users**
- id (TEXT, primary key)
- email (TEXT, unique)
- name (TEXT)
- google_id (TEXT, unique)
- created_at (INTEGER)

**videos**
- id (TEXT, primary key)
- user_id (TEXT, foreign key)
- filename (TEXT)
- r2_key (TEXT)
- size_bytes (INTEGER)
- duration_seconds (INTEGER)
- expiration_type (TEXT: '24h', '1week', '1month')
- expires_at (INTEGER)
- is_expired (INTEGER, default 0)
- created_at (INTEGER)
- view_count (INTEGER, default 0)

**video_requests**
- id (INTEGER, primary key, autoincrement)
- video_id (TEXT, foreign key)
- requester_email (TEXT, nullable)
- requested_at (INTEGER)
- fulfilled (INTEGER, default 0)

---

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Videos
- `POST /api/videos/prepare-upload` - Get upload URL
- `PUT /api/videos/:id/upload` - Upload video blob
- `POST /api/videos/:id/finalize` - Store metadata
- `GET /api/videos/:id` - Get video metadata
- `GET /api/videos/:id/stream` - Stream video
- `GET /api/videos/:id/download` - Download video
- `POST /api/videos/:id/request` - Request expired video
- `POST /api/videos/:id/reupload` - Re-upload expired video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/user/videos` - List user's videos

### Scheduled Jobs
- Daily cron (2 AM UTC): Mark expired videos
- Cleanup: Delete videos expired > 7 days

---

## 🎨 Features Implemented

### ✅ Core Features
- [x] Screen recording (screen/window/tab)
- [x] Video upload to R2
- [x] Shareable video links
- [x] Video player with controls
- [x] Download videos
- [x] Self-destructing videos (3 expiration options)
- [x] User dashboard
- [x] Video management (view, delete, re-upload)

### ✅ Authentication
- [x] Google OAuth login
- [x] JWT-based sessions
- [x] Protected routes
- [x] User profile

### ✅ Expiration & Cleanup
- [x] Automatic expiration checking
- [x] Expired video page
- [x] Request expired videos
- [x] Email notifications for requests
- [x] Re-upload functionality
- [x] Scheduled cleanup cron job

### ✅ UI/UX
- [x] Modern, responsive design
- [x] Beautiful gradient hero
- [x] Loading states
- [x] Toast notifications
- [x] Empty states
- [x] Video grid layout
- [x] Status badges
- [x] Expiration warnings

---

## 🚀 Deployment Checklist

### Local Development
- [ ] Run `npm install`
- [ ] Run `npx wrangler login`
- [ ] Create R2 bucket
- [ ] Create D1 database
- [ ] Update database_id in wrangler.toml
- [ ] Run `npm run db:init`
- [ ] Set up Google OAuth
- [ ] Set up Resend API
- [ ] Configure secrets (JWT, Google, Resend)
- [ ] Run `npm run dev`

### Production Deployment
- [ ] Deploy Worker: `npm run deploy`
- [ ] Deploy Pages: `npx wrangler pages deploy public --project-name=screengrab`
- [ ] Update APP_URL in wrangler.toml
- [ ] Add production OAuth redirect URI
- [ ] Configure custom domain (optional)
- [ ] Test all features in production

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Usage Estimate |
|---------|-----------|----------------|
| Cloudflare Workers | 100k requests/day | ~3M/month - plenty for personal/small team use |
| Cloudflare R2 | 10GB storage + 1M writes + 10M reads/month | ~100-200 videos depending on size |
| Cloudflare D1 | 5GB storage + 25M reads + 50k writes/day | Unlimited users & videos |
| Cloudflare Pages | Unlimited bandwidth | No limits |
| Resend | 3,000 emails/month | Plenty for notifications |

**Total Monthly Cost: $0** 🎉

---

## 🔒 Security Features

- HTTP-only cookies for JWT tokens
- Secure cookie settings (httpOnly, secure, sameSite)
- CORS configuration
- User ownership validation for video operations
- Presigned URLs for temporary access
- Google OAuth for authentication
- No passwords stored

---

## 🎯 Future Enhancements

Potential features to add:

- [ ] Multiple OAuth providers (GitHub, Microsoft)
- [ ] Video thumbnails generation
- [ ] Video compression/optimization
- [ ] Custom expiration times
- [ ] Public/private video toggle
- [ ] Video password protection
- [ ] Video analytics (views over time)
- [ ] Bulk video operations
- [ ] Video comments/reactions
- [ ] Team/organization support
- [ ] Custom branding
- [ ] API access for integrations
- [ ] Webhook notifications
- [ ] Video transcoding (different formats)

---

## 🐛 Troubleshooting

### Common Issues

**Videos won't upload:**
- Check R2 bucket exists and binding is correct
- Verify CORS settings
- Check browser console for errors

**OAuth not working:**
- Verify redirect URIs match exactly
- Check Google+ API is enabled
- Ensure credentials are correct

**Database errors:**
- Verify database_id in wrangler.toml
- Re-run `npm run db:init`
- Check table creation with: `npx wrangler d1 execute screengrab-db --command "SELECT name FROM sqlite_master WHERE type='table'"`

**Emails not sending:**
- Verify Resend API key
- Check email sending limits
- Verify domain is configured (if using custom domain)

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Hono Framework](https://hono.dev/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Resend Docs](https://resend.com/docs)

---

## 📝 Notes

- Screen recording only works over HTTPS (or localhost)
- Video format is WebM (VP9 codec preferred)
- Maximum video size limited by browser memory
- Expired videos kept for 7 days before automatic deletion
- Email notifications require verified domain for production use

---

## 🙏 Credits

Built with:
- Cloudflare Workers Platform
- Hono Web Framework
- MediaRecorder API
- Resend Email API
- Google OAuth

---

**Enjoy ScreenGrab! 🎥✨**

