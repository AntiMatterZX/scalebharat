# Notifications & Email System Setup Guide

This guide will help you set up the complete notifications and email system for ScaleBharat.

## 🗄️ Database Setup

### 1. Run the Notifications SQL Script

Go to your **Supabase Dashboard** → **SQL Editor** and run the following file:

```sql
-- Copy and paste the contents of: supabase/notifications-only.sql
```

This will create:
- ✅ `notifications` table for dashboard notifications
- ✅ RLS policies for secure access
- ✅ Notification functions and triggers
- ✅ Automatic notification creation on startup approvals/rejections

## 📧 Email Configuration

### 2. Set Up Email Environment Variables

Add these to your `.env.local` file:

```env
# SMTP Configuration (Required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# App URL (Required for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `SMTP_PASSWORD`

### 4. Alternative SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## 🔧 System Integration

### 5. Available Notification Types

The system supports these notification types:

- **🎉 Welcome** - New user registration
- **🎯 Match** - New startup/investor matches
- **📅 Meeting** - Meeting confirmations
- **✅ Approval** - Startup profile approved
- **📝 Rejection** - Startup profile needs updates
- **📋 Profile Update** - Profile changes submitted
- **🔔 System** - General system notifications

### 6. How Notifications Work

#### Database Notifications
- Stored in `notifications` table
- Real-time updates via Supabase subscriptions
- Shown in dashboard notification center
- Can be marked as read/unread

#### Email Notifications
- Sent via SMTP using beautiful HTML templates
- Includes all relevant information and action buttons
- Professional branding with ScaleBharat theme

### 7. Notification Sources

Notifications are automatically created for:

1. **User Registration** → Welcome email + dashboard notification
2. **Startup Approval** → Approval email + dashboard notification
3. **Startup Rejection** → Feedback email + dashboard notification
4. **Profile Changes Submitted** → Confirmation email + dashboard notification
5. **New Matches Generated** → Match email + dashboard notification
6. **Meeting Scheduled** → Meeting confirmation email + dashboard notification

## 🚀 Testing the System

### 8. Test Email Configuration

1. Go to `/api/email/test` in your browser
2. Should see email configuration status
3. Fix any issues shown in the response

### 9. Test Notifications

1. **Register a new user** → Should receive welcome email
2. **Submit startup for approval** → Should receive confirmation email
3. **Approve/reject startup** (as admin) → Should receive status email
4. **Check dashboard** → Should see notifications in notification center

## 🎨 UI Components

### 10. Notification Components Available

- **NotificationCenter** - Bell icon with unread count in navbar
- **NotificationBanner** - High-priority alerts on dashboard
- **NotificationList** - Full notification management interface

### 11. Real-time Features

- **Live Updates** - Notifications appear instantly
- **Unread Count** - Updates in real-time
- **Auto-refresh** - Notification list updates automatically

## 🔍 Troubleshooting

### Common Issues

#### "Error fetching notifications: {}"
- **Cause**: Notifications table doesn't exist
- **Solution**: Run the SQL script in Supabase

#### Email not sending
- **Cause**: SMTP configuration issues
- **Solution**: Check environment variables and SMTP credentials

#### Build warnings about sendEmail import
- **Cause**: TypeScript cache issues
- **Solution**: Restart TypeScript server or rebuild

### Debug Steps

1. **Check Database**: Verify `notifications` table exists in Supabase
2. **Check Environment**: Verify all SMTP variables are set
3. **Test SMTP**: Use `/api/email/test` endpoint
4. **Check Logs**: Look for error messages in console/terminal

## 📋 Environment Variables Checklist

Make sure you have all these set:

- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASSWORD`
- [ ] `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎯 Next Steps

After setup:

1. **Run the SQL script** to create notifications table
2. **Configure SMTP** with your email provider
3. **Test the system** with a new user registration
4. **Customize email templates** if needed (in `lib/email/templates/`)
5. **Monitor notifications** in production

## 🆘 Support

If you encounter issues:

1. Check the console for error messages
2. Verify database setup in Supabase
3. Test email configuration
4. Check environment variables

The system is designed to fail gracefully - if emails fail, database notifications will still work, and vice versa.
