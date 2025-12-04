# 🚀 Cloudflare Pages Setup Guide

## ✅ What's Already Done

- ✅ Code restructured for Pages Functions
- ✅ GitHub repository created: https://github.com/gabeperez/ScreenGrab
- ✅ Code pushed to GitHub
- ✅ .gitignore configured (no secrets in repo)
- ✅ Clean wrangler.toml

## 🎯 Next Steps: Connect to Cloudflare Pages

### Step 1: Create New Pages Project

1. Go to **Cloudflare Dashboard**: https://dash.cloudflare.com/
2. Click **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Select the **Pages** tab
5. Click **Connect to Git**

### Step 2: Connect GitHub Repository

1. Click **Connect GitHub**
2. If prompted, authorize Cloudflare to access your GitHub
3. Select **gabeperez/ScreenGrab** from the repository list
4. Click **Begin setup**

### Step 3: Configure Build Settings

**Project name**: `screengrab` (or whatever you prefer)

**Production branch**: `main`

**Build settings**:
- **Framework preset**: None
- **Build command**: *(leave empty)*
- **Build output directory**: `public`

Click **Save and Deploy** (but wait - we need to add environment variables first!)

Actually, click **Cancel** and let's add environment variables first.

### Step 4: Add Environment Variables

In the Pages project settings:

1. Go to **Settings** > **Environment variables**
2. Click **Add variable**
3. Add these **Production** environment variables:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `JWT_SECRET` | Generate new one | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | Already have: `38684764880-jr423bgp0fmdcjb2t7ip6sm9evjmio91.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | Already have (from previous setup) |
| `RESEND_API_KEY` | Your Resend API key | Already have (from previous setup) |
| `APP_URL` | Your Pages URL | Will be: `https://screengrab.pages.dev` (update after first deploy) |

**Important**: Click **Encrypt** for each secret variable!

### Step 5: Configure Bindings

Still in **Settings**, scroll to **Functions**:

#### D1 Database Binding
1. Click **Add binding** under **D1 database bindings**
2. **Variable name**: `DB`
3. **D1 database**: Select `screengrab-db`
4. Click **Save**

#### R2 Bucket Binding
1. Click **Add binding** under **R2 bucket bindings**
2. **Variable name**: `VIDEOS_BUCKET`
3. **R2 bucket**: Select `screengrab-videos`
4. Click **Save**

### Step 6: Configure Cron Trigger

1. In **Settings** > **Functions**
2. Scroll to **Cron Triggers**
3. Click **Add cron trigger**
4. **Cron expression**: `0 2 * * *`
5. **Description**: "Daily cleanup of expired videos at 2 AM UTC"
6. Click **Save**

### Step 7: Deploy!

1. Go to **Deployments** tab
2. Click **Create deployment**
3. Select branch: `main`
4. Click **Deploy**

Wait for deployment to complete (~1-2 minutes)

### Step 8: Update APP_URL

After first deployment:

1. Note your Pages URL (e.g., `https://screengrab.pages.dev`)
2. Go back to **Settings** > **Environment variables**
3. Edit the `APP_URL` variable
4. Set it to your actual Pages URL
5. **Redeploy** (Deployments > View details > Retry deployment)

### Step 9: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, **REMOVE** the old Worker URL
4. **ADD** the new Pages URL:
   ```
   https://screengrab.pages.dev/api/auth/google/callback
   ```
5. Click **Save**

### Step 10: Test Everything! 🎉

1. Visit your Pages URL: `https://screengrab.pages.dev`
2. Click **"Get Started with Google"**
3. Sign in with Google
4. You should be redirected to the dashboard
5. Click **"Record New Video"**
6. Test recording, uploading, sharing

---

## 🎨 Custom Domain (Optional)

Want a custom domain like `screengrab.com`?

1. In Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain
4. Follow DNS configuration instructions
5. Update `APP_URL` environment variable to your custom domain
6. Update Google OAuth redirect URI to use custom domain
7. Redeploy

---

## 🔄 Future Deployments

**It's automatic!** Just push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Cloudflare Pages will automatically:
- ✅ Build your project
- ✅ Deploy to production
- ✅ Keep all your bindings and environment variables

---

## 📊 Current Resources

### R2 Bucket
- **Name**: `screengrab-videos`
- **Status**: ✅ Created
- **Bound as**: `VIDEOS_BUCKET`

### D1 Database
- **Name**: `screengrab-db`
- **ID**: `72e73fe0-a117-40b6-b268-67d3dc4dba30`
- **Tables**: ✅ Initialized with schema
- **Bound as**: `DB`

---

## 🐛 Troubleshooting

### "Environment variable not found"
- Make sure all 5 environment variables are added in Pages settings
- Make sure they're marked as "Encrypted"
- Redeploy after adding variables

### "D1 binding not found"
- Go to Settings > Functions
- Add D1 binding: `DB` → `screengrab-db`
- Redeploy

### "R2 binding not found"
- Go to Settings > Functions
- Add R2 binding: `VIDEOS_BUCKET` → `screengrab-videos`
- Redeploy

### OAuth still failing
- Double-check redirect URI in Google Console
- Make sure it exactly matches: `https://YOUR_PAGES_URL/api/auth/google/callback`
- No trailing slashes
- Wait 1-2 minutes for Google changes to propagate

### Videos won't upload
- Check that R2 bucket binding is configured
- Check browser console for errors
- Verify you're logged in

---

## 🎉 That's It!

Once configured, your ScreenGrab app will:
- ✅ Run on a single domain (no CORS issues)
- ✅ Auto-deploy on every git push
- ✅ Cost $0/month on Cloudflare's free tier
- ✅ Handle authentication seamlessly
- ✅ Self-destruct videos automatically
- ✅ Send email notifications
- ✅ Scale to thousands of users for free

**Questions?** Check the main README.md or open an issue on GitHub!

