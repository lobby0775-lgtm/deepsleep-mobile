# 🚀 Quick Deploy to Vercel

## Option 1: One-Click Deploy (Easiest)

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/deepsleep-mobile&env=EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_ANON_KEY&envDescription=Supabase%20configuration%20for%20DeepSleep&project-name=deepsleep-mobile&repository-name=deepsleep-mobile)

**Steps after clicking:**
1. Sign in to Vercel (or create account)
2. Import from GitHub (you'll need to push to GitHub first)
3. Configure environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL`: `https://txfqmyfmdzfpfufaupaf.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnFteWZtZHpmcGZ1ZmF1cGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA5ODEsImV4cCI6MjA4Nzk0Njk4MX0.e9EoL07FGSDMM2l5OE07k7mY3loPkR-xLow2skYmC4A`
4. Click "Deploy"
5. Your app will be live at `https://deepsleep-mobile.vercel.app`

## Option 2: Manual Deployment

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/deepsleep-mobile.git
git push -u origin main
```

### Step 2: Deploy via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `deepsleep-mobile` repository
4. Configure:
   - **Framework Preset**: Expo
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `web-build`
5. Add Environment Variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://txfqmyfmdzfpfufaupaf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnFteWZtZHpmcGZ1ZmF1cGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA5ODEsImV4cCI6MjA4Nzk0Njk4MX0.e9EoL07FGSDMM2l5OE07k7mY3loPkR-xLow2skYmC4A
   ```
6. Click "Deploy"

## Option 3: Command Line (If you have Vercel CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd deepsleep-mobile
vercel --prod
```

## ✅ What's Already Configured

The project is ready for deployment with:

1. **Vercel configuration** (`vercel.json`) with:
   - Correct build commands
   - Client-side routing rewrites
   - Environment variable setup

2. **Web build ready** - Tested with `npm run build:web`

3. **Supabase integration** - Already connected to your Supabase project

4. **All screens and components** - Complete React Native Web app

## 🔧 Post-Deployment Checklist

After deployment, verify:

- [ ] App loads at your Vercel URL
- [ ] Login/Signup works
- [ ] Sleep logging functions
- [ ] Charts display correctly
- [ ] Mobile responsiveness works
- [ ] Supabase connection is active

## 📱 Mobile App Deployment

For mobile app stores (App Store/Google Play):

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Submit to stores
expo upload:ios
expo upload:android
```

## 🆘 Need Help?

If deployment fails:
1. Check Vercel deployment logs
2. Verify environment variables
3. Ensure Supabase project is active
4. Contact: [Vercel Support](https://vercel.com/support)

---

**Your DeepSleep app is production-ready!** 🎉

The React Native Web port is complete with:
- ✅ Full Supabase integration
- ✅ All web app features ported
- ✅ Mobile-responsive design
- ✅ Ready for Vercel deployment
- ✅ Database schema created
- ✅ Complete documentation