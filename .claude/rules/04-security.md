# Security Rules (Always Applied)

## Input Validation

- Validate ALL user input at boundaries
- Use Zod schemas for validation
- Never trust client-side validation alone

## Authentication

- Use established libraries (Passport, next-auth)
- Hash passwords with bcrypt (cost ≥ 12)
- JWT: RS256 preferred, short expiry with refresh

## Authorization

- Check permissions on every protected route
- Deny by default, allow explicitly
- Use middleware, not per-route checks

## Secrets

- **NEVER** commit secrets to git
- Use `.env` files (gitignored)
- Reference: `.env.example` for required vars
- Production: Use secret managers

## SQL/NoSQL Injection

- Parameterized queries ONLY
- Never interpolate user input
- Use ORM query builders

## XSS Prevention

- React escapes by default (keep it that way)
- Sanitize if rendering user HTML
- Set CSP headers in production

## CSRF Protection

- Use CSRF tokens for state-changing requests
- SameSite cookies
- Verify Origin header

## Dependencies

- Run `pnpm audit` before adding new deps
- Pin versions in production
- Review security advisories

## Logging

- **NEVER** log: passwords, tokens, API keys, PII
- Use structured logging
- Mask sensitive fields

## Files to Never Read/Write

- `.env*` (except `.env.example`)
- `*.pem`, `*.key`
- `secrets/`, `credentials/`
