# The Low Noise - Newsletter Application

A modern, production-grade newsletter application built with Next.js 16, Firebase, and shadcn/ui. Features a minimal, distinctive design with Google and GitHub authentication.

## 🎨 Design Philosophy

This application follows strict anti-"AI slop" principles:

- **Distinctive Typography**: Newsreader (serif) for elegance, IBM Plex Mono for code
- **Minimal Color Palette**: Pure black/white with subtle grays - no purple gradients
- **True Light/Dark Mode**: Properly designed for both themes, not dark-only
- **Brutalist Elements**: Sharp borders, squared corners, numbered sections
- **Restrained Motion**: Subtle hover states, no excessive animations
- **Content-First**: Clean hierarchy, generous whitespace, readable typography

### What We Avoid

- Generic fonts (Inter, Space Grotesk, Roboto)
- Clichéd purple/violet gradients
- Excessive rounded corners and shadows
- Cookie-cutter layouts
- Predictable component patterns

## ✨ Features

### Authentication

- ✅ Google OAuth integration
- ✅ GitHub OAuth integration
- ✅ Persistent user sessions
- ✅ User profile dropdown with avatar
- ✅ Secure sign-out functionality

### Newsletter Subscription

- ✅ Email validation
- ✅ Firestore integration for subscriber management
- ✅ Duplicate email detection
- ✅ Success/error feedback with animations
- ✅ Responsive form design

### 📧 Enterprise Email Notification System

- ✅ **Automated Newsletter Distribution**: Sends beautiful emails to all active subscribers when newsletter is published
- ✅ **Smart Queue Management**: Sends emails one-by-one with 10-second intervals to ensure deliverability
- ✅ **Retry Logic**: Automatic retry with exponential backoff (up to 3 attempts)
- ✅ **Bounce Handling**: Detects and handles bounced emails, updates subscriber status
- ✅ **Delivery Tracking**: Comprehensive tracking of sent, delivered, opened, clicked, bounced, and failed emails
- ✅ **Analytics Dashboard**: Real-time stats on delivery rates, open rates, click rates, and more
- ✅ **Professional Templates**: Responsive HTML emails with your logo, newsletter preview, and clear CTAs
- ✅ **Background Processing**: Non-blocking API responses with real-time progress monitoring
- ✅ **Error Handling**: Detailed logging with correlation IDs for debugging
- ✅ **Scalability**: Configurable batch sizes and delays for any volume

📚 **Full Documentation**: See [docs/EMAIL_SYSTEM.md](docs/EMAIL_SYSTEM.md) and [docs/PRE_DEPLOYMENT.md](docs/PRE_DEPLOYMENT.md)

### ⏰ Scheduled Newsletter Publishing (Cron Jobs)

- ✅ **Automated Publishing**: Scheduled newsletters are automatically published at 9:00 AM daily
- ✅ **Vercel Cron Jobs**: Serverless cron job runs daily to check for scheduled newsletters
- ✅ **Smart Scheduling**: Admin can schedule newsletters for future publication with date/time picker
- ✅ **Email Delivery**: Automatically sends emails to all subscribers when scheduled newsletter is published
- ✅ **Comprehensive Logging**: Detailed logs with correlation IDs for monitoring and debugging
- ✅ **Error Recovery**: Graceful error handling with retry logic for failed deliveries
- ✅ **Status Tracking**: Real-time status updates for scheduled, published, and delivered newsletters
- ✅ **Secure Authorization**: Cron endpoint protected with secret token

📚 **Full Documentation**: See [docs/CRON_JOBS.md](docs/CRON_JOBS.md)

### ⚡ Redis Caching System

- ✅ **Server-Side Caching**: Redis-backed caching for improved performance and scalability
- ✅ **Automatic Cache Invalidation**: Cache automatically clears when newsletters are created, updated, or deleted
- ✅ **Smart Fallback**: Gracefully falls back to in-memory cache if Redis is unavailable
- ✅ **Configurable TTL**: Different cache durations for different data types
- ✅ **Pattern-Based Invalidation**: Efficiently invalidates related cache entries
- ✅ **Cache Headers**: HTTP cache headers for CDN and browser caching
- ✅ **Newsletter Caching**: Individual newsletters, lists, and top newsletters cached for fast retrieval
- ✅ **View Tracking**: Non-blocking view increment with deduplication

