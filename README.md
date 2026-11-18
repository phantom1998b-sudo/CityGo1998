# City Go Captain

An Arabic, right-to-left captain app for passenger and goods transport. This is a **Vite + TypeScript multi-page application**, not a Next.js project. It includes a captain dashboard, authentication and registration screens, an admin console, Supabase-backed data, and a basic installable PWA.

## Requirements

- Node.js 20 or newer
- A Supabase project for authenticated and data-backed functionality

## Local development

1. Install dependencies with `npm ci`.
2. `.env.local` is ignored by Git. If it does not exist, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_VAPID_PUBLIC_KEY`. Do not overwrite an existing `.env.local` containing your credentials.
3. Start the development server with `npm run dev`.
4. Open `http://127.0.0.1:5173`.

The user dashboard is `/`; the authentication and admin entry points are `/auth` and `/admin` (also available at `/auth/index.html` and `/admin/index.html`). A working Supabase project and approved captain session are required to use the dashboard. The admin interface also checks the authenticated account's database role.

The browser-side `@supabase/supabase-js` client is the correct integration for this Vite application. `@supabase/ssr` is intended for server-rendered frameworks and is not used here.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite server |
| `npm run lint` | Type-check the TypeScript sources |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build on port 4173 |

## Supabase

Database migrations are in `supabase/migrations/`; the push notification Edge Function is in `supabase/functions/push-new-order/`. Apply migrations `001` through `014` to the intended Supabase project in order after reviewing the schema. Migrations 007 and 008 require the existing `public.profiles(id,email,role)` table. Migration 008 provisions a captain record on signup and for existing profile-based administrators. Migration 009 fixes retrying an incomplete registration without allowing the captain to change protected submission timestamps. Migration 010 fixes the captain approval trigger so its wallet update runs after the original captain update completes. Migration 011 allows the trusted wallet-transaction trigger to update balances without granting captains permission to edit protected balance fields themselves. Migration 012 runs order acceptance's wallet entries under a restricted security-definer trigger, avoiding the captain-facing wallet-transaction insert policy. Migration 013 restores admin authorization to the canonical `profiles.role` field while requiring the requested ID to match the authenticated user. Migration 014 permits authenticated administrators to cancel accepted orders while continuing to block captain-initiated cancellation.

The app's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are browser configuration. A publishable key is designed for browser use; **RLS must protect the data**. The Edge Function separately requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and optionally `VAPID_SUBJECT` as Supabase function secrets. Never put a service-role key, VAPID private key, or database password in a `VITE_*` variable or commit it to Git.

The currently configured Supabase project has had migrations `001`–`008` applied manually in the Dashboard SQL Editor. Migrations `009_registration_retry_protected_fields.sql`, `010_captain_approval_trigger_order.sql`, `011_wallet_transaction_protected_balance.sql`, `012_order_acceptance_wallet_security_definer.sql`, and `014_allow_admin_order_cancellation.sql` have also been applied manually there. Apply `013_admin_role_source_consistency.sql` manually to the same project to restore admin verification against the canonical `profiles.role` field. Migration 014 allows the verified admin to perform the order cancellation guarded by the database trigger. Its CLI migration history has not yet been reconciled, so **do not run `supabase db push` or the Supabase GitHub Actions workflow against this project** until you inspect `supabase_migrations.schema_migrations` and reconcile the manually applied migrations. Otherwise, the CLI may try to apply already-existing schema changes again.

For reference, inspect the linked project's migration history before any future CLI migration:

```powershell
npx supabase login
npx supabase link --project-ref iknvsjnskovhbmzgxmul
npx supabase migration list --linked
```

Only after reconciling that history should you run `npx supabase db push`. On a new, empty Supabase project, review and apply migrations `001`–`014` in order; migration `001` creates the core captain and order tables. The REST API must expose `public.captains` before the application can load profiles or accept registration. After migration, verify `select to_regclass('public.captains');` in SQL Editor and reload the API schema with `NOTIFY pgrst, 'reload schema';` if PostgREST still reports a stale schema. Captain sign-in uses an internal email derived from the Jordanian phone number, so email confirmation is disabled in this project's Supabase Auth settings; synthetic `@captain.local` addresses cannot receive verification messages. Existing auth users whose signup was interrupted can select **Create account** and resubmit the same phone/password with their registration details after migrations are applied.

If Supabase reports that the table is missing or the schema cache is stale, check `select to_regclass('public.captains');` in the SQL Editor, review the migrations against the existing database, then reload the API schema with `NOTIFY pgrst, 'reload schema';`. Do not push migrations blindly into a populated project.

Administrator access is authorized by `public.profiles.role = 'admin'`, matching the signed-in Supabase user by `id`. Migration `007_profiles_admin_authorization.sql` updates the database `is_admin` function used by admin RPCs and RLS policies to use the same source of truth. Migration 008 supplies a matching admin row in `captains` for existing admin RPC foreign keys. Apply migrations after reviewing the existing schema; never grant admin roles from the browser.

Deploy `push-new-order` only after setting its server-side VAPID secrets in Supabase:

```powershell
npx supabase functions deploy push-new-order
```

The Supabase GitHub Actions workflow is manual and requires an explicit confirmation that migration history has been reconciled. Do not confirm this for the currently configured project until that work is complete. Configure `SUPABASE_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`, and `SUPABASE_DB_PASSWORD` as repository secrets only when you are ready to run migrations.

## GitHub

The CI workflow runs `npm ci` and `npm run build`. To publish this existing local Git repository, create an empty GitHub repository and connect it:

```powershell
git status
git branch -M main
git add .
git commit -m "Prepare City Go Captain for deployment"
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY>.git
git push -u origin main
```

If an `origin` remote is already configured, update it with `git remote set-url origin ...` instead of adding it again. The `.gitignore` excludes `.env.local`, `.env.*` secrets, `node_modules/`, and `dist/`.

## Vercel deployment

Import the GitHub repository from the Vercel dashboard. The included `vercel.json` configures the Vite build, `dist` output, clean `/admin` and `/auth` entry URLs, and no-cache service-worker updates. Set these **Production**, **Preview**, and **Development** environment variables in **Project Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | The Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The Supabase publishable key |
| `VITE_VAPID_PUBLIC_KEY` | The public Web Push VAPID key |

Redeploy after changing environment variables. User routes are `/` and `/auth`; the admin login is `/admin`. The frontend checks admin role, and the database migration enforces privileges; a hidden URL alone is not an authorization boundary.

The `/admin` page and restored sessions check the signed-in user's `profiles.role`; a signed-in non-admin is redirected to `/`. Admin database operations also validate the role through the database `is_admin` function, which is updated by migration 007.

For a custom domain, add it under **Vercel Project → Settings → Domains**, configure the DNS records Vercel displays, and wait for domain verification and TLS. Then update **Supabase → Authentication → URL Configuration**: set **Site URL** to `https://<your-domain>` and add `https://<your-domain>/**` plus the Vercel production URL to **Redirect URLs**. Keep `http://localhost:5173/**` for local development. No production URL exists until the repository is imported and the first Vercel deployment succeeds.
