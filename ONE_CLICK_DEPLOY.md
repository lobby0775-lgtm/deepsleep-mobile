# 🚀 One-Click Vercel Deployment

## **Option A: Deploy via Vercel Dashboard (Easiest)**

1. **Go to:** https://vercel.com/new
2. **Click "Import Git Repository"**
3. **Connect your GitHub account** (if not already connected)
4. **Import from:** `https://github.com/yourusername/deepsleep-mobile`
   *(You'll need to push to GitHub first - see instructions below)*
5. **Configure:**
   - **Project Name:** `deepsleep-mobile`
   - **Framework Preset:** `Expo`
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `web-build`
   - **Install Command:** `npm install`
6. **Add Environment Variables:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://txfqmyfmdzfpfufaupaf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnFteWZtZHpmcGZ1ZmF1cGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA5ODEsImV4cCI6MjA4Nzk0Njk4MX0.e9EoL07FGSDMM2l5OE07k7mY3loPkR-xLow2skYmC4A
   ```
7. **Click "Deploy"**

## **Option B: Push to GitHub First**

### Step 1: Initialize Git
```bash
cd deepsleep-mobile
git init
git add .
git commit -m "Initial commit: DeepSleep React Native Web app"
```

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `deepsleep-mobile`
3. Click "Create repository"

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/deepsleep-mobile.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your new repository
3. Follow Option A steps 5-7

## **Option C: Direct Deploy Button**

Copy this markdown and replace `YOUR_USERNAME` with your GitHub username:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/deepsleep-mobile&env=EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_ANON_KEY&project-name=deepsleep-mobile&repository-name=deepsleep-mobile)
```

## **Option D: Manual Deployment via CLI**

If you have Vercel CLI installed and logged in:

```bash
cd deepsleep-mobile

# First deployment (follow prompts)
vercel

# Production deployment
vercel --prod
```

## **✅ What Will Deploy:**

### **App Structure:**
- ✅ Home Screen - Sleep dashboard
- ✅ Log Screen - Sleep tracking form
- ✅ Progress Screen - Charts & analytics
- ✅ Learn Screen - Education content
- ✅ Profile Screen - User settings
- ✅ Onboarding - Multi-step setup
- ✅ Login/Signup - Authentication

### **Features:**
- ✅ Full Supabase integration
- ✅ Mobile-responsive design
- ✅ Sleep logging & tracking
- ✅ Mental health assessment
- ✅ Charts & visualizations
- ✅ User profiles & settings

### **Technical:**
- ✅ React Native Web
- ✅ TypeScript
- ✅ Expo framework
- ✅ Vercel-optimized build
- ✅ Environment variables configured

## **🌐 After Deployment:**

Your app will be available at:
- **Production:** `https://deepsleep-mobile.vercel.app`
- **Preview:** `https://deepsleep-mobile-git-[branch].vercel.app`

## **🔧 Post-Deployment Checks:**

1. **Visit your URL** - Ensure app loads
2. **Test login/signup** - Create an account
3. **Test sleep logging** - Add a sleep entry
4. **Check mobile view** - Test responsiveness
5. **Verify Supabase** - Data saves correctly

## **🆘 Troubleshooting:**

### **Build fails:**
- Check environment variables are set
- Ensure Supabase project is active
- Verify Node.js version (18+)

### **App doesn't load:**
- Check deployment logs in Vercel dashboard
- Verify CORS settings in Supabase
- Clear browser cache

### **Database errors:**
- Run the SQL migration in Supabase
- Check table permissions
- Verify RLS policies

## **📞 Support:**

- **Vercel Docs:** https://vercel.com/docs
- **Expo Web:** https://docs.expo.dev/distribution/publishing-websites/
- **Supabase:** https://supabase.com/docs

---

## **🎉 Ready to Deploy!**

Your DeepSleep app is **production-ready** with:
- ✅ Complete UI/UX implementation
- ✅ Full Supabase integration
- ✅ Mobile-responsive design
- ✅ All features ported from web
- ✅ Vercel deployment configured

**Choose any option above and your app will be live in minutes!** 🚀