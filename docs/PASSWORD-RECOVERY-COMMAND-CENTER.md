# Command Center Password Recovery

## Recovery redirect

Supabase Auth recovery links use the Command Center origin configured in the project's Auth URL allowlist. The Command Center recognises the Supabase implicit recovery callback (`#access_token=...&type=recovery`) and immediately removes the fragment from the address bar before displaying the password form.

The access token remains only in page memory. It is never written to local storage, session storage, cookies, URL parameters, application logs, or Git.

## Password update

The browser posts the new password and the one-time user access token to the same-origin endpoint:

- `POST /api/auth/recovery/password`
- The server validates request size, bearer-token shape, and a 12–128 character password.
- The server forwards the access token to Supabase Auth `PUT /auth/v1/user`.
- The server-side Supabase secret key is used only as the `apikey` header. It is never returned to the browser.
- Supabase validates the signed user session and authorizes the password update for that user.
- Tokens and password values are never logged.

The endpoint requires the existing server environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`

If these are absent, the endpoint returns an explicit configuration error without attempting an update.

## Operator verification

1. Ensure the Supabase Production Auth Site URL / Additional Redirect URLs include the Command Center origin.
2. Confirm the Command Center deployment has the server-side Supabase URL and secret key configured.
3. Request one recovery email for an existing Auth user.
4. Open the recovery email. The Command Center must show **Buat password baru**.
5. Enter a matching password of 12–128 characters.
6. Confirm the page shows **Password berhasil diperbarui**.
7. Sign in to the intended application with the new password.

Never share the full recovery URL or its access token. If the link expires, request a new one after the page is deployed.