**Cache Strategy**:

- Individual newsletters: 5 minutes TTL
- Newsletter lists: 5 minutes TTL
- Top newsletters: 10 minutes TTL
- Cache invalidates on: create, update, delete, publish operations

### UI Components

- ✅ Production-grade shadcn/ui components
- ✅ Custom-styled authentication modal
- ✅ Responsive header with navigation
- ✅ Hero section with animated gradients
- ✅ Feature cards with hover effects
- ✅ Mobile-responsive design

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Authentication**: Firebase Auth (Google & GitHub providers)
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Newsreader (serif), IBM Plex Mono (monospace)

## 📦 Project Structure

```
newsletter/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage with hero & features
│   ├── globals.css         # Global styles & CSS variables
│   ├── admin/              # Admin dashboard
│   │   └── post/           # Newsletter creation/editing
│   └── api/                # API routes
│       ├── newsletters/    # Newsletter CRUD & publish
│       ├── subscribe/      # Email subscription
│       └── user/           # User management
├── components/
│   ├── header.tsx          # Navigation header
│   ├── auth-modal.tsx      # Authentication dialog
│   ├── user-menu.tsx       # User dropdown menu
│   ├── newsletter-subscribe.tsx  # Subscription form
│   ├── rich-text-editor.tsx      # TipTap editor
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   ├── auth-context.tsx    # Auth state management
│   ├── redis.ts            # Redis client & connection management
│   ├── cache.ts            # Redis-backed caching utility
│   └── utils.ts            # Utility functions
├── services/
│   ├── email.service.ts           # Email sending (Nodemailer)
│   ├── email-queue.service.ts     # Email queue with retry logic
│   ├── email-tracking.service.ts  # Delivery tracking & analytics
│   ├── newsletter.service.ts      # Newsletter CRUD operations
│   └── user.service.ts            # User & subscriber management
├── docs/
│   ├── EMAIL_SYSTEM.md            # Email system documentation
│   ├── CRON_JOBS.md               # Scheduled publishing documentation
│   └── PRE_DEPLOYMENT.md          # Deployment checklist
├── public/
│   └── lownoise.png               # Logo for emails
└── .env.local              # Environment variables (see ENV_TEMPLATE.md)
```

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment Variables**

   Copy the environment template and configure:

   ```bash
   # Copy the example file
   cp .env.example .env.local

   # Edit .env.local with your credentials
   # See .env.example for all available options
   ```

   **Required Environment Variables**:
   - `FIREBASE_*`: Firebase Admin credentials
   - `GMAIL_*`: Email service configuration
   - `CRON_SECRET`: Secret token for cron job authorization (generate with: `openssl rand -hex 32`)
   - `NEXT_PUBLIC_BASE_URL`: Your application URL
   - `REDIS_*`: Redis server configuration (host, port, username, password)

   📚 **Setup Guide**: See [docs/PRE_DEPLOYMENT.md](docs/PRE_DEPLOYMENT.md) for detailed configuration

3. **Configure Firebase**
   - Ensure `.env.local` has all Firebase credentials
   - Enable Google and GitHub authentication in Firebase Console
   - Set up authorized domains and redirect URIs

4. **Run Development Server**

   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3000`

## 🔐 Firebase Setup

### Authentication Providers

**Google OAuth:**

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add authorized domains

**GitHub OAuth:**

1. Create GitHub OAuth App: https://github.com/settings/developers
2. Set Authorization callback URL: `https://<project-id>.firebaseapp.com/__/auth/handler`
3. Copy Client ID and Client Secret to Firebase Console
4. Enable GitHub provider in Firebase

### Firestore Database

Create a `subscribers` collection with the following structure:

```javascript
{
  email: string,
  subscribedAt: timestamp,
  status: string
}
```

## 🎯 Key Features

- **AuthProvider**: Global authentication state management
- **Newsletter Subscribe**: Production-grade form with validation
- **Header Component**: Responsive navigation with auth states
- **Creative Design**: Unique gradients and typography

## 📱 Responsive Design

- Mobile: Single column layout
- Tablet: 2-column feature grid
- Desktop: 3-column feature grid

---

Built with ❤️ using Next.js, Firebase, and shadcn/ui

# newsletter
