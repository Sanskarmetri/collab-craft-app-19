# Security Guidelines - StudyBySelf

## Environment Variables

All sensitive credentials are managed through environment variables. Never commit actual values to version control.

### Required Environment Variables

```bash
# .env (DO NOT COMMIT THIS FILE)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id_here
```

### Setup Instructions

1. Copy `.env.example` to `.env`
2. Fill in your actual Supabase credentials
3. Ensure `.env` is in `.gitignore` (it is by default)
4. Never log or expose these values in client code

## Authentication & Authorization

### Row Level Security (RLS)

All database tables have RLS enabled with policies that ensure:
- Users can only access their own data
- INSERT operations are restricted to authenticated users creating their own records
- UPDATE/DELETE operations are restricted to record owners

### JWT Verification

The `ai-chat` edge function requires JWT authentication (`verify_jwt = true`). This ensures:
- Only authenticated users can access AI tutoring
- Usage can be tracked per user
- Rate limiting can be implemented based on subscription tier

## Input Validation

### Client-Side Validation

All user inputs are validated using Zod schemas before submission:
- Email format and length validation
- Password strength requirements (8+ chars, uppercase, lowercase, number)
- Message length limits (max 2000 characters)

### Server-Side Validation

The `ai-chat` edge function validates:
- Message format and role ('user', 'assistant', 'system')
- Message content length (max 2000 chars per message)
- Maximum messages per request (50)
- Valid subject selection (only 7 allowed UPSC subjects)
- Valid language selection ('en' or 'hi')

Invalid requests receive 400 Bad Request responses.

## Rate Limiting & Abuse Prevention

### Current Protections

1. **JWT Authentication Required** - Prevents anonymous abuse
2. **Input Validation** - Prevents oversized or malicious payloads
3. **Error Rate Limiting** - AI Gateway handles rate limits (429 responses)
4. **Cost Protection** - Payment required errors (402) prevent unlimited usage

### Recommended Additions

- Implement per-user request quotas based on subscription tier
- Add Redis-based rate limiting (e.g., 20 requests/hour for free, 200 for premium)
- Track AI token usage per user in analytics table
- Add CAPTCHA for signup to prevent bot registrations

## Data Privacy

### What We Store

- User profiles: name, email (hashed), exam preferences, study preferences
- Study sessions: subject, topic, duration, notes (user-specific)
- Analytics: aggregated study metrics per user
- AI chat: messages are sent to AI gateway but not stored locally

### What We Don't Store

- Raw chat transcripts (unless user explicitly saves)
- Credit card information (handled by payment provider)
- Sensitive personal information beyond study preferences

### User Rights

Users can:
- View all their data through the app
- Update their profile and preferences
- Delete their account (cascade deletes all related data)

## Secrets Management

### Edge Function Secrets

Managed through Supabase dashboard:
- `LOVABLE_API_KEY` - for AI Gateway access (auto-provisioned)
- Additional secrets should be added via Supabase dashboard, not committed to code

### Rotation Policy

If keys are exposed:
1. Immediately rotate in Supabase dashboard
2. Update environment variables in all environments
3. Redeploy edge functions
4. Audit access logs for unauthorized usage

## Security Checklist

### Before Deployment

- [ ] All environment variables use `import.meta.env.VITE_*` pattern
- [ ] No hardcoded credentials in source code
- [ ] `.env` is in `.gitignore` and not committed
- [ ] RLS policies tested and working
- [ ] Input validation on all user-facing endpoints
- [ ] JWT verification enabled on sensitive endpoints
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly (restrict to production domain)

### Regular Maintenance

- [ ] Review and rotate API keys quarterly
- [ ] Monitor error logs for suspicious patterns
- [ ] Update dependencies for security patches
- [ ] Review RLS policies when schema changes
- [ ] Audit user permissions and access logs

## Reporting Security Issues

If you discover a security vulnerability:
1. **Do not** open a public GitHub issue
2. Email security@yourdomain.com with details
3. Include steps to reproduce if applicable
4. Allow time for fix before public disclosure

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Lovable Security Documentation](https://docs.lovable.dev/features/security)
