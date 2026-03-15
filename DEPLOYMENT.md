# Deployment to Vercel

This guide walks you through deploying the DeepSleep React Native Web app to Vercel.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional) - `npm install -g vercel`
3. **GitHub/GitLab Account** (for automatic deployments)

## Deployment Methods

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   cd deepsleep-mobile
   
   # For preview deployment
   npm run deploy:preview
   
   # For production deployment
   npm run deploy:vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy: `Y`
   - Which scope: Choose your account
   - Link to existing project: `N`
   - What's your project's name: `deepsleep-mobile`
   - In which directory: `.`
   - Override settings: `N`

### Method 2: Vercel Dashboard (Web UI)

1. **Push to GitHub/GitLab**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/deepsleep-mobile.git
   git push -u origin main
   ```

2. **Import Project in Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import from GitHub/GitLab
   - Select your repository
   - Configure project:
     - Framework Preset: **Expo**
     - Root Directory: `.`
     - Build Command: `npm run build:web`
     - Output Directory: `web-build`
     - Install Command: `npm install`

3. **Configure Environment Variables**:
   Add these in Vercel project settings:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://txfqmyfmdzfpfufaupaf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnFteWZtZHpmcGZ1ZmF1cGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA5ODEsImV4cCI6MjA4Nzk0Njk4MX0.e9EoL07FGSDMM2l5OE07k7mY3loPkR-xLow2skYmC4A
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://deepsleep-mobile.vercel.app`

### Method 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/deepsleep-mobile&env=EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_ANON_KEY&project-name=deepsleep-mobile&repository-name=deepsleep-mobile)

## Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://txfqmyfmdzfpfufaupaf.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Build Configuration

Vercel will automatically:
1. Install dependencies with `npm install`
2. Build the web version with `expo build:web`
3. Serve from the `web-build` directory
4. Handle client-side routing with rewrites

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `deepsleep.app`)
4. Follow DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Build fails with Expo errors**
   - Ensure you're using Node.js 18+
   - Clear cache: `expo start --clear`
   - Update Expo: `expo upgrade`

2. **Supabase connection errors**
   - Verify environment variables are set correctly
   - Check Supabase project is active
   - Ensure CORS is configured in Supabase

3. **Routing issues**
   - The `vercel.json` file includes rewrites for client-side routing
   - Ensure all internal links use React Navigation

4. **Asset loading errors**
   - Check that all images are properly imported
   - Verify webpack configuration in `app.json`

### Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Logs**: View deployment logs in Vercel dashboard
- **Performance**: Use Lighthouse for web vitals

## Post-Deployment

1. **Test the deployment**:
   - Open your Vercel URL
   - Test all features (login, sleep logging, etc.)
   - Check mobile responsiveness

2. **Set up monitoring**:
   - Enable Vercel Analytics
   - Set up error tracking (Sentry, etc.)
   - Monitor performance metrics

3. **Configure CI/CD**:
   - Connect to GitHub for automatic deployments
   - Set up preview deployments for PRs
   - Configure branch protection rules

## Support

For deployment issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Expo web deployment guide: [docs.expo.dev/distribution/publishing-websites](https://docs.expo.dev/distribution/publishing-websites)
3. Supabase deployment guide: [supabase.com/docs/guides/deployment](https://supabase.com/docs/guides/deployment)