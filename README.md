# PC-CPE Membership Platform

Next.js 14 + Supabase platform for the Communist Party of Ethiopia (PC-CPE) /
የኢትዮጵያ ኮሚኒስት ፓርቲ (ኢኮፓ). Anonymous public membership-interest poll, no visitor
accounts, admin-managed backend.

## 1. Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase
  project settings (Project Settings → API).
- `SUPABASE_SERVICE_ROLE_KEY` — same page, the `service_role` secret. **Never** commit
  this or expose it to the browser. It is used only inside `app/api/admin/*` routes.

## 2. Database

In the Supabase SQL Editor, run `supabase/schema.sql` once. It creates:
- `profiles` (admin accounts only — regular visitors never get a row)
- `polls` (question sets; the Membership Interest Form ships pre-seeded and active)
- `submissions` (poll responses, insert-only for the public, admin-only to read)
- the `OBS-XXXXXXXX` member ID generator
- a trigger that auto-promotes `billstanfordignis@gmail.com` to `super-admin`
  the moment that auth user exists

Then create that super-admin's auth user once — easiest via **Supabase Studio →
Authentication → Add user** (set any password you like and share it securely with
that person). The trigger takes care of the role assignment automatically.

## 3. How admin accounts work (per your latest instruction)

There is **no self-signup and no "invite by email"**. A super-admin creates a
brand-new admin directly from **Manage Admins**, choosing both the email and a
temporary password themselves. That is a direct call to Supabase's
`auth.admin.createUser()` using the service-role key (`app/api/admin/create-admin`),
gated by a server-side check that the caller is an *active* super-admin. From the
same screen a super-admin can:
- **Suspend** — the account still exists but is blocked from the dashboard
  (checked both in `app/admin/layout.tsx` and every RLS policy)
- **Reactivate**
- **Reset Password** — sets a new password directly, no email loop
- **Remove** — permanently deletes the auth user (cascades to their `profiles` row)

A super-admin can never suspend/reset/remove themselves through this panel, and the
route refuses to touch another super-admin account, to prevent lockouts.

Regular admins can change their own password anytime after logging in, using
Supabase's standard `updateUser({ password })` call (wire this into a simple
"Account Settings" page if you want a dedicated UI for it — the API already
supports it with no extra backend work).

## 4. Security model, end to end

- **Visitors never authenticate and never get a `profiles` row.** The only public
  write is `INSERT` on `submissions`; RLS blocks all public `SELECT`/`UPDATE`/`DELETE`.
- **The anon key can never read submissions.** Only a `profiles` row with
  `role IN ('admin','super-admin')` and `status = 'active'` can `SELECT`.
- **The service-role key never reaches the browser.** It's used exclusively inside
  the two `app/api/admin/*` route handlers, both of which re-verify the caller's
  session and role server-side before doing anything privileged.
- **Membership cards are never rendered or stored server-side.** `html-to-image`
  rasterizes the card entirely in the visitor's browser and triggers a local
  download — nothing is uploaded.
- **Security headers** (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, a locked-down `Permissions-Policy`) are set globally in
  `next.config.js`.
- **Middleware** protects every `/admin/*` route except `/admin/login`.

## 5. Adding more polls

`polls.schema` (jsonb) plus the hardcoded 15-question layout in
`components/MembershipForm.tsx` cover the Membership Interest Form, which is
marked `is_exempt = true` (its structure is fixed; new global poll-editing rules
you add later shouldn't accidentally apply to it). For your *next* poll:
1. Insert a new row into `polls` (`is_active = true` if it should show immediately;
   only one poll should be `is_active` at a time on the current single-poll landing
   page — extend `app/page.tsx` if you want several live at once).
2. Either reuse `MembershipForm`'s pattern for a new fixed-schema component, or (for
   a more "editable by admins" experience) build a generic question renderer driven
   by `polls.schema` — the SQL table is already shaped to support that migration
   without a schema change.

## 7. Troubleshooting: "nothing shows" / "can't access admin"

**If you already deployed the earlier version of this project, do this first:**
Paste the current `supabase/schema.sql` into the Supabase SQL Editor and run it again.
It is fully idempotent (safe to re-run) and fixes a real bug in the original version:

- **The bug:** the `profiles_select_all_for_superadmin` policy queried the `profiles`
  table from inside a policy defined *on* `profiles`. Postgres detects that as
  infinite recursion and throws `infinite recursion detected in policy for relation
  "profiles"` on **every** query to that table — including your own login checking
  its own role. That's why a correctly-provisioned super-admin account still
  couldn't get into `/admin`: the check itself was erroring out, and the old code
  silently treated any error the same as "no profile found" and bounced you back
  to the login page with no explanation.
- **The fix:** the role checks now go through `SECURITY DEFINER` SQL functions
  (`is_active_super_admin`, `is_active_admin`) whose internal queries don't
  re-trigger the calling policy. The updated `app/admin/layout.tsx` also now
  throws a real, visible error for genuine query failures instead of redirecting
  silently, and `app/admin/error.tsx` / `app/global-error.tsx` display it instead
  of a blank page.
- Re-running the SQL also backfills a `profiles` row for
  `billstanfordignis@gmail.com` if that account existed before the trigger did.

**If the homepage itself is blank (no header, no poll):**
`app/page.tsx` now catches Supabase errors and renders the actual error message
instead of silently failing — refresh the page and read what it says. The most
common cause is `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` not
being set (or not being set for the right environment — Production vs Preview)
in your hosting platform's environment variables, which requires a redeploy
after adding them.

**Checklist if you're still stuck:**
1. `supabase/schema.sql` has been run in full, most recently, against the
   correct project.
2. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` are all set in your host's environment variables
   (not just your local `.env.local`) — and you redeployed after adding them.
3. In Supabase → Authentication → Users, your super-admin account exists and
   its email exactly matches `billstanfordignis@gmail.com` (case-insensitive is
   handled, but check for typos/extra spaces).
4. In Supabase → Table Editor → `profiles`, that account has a row with
   `role = super-admin`, `status = active`. If not, re-run `schema.sql` (step 6
   of it backfills exactly this).
5. In Supabase → Table Editor → `polls`, there's a row with
   `slug = membership-interest-form` and `is_active = true`. If missing, re-run
   the seed section of `schema.sql`.

## 8. What's stubbed / left for you to finish

- Email delivery (e.g. notifying a submitter or an admin) is not wired up —
  nothing in the spec required it, and adding it well means picking a provider.
- The `translation_languages`/`skills_other` free-text fields are stored but not
  surfaced anywhere except the detail modal — add them to any exports you build.
- No automated tests yet.
