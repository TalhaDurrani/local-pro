# ProLocal

A Next.js 15 + Supabase marketplace that connects Pakistani service seekers with local professionals (electricians, plumbers, carpenters, etc.). Roles: `user` (seeker), `provider`, `superadmin`.

## Stack

- **Next.js 15** (App Router, RSC, server actions, edge middleware)
- **Supabase** (Postgres + PostGIS, Auth, Realtime, RLS)
- **@supabase/ssr** for cookie-based auth across browser, RSC, and middleware
- **Tailwind CSS + shadcn/ui** components
- **Leaflet + OSRM** for in-app maps and routing (no Google Maps)
- **TypeScript strict**

## Architecture (at a glance)

```
Browser ──cookies──► middleware.ts ──auth+ban check──► RSC pages
Browser ──fetch───► /api/* route handlers + server actions
                     │
                     ├─► supabase/server.ts  (user-scoped, RLS-enforced)
                     └─► supabase/admin.ts   (service-role, server-only)

DB triggers ──► notifications table ──► realtime ──► NotificationBell
```

The browser never writes to sensitive tables directly. Every privileged operation runs server-side and is double-protected by Postgres RLS policies.

## Project layout

```
src/
  app/
    api/                       Route handlers (account delete, admin, geocode proxy)
    admin/                     Server Component, superadmin only
    auth/  dashboard/  onboarding/
  components/
    admin/                     AdminClient (table, search, drill-in drawer)
    auth/                      AuthForm
    dashboard/                 SeekerFeed, SeekerRequests, EditProfileDialog
    layout/                    Navbar
    notifications/             NotificationBell
    provider/                  ProviderLeads, ProviderStats, MapView
    reviews/                   LeaveReviewDialog
    ui/                        shadcn components
  context/AppContext.tsx       Auth + theme + language
  hooks/
    useServiceRequests.ts      Single realtime channel, reducer-applied payloads
    useLocation.ts             Wraps the /api/geocode/reverse proxy
  lib/
    supabase/                  client.ts, server.ts, admin.ts
  middleware.ts                Session refresh + route protection + banned-user enforcement
supabase/migrations/
  0001_hardening.sql           Schema fixes, triggers, PostGIS RPC, notifications table, audit log
  0002_rls.sql                 Complete RLS policies
scripts/
  check-env.mjs                Boot-time env validation
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill it in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Required for admin + self-delete
NOMINATIM_CONTACT_EMAIL=you@example.com # Optional
```

> The service-role key has no `NEXT_PUBLIC_` prefix and is **never** sent to the browser. It is only used by `src/lib/supabase/admin.ts` from server contexts.

### 3. Apply database migrations

In the Supabase dashboard, open the **SQL editor** and run, **in order**:

1. `supabase/migrations/0001_hardening.sql`
2. `supabase/migrations/0002_rls.sql`

What you get:

- `profiles.email` column + auto-sync trigger from `auth.users`
- `handle_new_user` trigger so signup atomically creates `profiles` and `provider_details` from the metadata sent by `supabase.auth.signUp(... { options: { data: ... } })`
- `service_requests.status` CHECK constraint, NOT NULL FKs, `ON DELETE CASCADE` chains
- Partial unique index that prevents duplicate live requests `(seeker_id, provider_id) WHERE status IN ('pending','accepted')`
- PostGIS `nearby_providers(lat, lng, category, radius_km)` RPC, distance-sorted
- `notifications` table + trigger that fires on every `service_requests` insert/status change
- `audit_log` table written by every admin action
- Realtime publication enabled on `service_requests` and `notifications`
- Full least-privilege RLS policies on every table

### 4. Promote yourself to superadmin

```sql
update public.profiles set role = 'superadmin' where email = 'you@example.com';
```

### 5. Run

```bash
npm run dev       # http://localhost:9002
npm run build
npm run start
npm run typecheck
```

## Notifications

Three things had to be right for notifications to actually fire:

1. **Realtime publication** on `service_requests` and `notifications` (done in `0001_hardening.sql`).
2. **RLS** that lets the recipient `select` their own notification rows (done in `0002_rls.sql`).
3. **One** consolidated subscription via `useServiceRequests` and `NotificationBell`; the three competing channels in the old code have been removed.

When the tab is unfocused and the user has granted permission, the bell falls back to the Web Notification API to surface an OS-level toast.

## Maps

Leaflet renders inside `src/components/provider/MapView.tsx`. The provider can press "Show my location & route" to plot both markers plus a driving route polyline fetched from the free **OSRM public router** — no Google Maps dependency. Distance and ETA appear in an overlay card. Tiles switch between OpenStreetMap and CartoCDN dark depending on theme.

## Self-delete and admin delete

- Users can delete their own account from the Settings dialog → **Danger Zone** tab (re-auth with password required). Calls `DELETE /api/account` which uses the service-role admin client to call `auth.admin.deleteUser(self)`. The CASCADE FKs handle the rest.
- Superadmins can permanently delete any user from `/admin` (eye → drawer, or row trash icon → confirm). Logged to `audit_log`.

## Security notes

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is safe to expose (it goes through RLS).
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Anyone with this key can bypass RLS.
- The `middleware.ts` runs `getUser()` on every protected request, so banned users are signed out at the edge before they hit any handler.
- Nominatim is proxied through `/api/geocode/reverse` so the browser does not violate Nominatim's usage policy (no `User-Agent` etc).

## Scripts

| Script              | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:9002                      |
| `npm run build`     | Production build (`output: 'standalone'`)                |
| `npm run start`     | Run the production build                                 |
| `npm run typecheck` | `tsc --noEmit`                                           |

Both `dev` and `build` run `scripts/check-env.mjs` first.
