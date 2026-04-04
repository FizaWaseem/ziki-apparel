@echo off
REM Ziki Apparel Quick Deployment Script for Windows

echo 🚀 Ziki Apparel Deployment Assistant
echo ====================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI is already installed
)

REM Check if user is logged in to Vercel
echo.
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Vercel:
    vercel login
) else (
    echo ✅ Already logged in to Vercel
)

REM Build the project
echo.
echo 🔨 Building project...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
) else (
    echo ❌ Build failed. Please fix errors and try again.
    pause
    exit /b 1
)

REM Deploy to Vercel
echo.
echo 🚀 Deploying to Vercel...
echo Note: You'll need to set environment variables in Vercel dashboard
echo Required variables:
echo - DATABASE_URL
echo - NEXTAUTH_URL
echo - NEXTAUTH_SECRET
echo - EMAIL_USER
echo - EMAIL_PASS
echo - STRIPE_SECRET_KEY
echo - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo.

pause

vercel --prod

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Deployment successful!
    echo Your Ziki Apparel webapp is now live!
    echo.
    echo Next steps:
    echo 1. Set environment variables in Vercel dashboard
    echo 2. Test all features on your live site
    echo 3. Set up your production database
    echo 4. Configure your email service
    echo 5. Switch to Stripe live keys when ready
    echo.
    echo 📚 Check LAUNCH_CHECKLIST.md for detailed post-deployment steps
) else (
    echo ❌ Deployment failed. Please check the error messages above.
)

pause