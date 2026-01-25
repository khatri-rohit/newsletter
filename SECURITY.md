# ==========================================

# SECURITY BEST PRACTICES

# ==========================================

# Security Best Practices for Low Noise Newsletter

## Overview

This document outlines security best practices, threat models, and security considerations for the Low Noise newsletter application.

---

## 🔐 Authentication & Authorization

### Current Implementation

#### Authentication

- **Provider**: Firebase Authentication
- **Methods**: Google OAuth, GitHub OAuth
- **Token Management**: JWT tokens with automatic refresh
- **Session Duration**: Default Firebase session (1 hour with auto-refresh)

#### Authorization

- **Role-Based Access Control (RBAC)**
  - **User Role**: Default for all authenticated users
  - **Admin Role**: Set via Firebase Custom Claims

### Best Practices

1. **Never trust client-side role checks**

   ```typescript
   // ❌ BAD - Client-side check only
   if (isAdmin) {
     // show admin features
   }

   // ✅ GOOD - Server-side verification
   const idToken = await user.getIdToken();
   const response = await fetch('/api/admin/action', {
     headers: { Authorization: `Bearer ${idToken}` },
   });
   ```

2. **Always verify tokens on server**

   ```typescript
   // Server-side API route
   const token = request.headers.get('Authorization')?.replace('Bearer ', '');
   const decodedToken = await admin.auth().verifyIdToken(token);

   if (decodedToken.role !== 'admin') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```

3. **Implement token refresh**
   - Firebase handles this automatically
   - Tokens expire after 1 hour
   - Client SDK automatically refreshes

---

## 🛡️ Input Validation & Sanitization

### Current Implementation

All user inputs are validated using **Zod schemas** before processing.

#### Example: Email Validation

```typescript
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();
```

### Best Practices

1. **Always validate on server-side**
   - Client validation is UX, not security
   - Server validation is mandatory

2. **Sanitize HTML content**

   ```typescript
   import { sanitizeHtml } from '@/lib/validation';

   const cleanContent = sanitizeHtml(userInput);
   ```

3. **Use parameterized queries**
   - Firestore automatically prevents injection
   - Never concatenate user input into queries

4. **Validate file uploads**

   ```typescript
   // Check file type
   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
     throw new Error('Invalid file type');
   }

   // Check file size (e.g., 5MB)
   if (file.size > 5 * 1024 * 1024) {
     throw new Error('File too large');
   }
   ```

---

## 🚫 Rate Limiting

### Current Implementation

Custom rate limiter with configurable limits per endpoint:

| Endpoint    | Limit       | Window     |
| ----------- | ----------- | ---------- |
| General API | 30 requests | 1 minute   |
| Subscribe   | 5 requests  | 1 hour     |
| Auth        | 10 requests | 15 minutes |

### Best Practices

1. **Different limits for different endpoints**
   - Public endpoints: Lower limits
   - Authenticated endpoints: Higher limits
   - Admin endpoints: Highest limits

2. **IP-based limiting**

   ```typescript
   const ip = request.headers.get('x-forwarded-for') || 'unknown';
   const rateLimitResult = apiLimiter.check(30, ip);
   ```

3. **Return proper headers**
   ```typescript
   return NextResponse.json(data, {
     headers: {
       'X-RateLimit-Limit': '30',
       'X-RateLimit-Remaining': remaining.toString(),
       'Retry-After': '60',
     },
   });
   ```

---

## 🔒 Data Protection

### Environment Variables

1. **Never commit secrets to git**

   ```bash
   # .gitignore
   .env.local
   .env*.local
   ```

2. **Use environment variable validation**

   ```typescript
   if (!process.env.FIREBASE_PRIVATE_KEY) {
     throw new Error('Missing FIREBASE_PRIVATE_KEY');
   }
   ```

3. **Different secrets for each environment**
   - Development
   - Staging
   - Production

### Database Security

1. **Firestore Security Rules**

   ```javascript
   // Example production rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Subscribers: Write for authenticated or public subscribe endpoint
       match /subscribers/{subscriberId} {
         allow read: if request.auth != null && request.auth.token.role == 'admin';
         allow write: if request.auth != null || isValidSubscribeRequest();
       }

       // Newsletters: Read for all, write for admins only
       match /newsletters/{newsletterId} {
         allow read: if resource.data.status == 'published' ||
                        (request.auth != null && request.auth.token.role == 'admin');
         allow write: if request.auth != null && request.auth.token.role == 'admin';
       }
     }
   }
   ```

