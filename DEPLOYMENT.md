# Deploy Bhakti Oils to Vercel

This guide walks you through deploying the app (monorepo with Next.js in `apps/web`) to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- Code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Supabase project already set up (you’re using it locally)

---

## 1. Push your code to Git

If you haven’t already:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your Git repository.
3. **Configure the project:**
   - **Root Directory:** Click “Edit” and set to **`apps/web`** (so Vercel builds the Next.js app).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `next build` (uses `vercel.json`; no `.env.local` needed).
   - **Output Directory:** leave default.
   - **Install Command:** `pnpm install`.

---

## 3. Set environment variables

In the Vercel project: **Settings → Environment Variables**. Add these for **Production** (and Preview if you want):

### Required (from your `.env`)

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Optional for first deploy (build uses a placeholder); set to your real Vercel URL and redeploy for auth redirects |
| `NEXT_PUBLIC_PRODUCT_NAME` | `Bhakti Oils` | |
| `NEXT_PUBLIC_SITE_TITLE` | `Bhakti Oils - Order Management` | |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Bhakti Oils order management portal...` | |
| `NEXT_PUBLIC_DEFAULT_THEME_MODE` | `light` | |
| `NEXT_PUBLIC_THEME_COLOR` | `#096c3e` | |
| `NEXT_PUBLIC_THEME_COLOR_DARK` | `#0d8b4d` | |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Same place |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | **Keep secret**; server-only |

### Optional (match your `.env` if you use them)

- `NEXT_PUBLIC_AUTH_PASSWORD` – `true`
- `NEXT_PUBLIC_AUTH_MAGIC_LINK` – `false`
- `NEXT_PUBLIC_CAPTCHA_SITE_KEY` – if you use Captcha
- `NEXT_PUBLIC_LOCALES_PATH` – `public/locales` (with Root Directory `apps/web`, paths are relative to that)
- `NEXT_PUBLIC_ENABLE_SIDEBAR_TRIGGER` – `false`
- `NEXT_PUBLIC_ENABLE_THEME_TOGGLE` – `true`
- `NEXT_PUBLIC_LANGUAGE_PRIORITY` – `application`
- `NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_DELETION` – `true`

If you did not set `NEXT_PUBLIC_SITE_URL` before the first deploy, set it now to your real Vercel URL (e.g. `https://bhakti-oils.vercel.app`) and redeploy so auth redirects work.

---

## 4. Deploy

1. Click **Deploy**.
2. Wait for the build. The first run may take a few minutes (pnpm install + Next.js build).
3. Open the generated URL (e.g. `https://your-project.vercel.app`).

---

## 5. Post-deploy checklist

- [ ] Update `NEXT_PUBLIC_SITE_URL` in Vercel to the final URL and redeploy.
- [ ] In **Supabase Dashboard → Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** (e.g. `https://your-app.vercel.app/**`).
- [ ] Ensure Supabase migrations are applied (you can run `supabase db push` from your machine against the hosted project, or use Supabase Dashboard / CI).
- [ ] Test sign-in, sign-out, and order flows on the deployed app.

---

## Deploying from the CLI (optional)

1. Install Vercel CLI: `pnpm add -g vercel`
2. From the **repository root**: `cd apps/web && vercel`
3. Follow the prompts (link to existing project or create new one).
4. Add env vars via CLI: `vercel env add NEXT_PUBLIC_SITE_URL` etc., or set them in the Vercel dashboard as above.

---

## Troubleshooting

- **Build fails with “module not found”**  
  Ensure **Root Directory** is `apps/web` and **Install Command** is `pnpm install` so the monorepo and workspace deps are installed.

- **Auth redirects to localhost**  
  Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL and add that URL in Supabase Auth redirect URLs.

- **Realtime or DB errors**  
  Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` match your Supabase project and that migrations have been applied.
