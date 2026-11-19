# ERAMARINDO PEOPLE ASSESSMENT — Local Auth Integration

## Scope
Static HTML + JavaScript ES modules for the local Development UI. The integration lives under `public/people-assessment/` and does not replace the existing FM-001 Command Center at `public/index.html`.

## Configure
1. In Supabase Auth URL Configuration, set Site URL to `http://localhost:3000`.
2. Add `http://localhost:3000/**` to Additional Redirect URLs.
3. Enable Email provider and email/password sign-in. Keep email confirmation enabled.
4. Copy `public/people-assessment/supabase-config.example.js` to `public/people-assessment/supabase-config.js`.
5. Set the Supabase URL and browser-safe `sb_publishable_...` key. Never use a service_role or secret key in the browser.
6. Serve the repository's public directory at localhost:3000 and open `/people-assessment/`. ES modules require HTTP(S); do not open the file:// URL directly.

## Implemented
- Email/password login
- Email sign-up with confirmation redirect
- PKCE authorization flow and callback code exchange
- Persistent browser session and auth state listener
- Password reset email
- Logout

## Not yet enabled
- Employee identity provisioning
- Role lookup and route guards (requires approved database migration)
- Participant/assessor/HR/director data views
- Assessment database writes
- Production URLs

## Security gates
- Keep RLS enabled and grant only required table privileges.
- Do not assign HR/director roles from user-editable metadata.
- Do not expose service_role keys.
- Test with separate participant, assessor, HR and director accounts before pilot.
- Current database migration remains a draft and must pass security review before application.
