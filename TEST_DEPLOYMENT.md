# 🧪 Test Deployment Locally

Before deploying to Vercel, test the app locally to ensure everything works.

## Quick Local Test

```bash
cd deepsleep-mobile

# Install dependencies
npm install

# Start the web app
npm run web
```

Open: http://localhost:8080

## Verify These Features Work:

### 1. **Home Screen** (`/`)
- [ ] App loads without errors
- [ ] Navigation bar appears
- [ ] Sleep summary displays
- [ ] Quick action buttons work

### 2. **Authentication** (`/login`)
- [ ] Login page loads
- [ ] Signup page loads
- [ ] Can create new account
- [ ] Can login with existing account

### 3. **Sleep Logging** (`/log`)
- [ ] Sleep log form displays
- [ ] Can submit sleep data
- [ ] Data appears in list

### 4. **Progress Tracking** (`/progress`)
- [ ] Charts load without errors
- [ ] Sleep statistics display
- [ ] Date range selector works

### 5. **Onboarding** (`/onboarding`)
- [ ] Multi-step form works
- [ ] Country selection works
- [ ] Medication input works
- [ ] Form submits successfully

### 6. **Learn Section** (`/learn`)
- [ ] Articles display
- [ ] Resources list shows
- [ ] External links work

### 7. **Profile** (`/profile`)
- [ ] User info displays
- [ ] Settings toggles work
- [ ] Sign out works

## Common Issues & Fixes

### Issue: "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start --clear
```

### Issue: "Supabase connection error"
1. Check `.env` file exists with correct values
2. Verify Supabase project is active
3. Check network connection

### Issue: "Navigation errors"
```bash
# Clear navigation cache
expo start --clear
```

### Issue: "Build fails"
```bash
# Update Expo
expo upgrade

# Clear build cache
expo build:web --clear
```

## Production Readiness Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All imports are correct
- [ ] Environment variables are set

### Performance
- [ ] App loads in under 3 seconds
- [ ] Images are optimized
- [ ] No memory leaks
- [ ] Smooth animations

### Security
- [ ] API keys are in environment variables
- [ ] No sensitive data in code
- [ ] Supabase RLS policies are active
- [ ] Authentication works correctly

### Mobile Responsiveness
- [ ] Works on mobile browsers
- [ ] Touch targets are appropriate
- [ ] No horizontal scrolling
- [ ] Font sizes are readable

## Final Test Before Deployment

```bash
# Build the web version
npm run build:web

# Check build output
ls -la web-build/

# Test the built version locally
npx serve web-build
```

Open: http://localhost:3000

## Ready for Vercel! 🚀

If all tests pass, your app is ready for production deployment to Vercel.

**Deployment Command:**
```bash
vercel --prod
```

Or use the Vercel dashboard at: https://vercel.com/new