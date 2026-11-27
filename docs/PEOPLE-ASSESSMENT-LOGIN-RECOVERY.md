# People Assessment Login Recovery — Operator Checklist

## Verified project
- Supabase project: `rlpkhatlemuhmmzeuzqf` (ACTIVE_HEALTHY)
- Portal: GitHub Pages project path `/eramarindo-federation/`
- Auth identity check: the entered company email has one Auth user, email confirmed, one active `pa_profiles` row, role `human_capital`.
- The account has a previous successful sign-in. This confirms account provisioning, not the current password.

## Required Auth URL allowlist
In Supabase Dashboard → Authentication → URL Configuration:
- Keep the existing Site URL unless the portal is the only application using this project.
- Add the exact portal recovery redirect to Additional Redirect URLs:
  `https://eramarindocorp-emap.github.io/eramarindo-federation/`
- Save the configuration.

The portal uses its current origin and pathname as the reset redirect target. Do not use a wildcard if an exact path is sufficient.

## User recovery steps
1. Deploy the reviewed login-recovery change to GitHub Pages.
2. Open the portal and enter the company email address.
3. Select **Lupa kata sandi?**.
4. Check Inbox and Spam for the Supabase recovery email.
5. Open the recovery link in the same browser and set a new password (12–128 characters).
6. Return to the portal and sign in with the new password.

The portal deliberately returns a generic message to avoid revealing whether an email is registered.

## Security
- No password is read, logged, reset, or changed by the administrator or this code change.
- The user chooses the new password through the one-time Supabase recovery link.
- Browser code contains only the Supabase publishable key. Never put service-role or secret keys in GitHub Pages.
- Keep email confirmation enabled and public signup disabled.
- Continue enforcing authorization in database RLS; hiding a page is not an access-control boundary.

## Remaining operator verification
A failed login cannot be attributed to a wrong password solely from database metadata. Auth logs did not return matching auth/edge events in the queried time window. After deployment, verify with the user's own recovery-email flow and a real browser sign-in.
