# Environment Variables Setup

To run this application, you need to create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

Create a `.env.local` file in your project root and add these variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Optional Environment Variables

```bash
# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourstartupconnect.com

# TinyMCE (Optional - for rich text editing)
NEXT_PUBLIC_TINYMCE_API_KEY=your_tinymce_api_key

# Admin Configuration (Optional - for superadmin setup)
ADMIN_SECRET=change-this-to-a-secure-secret
```

## OAuth Setup (Google & GitHub)

OAuth credentials are configured in Supabase Dashboard, not environment variables:

1. Go to **Supabase Dashboard** > **Authentication** > **Providers**
2. Enable **Google** provider:
   - Add your Google OAuth Client ID
   - Add your Google OAuth Client Secret
3. Enable **GitHub** provider:
   - Add your GitHub OAuth Client ID
   - Add your GitHub OAuth Client Secret

## How to Get These Values

### Supabase Variables
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret to Supabase Dashboard

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: Your app URL
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase Dashboard

### Email Configuration (Optional)
For Gmail SMTP:
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use your Gmail and the App Password

## Production Environment

For production deployment (Vercel, Netlify, etc.), add these same variables to your hosting platform's environment variables section.

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Verification

After setting up environment variables:

1. Restart your development server: `npm run dev`
2. Check the health endpoint: `http://localhost:3000/api/health`
3. Test OAuth buttons on registration page
4. Verify email functionality (if configured)

## Common Issues

- **OAuth not working**: Check callback URLs in OAuth provider settings
- **Build failing**: Ensure all required variables are set
- **Email not sending**: Verify SMTP credentials and app passwords
- **Supabase errors**: Double-check URL and keys from Supabase dashboard 