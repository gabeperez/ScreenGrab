# 🚀 Get Started with ScreenGrab

Follow these steps to get your ScreenGrab app running!

---

## Step 1: Run the Setup Script

The easiest way to get started is to run the automated setup script:

```bash
./setup-helper.sh
```

This will:
- Install dependencies
- Login to Cloudflare
- Create R2 bucket
- Create D1 database
- Initialize database tables
- Set up secrets

**Alternative: Manual Setup**

If you prefer manual setup or the script doesn't work, follow [SETUP.md](./SETUP.md) for detailed instructions.

---

## Step 2: Get Google OAuth Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/)

2. **Create a new project** (or select existing)

3. **Enable Google+ API:**
   - Click "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials:**
   - Click "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Name it "ScreenGrab"
   
5. **Add Redirect URIs:**
   ```
   http://localhost:8787/api/auth/google/callback
   ```
   (Add production URL later)

6. **Copy your credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

7. **Update wrangler.toml:**
   
   Open `wrangler.toml` and update:
   ```toml
   GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com"
   ```

8. **Add Client Secret:**
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   # Paste your Client Secret when prompted
   ```

---

## Step 3: Get Resend API Key

1. Visit [resend.com](https://resend.com/) and sign up (free)

2. Go to **API Keys** in the dashboard

3. Click **Create API Key**

4. Copy the API key

5. **Add to Cloudflare:**
   ```bash
   npx wrangler secret put RESEND_API_KEY
   # Paste your API key when prompted
   ```

**Note:** For testing, you can use Resend's sandbox. For production, verify your domain.

---

## Step 4: Update Database ID

If you created the database manually (not using setup script):

1. Run:
   ```bash
   npx wrangler d1 create screengrab-db
   ```

2. Copy the `database_id` from the output

3. Open `wrangler.toml` and replace:
   ```toml
   database_id = "your-actual-database-id-here"
   ```

4. Initialize the database:
   ```bash
   npm run db:init
   ```

---

## Step 5: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:8787**

---

## Step 6: Test Your Setup

1. **Open the app:** http://localhost:8787

2. **Login:**
   - Click "Get Started with Google"
   - Sign in with your Google account
   - You should be redirected to the dashboard

3. **Record a video:**
   - Click "Start Recording"
   - Choose expiration time
   - Click "Start Recording"
   - Select screen/window/tab
   - Click "Start Recording" button
   - Record something (a few seconds is fine)
   - Click "Stop Recording"

4. **Verify upload:**
   - Video should upload automatically
   - You'll get a shareable link
   - Video should auto-open in new tab

5. **Test video player:**
   - Video should play
   - Download button should work
   - Copy link button should work

6. **Test dashboard:**
   - Go to Dashboard
   - Your video should appear
   - Try viewing, copying link, downloading

---

## Step 7: Deploy to Production

### Deploy Worker

```bash
npm run deploy
```

You'll get a URL like: `https://screengrab.YOUR_SUBDOMAIN.workers.dev`

### Deploy Frontend

```bash
npx wrangler pages deploy public --project-name=screengrab
```

You'll get a URL like: `https://screengrab.pages.dev`

### Update Configuration

1. **Update wrangler.toml:**
   ```toml
   APP_URL = "https://screengrab.pages.dev"
   ```

2. **Redeploy Worker:**
   ```bash
   npm run deploy
   ```

3. **Update Google OAuth:**
   - Go to Google Cloud Console → Credentials
   - Edit your OAuth client
   - Add redirect URI:
     ```
     https://screengrab.pages.dev/api/auth/google/callback
     ```

4. **Test production:**
   - Visit your Pages URL
   - Try logging in and recording

---

## ✅ Verification Checklist

Go through this checklist to make sure everything works:

### Authentication
- [ ] Can visit homepage
- [ ] "Get Started with Google" button shows
- [ ] Clicking it redirects to Google login
- [ ] After login, redirected to dashboard
- [ ] Name shows in dashboard
- [ ] Logout works

### Recording
- [ ] Can access /record.html
- [ ] Can select expiration time
- [ ] "Start Recording" prompts for screen selection
- [ ] Preview shows selected screen/window
- [ ] Can start recording
- [ ] Timer updates during recording
- [ ] Can stop recording
- [ ] Video uploads (loading spinner shows)
- [ ] Success screen appears with link
- [ ] Video auto-opens in new tab

### Video Player
- [ ] Video plays in player
- [ ] Download button works
- [ ] Copy link button works
- [ ] Expiration warning shows (if < 24h)
- [ ] View count increments

### Dashboard
- [ ] Videos list shows
- [ ] Can view video
- [ ] Can copy link
- [ ] Can download
- [ ] Can delete (with confirmation)

### Expiration
- [ ] After expiration, video redirects to expired page
- [ ] Can request expired video
- [ ] Email notification sent (check logs)

### Email Notifications
- [ ] Request notification received
- [ ] Contains video info and requester email
- [ ] Dashboard link works

---

## 🎯 Next Steps

Your app is now fully functional! Here are some ideas:

### Recommended
1. **Set up custom domain** for Pages
2. **Verify email domain** on Resend for production emails
3. **Monitor usage** in Cloudflare dashboard
4. **Set up error monitoring** (Sentry, etc.)

### Optional
1. Add more OAuth providers
2. Customize email templates
3. Add video thumbnails
4. Implement video compression
5. Add team/organization features

---

## 🐛 Troubleshooting

### "Failed to upload video"
- Check R2 bucket exists: `npx wrangler r2 bucket list`
- Check bucket binding in wrangler.toml
- Check browser console for errors

### "Authentication failed"
- Verify Google Client ID in wrangler.toml
- Check redirect URI matches exactly
- Make sure Google+ API is enabled

### "Database error"
- Verify database_id in wrangler.toml
- Run: `npm run db:init` to reinitialize
- Check tables exist: `npx wrangler d1 execute screengrab-db --command "SELECT name FROM sqlite_master"`

### "Email not sending"
- Check Resend API key is set
- Verify you're within free tier limits (3,000/month)
- Check Resend dashboard for errors
- Update sender email in src/email.js

### "Can't access localhost:8787"
- Make sure `npm run dev` is running
- Try different port: `npx wrangler dev --port 8788`
- Check for port conflicts

---

## 📚 Resources

- **Detailed Setup:** [SETUP.md](./SETUP.md)
- **Quick Reference:** [QUICK_START.md](./QUICK_START.md)
- **Project Details:** [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- **Code Documentation:** [README.md](./README.md)

---

## 🆘 Need Help?

1. Check the documentation files listed above
2. Check Cloudflare Workers logs: `npx wrangler tail`
3. Check browser console for errors
4. Review [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)

---

## 🎉 You're All Set!

Enjoy building with ScreenGrab! 🎥✨

If you have any questions, refer to the documentation files or check the Cloudflare docs.

Happy recording! 📹

