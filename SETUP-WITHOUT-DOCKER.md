# Run Order Management Portal Without Docker

If **Docker isn't installed** or **Supabase local won't start** (e.g. "docker client must be run with elevated privileges"), you can use a **hosted Supabase project** instead. No Docker required.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose org, name, database password, region.
3. Wait for the project to be ready.

---

## 2. Get your keys and URL

In the project: **Settings → API**.

- **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → use as `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

---

## 3. Configure the app

Create or edit **`apps/web/.env.local`** (this overrides `.env.development`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Use the same other vars as in `.env` / `.env.development` if needed (e.g. `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).

---

## 4. Run the database migrations on Supabase

You need to apply the schema (accounts + order management tables) on the **hosted** database.

**Option A – SQL in Dashboard**

1. In Supabase: **SQL Editor**.
2. Run the contents of **each** migration file in order:
   - `apps/web/supabase/migrations/20241219010757_schema.sql`
   - `apps/web/supabase/migrations/20250307000000_order_management.sql`
3. Execute each script.

**Option B – Supabase CLI (if it works on your machine)**

From the repo root:

```bash
pnpm --filter web supabase link --project-ref YOUR_PROJECT_REF
pnpm --filter web supabase db push
```

(`YOUR_PROJECT_REF` is in the Supabase project URL: `https://YOUR_PROJECT_REF.supabase.co`.)

---

## 5. Auth redirect URL (for sign-in/sign-up)

In Supabase: **Authentication → URL Configuration**.

Add to **Redirect URLs**:

- `http://localhost:3000/auth/callback`
- (and later your production URL, e.g. `https://yourdomain.com/auth/callback`)

## 5b. Disable email verification (optional)

To let users sign in immediately after sign-up without confirming email:

In Supabase: **Authentication → Providers → Email** → turn **off** “Confirm email”.

---

## 6. Start the app (no Docker)

```bash
pnpm run dev
```

Open **http://localhost:3000**, sign up or sign in, then go to **/home** for the Order Management dashboard.

---

## If you later want to use Docker (local Supabase)

- Install and start **Docker Desktop**.
- Run the terminal **as Administrator** if you see “elevated privileges” errors.
- Then run: `pnpm run supabase:web:start`.

The **Supabase CLI** bin warning (`Failed to create bin... supabase.EXE`) is a known Windows/pnpm issue. You can still run Supabase via **npx** from the web app folder:

```bash
cd apps/web
npx supabase start
```

Use the same `.env.local` keys but with the **local** API URL and keys printed by `supabase start` (usually `http://127.0.0.1:54321` and the demo anon/service_role keys).
