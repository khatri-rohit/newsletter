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
│   └── utils.ts            # Utility functions
├── services/
│   ├── email.service.ts           # Email sending (Nodemailer)
│   ├── email-queue.service.ts     # Email queue with retry logic
│   ├── email-tracking.service.ts  # Delivery tracking & analytics
│   ├── newsletter.service.ts      # Newsletter CRUD operations
│   └── user.service.ts            # User & subscriber management
├── docs/
│   ├── EMAIL_SYSTEM.md            # Email system documentation
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
   # See ENV_TEMPLATE.md for all available options
   ```

   **Required for Email Notifications**:
   - `GMAIL_HOST`: SMTP server (e.g., smtp.gmail.com)
   - `GMAIL_USER`: Your email address
   - `GMAIL_PASSWORD`: App password or SMTP password
   - `NEXT_PUBLIC_APP_URL`: Your application URL

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
