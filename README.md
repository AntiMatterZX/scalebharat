# ScaleBharat - Startup-Investor Matching Platform

A comprehensive platform connecting startups with investors, built with Next.js 14, Supabase, and TypeScript.

## Features

- **Startup Profiles**: Complete startup profiles with team, documents, and financial information
- **Investor Profiles**: Detailed investor profiles with investment preferences and portfolio
- **Smart Matching**: AI-powered matching algorithm between startups and investors
- **Meeting Scheduler**: Integrated calendar system for scheduling meetings
- **Analytics Dashboard**: Comprehensive analytics for both startups and investors
- **Admin Panel**: Complete admin interface for managing users and content
- **Real-time Notifications**: Live updates for matches, messages, and meetings
- **Document Management**: Secure document upload and sharing system

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS, CSS Variables
- **State Management**: React Hooks, Context API
- **Authentication**: Supabase Auth with OAuth providers
- **Database**: PostgreSQL with Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scalebharat
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials and other required environment variables.

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Required SQL Scripts

After setting up your Supabase project, run these SQL scripts in order:

1. **Main Schema**: Run `supabase/production-schema.sql` or `supabase/complete-setup.sql`
2. **User Roles**: Run `supabase/user-roles.sql`
3. **Analytics Functions**: Run `supabase/enhanced-analytics-functions.sql`
4. **Pending Edits System**: Run `supabase/startup-pending-edits.sql`

### Quick Database Setup

To set up the pending edits system (if you're getting "Failed to fetch pending edits" errors):

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/startup-pending-edits.sql`
4. Run the script

This will create the necessary tables for the startup profile editing system:
- `startup_pending_edits`
- `startup_team_members_pending` 
- `startup_documents_pending`

## Project Structure

```
scalebharat/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── investor/          # Investor-specific pages
│   ├── startup/           # Startup-specific pages
│   └── admin/             # Admin panel
├── components/            # Reusable React components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   └── forms/            # Form components
├── lib/                   # Utility functions and configurations
│   ├── hooks/            # Custom React hooks
│   ├── email/            # Email templates and utilities
│   └── supabase/         # Supabase client configurations
├── supabase/             # Database schemas and migrations
├── types/                # TypeScript type definitions
└── styles/               # Global styles and CSS
```

## Key Features

### Authentication & User Management
- OAuth integration (Google, LinkedIn)
- Role-based access control (Startup, Investor, Admin)
- Profile completion workflows
- Email verification system

### Startup Features
- Comprehensive profile creation
- Team member management
- Document upload and sharing
- Financial information tracking
- Analytics dashboard
- Pending edits system for profile changes

### Investor Features
- Investment preferences setup
- Portfolio management
- Startup discovery and filtering
- Analytics and reporting
- Meeting scheduling

### Admin Features
- User management
- Content moderation
- Analytics overview
- System configuration
- Bulk operations

### Matching System
- AI-powered compatibility scoring
- Industry and stage-based filtering
- Investment amount matching
- Geographic preferences
- Real-time match notifications

## Development

### Code Style
- ESLint and Prettier configured
- TypeScript strict mode enabled
- Tailwind CSS for styling
- Component-based architecture

### Database
- PostgreSQL with Row Level Security
- Real-time subscriptions
- Optimized queries with proper indexing
- Comprehensive audit logging

### Performance
- Next.js 14 App Router
- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Image optimization
- Caching strategies

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Storage buckets created
- [ ] RLS policies enabled
- [ ] Email templates configured
- [ ] OAuth providers configured
- [ ] Domain and SSL configured

### Vercel Deployment
The project is optimized for Vercel deployment with proper configuration in `vercel.json`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the GitHub issues
- Review the documentation
- Contact the development team

## License

This project is proprietary and confidential.