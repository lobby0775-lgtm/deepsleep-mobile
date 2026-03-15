# Deployment Guide

## GitHub Repository
✅ **Repository:** https://github.com/nic-lobby/deepsleep-mobile

## Vercel Deployment

### One-Click Deploy:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nic-lobby/deepsleep-mobile)

### Manual Deployment:
1. Go to https://vercel.com/new
2. Import from GitHub: `nic-lobby/deepsleep-mobile`
3. Configure:
   - Framework: Expo
   - Build Command: `npm run build:web`
   - Output Directory: `web-build`
4. Add Environment Variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://txfqmyfmdzfpfufaupaf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnFteWZtZHpmcGZ1ZmF1cGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA5ODEsImV4cCI6MjA4Nzk0Njk4MX0.e9EoL07FGSDMM2l5OE07k7mY3loPkR-xLow2skYmC4A
   ```
5. Click "Deploy"

## Local Development
```bash
cd deepsleep-mobile
npm install
npm run web
```

## App Features
- ✅ Sleep tracking
- ✅ Progress charts
- ✅ Mental health assessment
- ✅ Mobile responsive
- ✅ Supabase integration

## Live URL
🌐 **https://deepsleep-mobile.vercel.app**