2. **Data encryption**
   - Data at rest: Firebase encrypts by default
   - Data in transit: HTTPS only
   - Sensitive fields: Consider additional encryption

---

## 🌐 Network Security

### HTTPS Enforcement

1. **Security headers** (already configured in `next.config.ts`)
   - HSTS: Force HTTPS for 2 years
   - X-Frame-Options: Prevent clickjacking
   - X-Content-Type-Options: Prevent MIME sniffing

2. **Redirect HTTP to HTTPS**
   ```typescript
   // In production, use reverse proxy (Nginx, Vercel automatic)
   if (request.headers.get('x-forwarded-proto') !== 'https') {
     return NextResponse.redirect(`https://${request.headers.get('host')}${request.url}`);
   }
   ```

### CORS Configuration

```typescript
// For API routes that need CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
```

---

## 🎯 XSS Prevention

### Current Protections

1. **React's built-in escaping**
   - React escapes by default
   - Only use `dangerouslySetInnerHTML` when necessary

2. **HTML sanitization**

   ```typescript
   // For newsletter content
   const cleanHtml = sanitizeHtml(content);
   ```

3. **CSP Headers** (Content Security Policy)
   ```typescript
   // Add to next.config.ts
   {
     key: 'Content-Security-Policy',
     value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
   }
   ```

---

## 🔐 CSRF Protection

### Next.js Built-in Protection

- Next.js API routes have CSRF protection by default
- SameSite cookies
- Origin checking

### Additional Measures

1. **Use POST for state-changing operations**

   ```typescript
   // ❌ Don't use GET for deletes
   GET /api/delete?id=123

   // ✅ Use POST/DELETE
   DELETE /api/resource/123
   ```

2. **Validate Origin header**

   ```typescript
   const origin = request.headers.get('origin');
   const allowedOrigins = [process.env.NEXT_PUBLIC_BASE_URL];

   if (!allowedOrigins.includes(origin)) {
     return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
   }
   ```

---

## 🚨 Security Monitoring

### Logging

1. **Log security events**

   ```typescript
   logger.warn('Failed login attempt', {
     email: email,
     ip: getClientIP(request),
     timestamp: new Date().toISOString(),
   });
   ```

2. **Never log sensitive data**
   - ❌ Passwords
   - ❌ API keys
   - ❌ Private keys
   - ❌ Full credit card numbers

### Error Handling

1. **Generic error messages to users**

   ```typescript
   // ❌ BAD - Exposes internal details
   return NextResponse.json({
     error: 'Database connection failed: Connection timeout to 10.0.0.5:3306',
   });

   // ✅ GOOD - Generic message
   return NextResponse.json({
     error: 'An error occurred. Please try again later.',
   });
   ```

2. **Detailed logging internally**
   ```typescript
   logger.error('Database connection failed', error, {
     host: dbHost,
     user: dbUser,
     // Don't log password!
   });
   ```

---

## 📋 Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] Firestore security rules configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (no sensitive data logged)
- [ ] Dependencies updated and scanned

### Post-Deployment

- [ ] Monitor failed authentication attempts
- [ ] Review security logs regularly
- [ ] Set up alerts for unusual activity
- [ ] Regular security audits
- [ ] Dependency updates monthly
- [ ] Backup and recovery tested

---

## 🛠️ Security Tools

### Recommended Tools

1. **Dependency Scanning**

   ```bash
   npm audit
   npm audit fix
   ```

2. **OWASP ZAP** (Web application security scanner)

3. **Snyk** (Vulnerability scanning)

4. **Helmet.js** (Security headers for Express)

---

## 🆘 Incident Response Plan

### 1. Detection

- Monitor error rates
- Check security logs
- User reports

### 2. Containment

- Identify affected systems
- Isolate compromised components
- Rate limit aggressive IPs

### 3. Eradication

- Remove vulnerabilities
- Deploy patches
- Update dependencies

### 4. Recovery

- Restore from backups if needed
- Verify system integrity
- Monitor for recurrence

### 5. Post-Incident

- Document incident
- Update security measures
- Team debrief

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [CSP Generator](https://report-uri.com/home/generate)

---

**Last Updated**: January 26, 2026
**Next Review**: February 26, 2026
