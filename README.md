# The AI Intelligence Brief - Newsletter Application

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
│   └── globals.css         # Global styles & CSS variables
├── components/
│   ├── header.tsx          # Navigation header
│   ├── auth-modal.tsx      # Authentication dialog
│   ├── user-menu.tsx       # User dropdown menu
│   ├── newsletter-subscribe.tsx  # Subscription form
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   ├── auth-context.tsx    # Auth state management
│   └── utils.ts            # Utility functions
└── .env.local              # Environment variables
```

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Ensure `.env.local` has all Firebase credentials
   - Enable Google and GitHub authentication in Firebase Console
   - Set up authorized domains and redirect URIs

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Open in Browser**
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
