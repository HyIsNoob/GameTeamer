# Supabase Setup & Administration Guide

This guide explains how to set up and configure Supabase for **GameTeamer**, enable seasonal catalog editing, configure the admin allowlist, and deploy to production.

---

## 1. Prerequisites & Environment Variables

GameTeamer uses standard Supabase client libraries (Auth, Postgres, Realtime, Storage).

In your `.env.local` (for local development) and in **Vercel Project Settings > Environment Variables** (for production), add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-or-anon-key
```

> [!IMPORTANT]
> **Never** expose your `service_role` secret key in Vite environment variables or frontend code. GameTeamer uses Row Level Security (RLS) and email allowlist verification with the publishable/anon key.

---

## 2. Apply Database Migration & Seed Catalog

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** on the left menu.
3. Open [`supabase/migrations/202609260001_catalog_admin.sql`](../supabase/migrations/202609260001_catalog_admin.sql).
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.

This migration automatically sets up:
- `public.apex_legends`, `public.apex_weapons`, `public.valorant_agents` tables.
- Initial seed data for all 27 Apex Legends, 29 Apex weapons, and 26 official VALORANT agents.
- Storage bucket `gameteamer-assets` with public read access and 5 MB file size limit.
- Row Level Security (RLS) policies allowing public read of active items and restricting writes to verified admins.
- Realtime publication on `supabase_realtime` so live pages receive catalog changes immediately.

---

## 3. Creating & Authorizing Your Admin Account

Only emails listed in `public.game_admin_allowlist` are allowed to log into `/admin` and modify catalogs or upload images.

### Step 3.1: Create Your Auth User
1. In Supabase Dashboard, go to **Authentication > Users**.
2. Click **Add user** -> **Create user**.
3. Enter your admin email and a secure password.
4. Ensure **Auto Confirm User** is checked (or confirm via email).

### Step 3.2: Whitelist Your Admin Email
In the Supabase **SQL Editor**, run the following SQL query (replace with your exact email):

```sql
insert into public.game_admin_allowlist (email)
values (lower('YOUR_EMAIL_HERE@gmail.com'))
on conflict (email) do nothing;
```

---

## 4. Using the Admin Portal (`/admin`)

Once configured, navigate to `http://localhost:5173/admin` or `https://your-domain.com/admin`:

1. **Sign In**: Log in using your Supabase Auth email and password.
2. **Seasonal Care Package Updates**:
   - Go to the **Apex Weapons** tab.
   - Click **"Put In Package"** or **"Leave Package"** next to any weapon. The change takes effect immediately and broadcasts in realtime to all players.
3. **Adding New Legends**:
   - Click **"Add Legend"**.
   - Enter name, class, upload a full-body card image and portrait icon.
4. **VALORANT Agents**:
   - Manage active agents or add future agent releases.
5. **Live Rooms Dashboard**:
   - Click **"Live Rooms Dashboard"** tab.
   - View currently open Apex and VALORANT rooms, player counts, and overall concurrent user activity.
