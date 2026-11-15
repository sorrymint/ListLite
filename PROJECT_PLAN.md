# LiteList project plan

## Goal

A simple to-do list app with a thin web client and a backend as a service (BaaS). Android and iOS clients may follow
using the same backend. The backend handles authentication, data access, permissions, and business logic; clients handle
presentation. The client is never trusted to enforce authorization.

**Stack:** SvelteKit + TypeScript (web), Supabase (Postgres + Auth). Mobile technology is undecided.
Setup and commands are in [README.md](./README.md).

## Product decisions

- Email/password accounts with a required display name.
- Every list has an owner; personal and shared lists are the same thing.
- All members can add, edit, complete, and delete tasks. Only the owner renames or deletes the list and manages members
  and invitations. Deleting a list permanently deletes its contents.
- Invitations are reusable links that expire after 7 days by default (30 at most) and can be revoked. The recipient signs
  in and explicitly accepts.

## Current state

**Done**

- Auth: sign up, sign in, sign out, cookie sessions verified server-side (`src/hooks.server.ts`, `src/routes/+page.server.ts`),
  and an email-confirmation callback (`src/routes/auth/callback`). Local email confirmation is currently off.
- Database (`supabase/migrations`, applied locally): tables `profiles`, `lists`, `list_members`, `tasks`, `invitations`;
  row-level security (RLS) policies; column-level write grants; triggers for `updated_at` and profile creation; and
  functions `is_list_member`, `is_list_owner`, `create_list_invitation`, `preview_list_invitation`,
  `accept_list_invitation`, `revoke_list_invitation`. Invitation tokens are stored only as SHA-256 hashes.
- Seed data: two dev users, sample lists, tasks, and an invitation (`supabase/seed.sql`).
- Tests: 9 unit tests (`npm run test:unit -- --run`) and 26 database tests (`npm run test:db`) covering profiles, anonymous
  denial, list/task access, invitations (reuse, expiry, revocation), membership, and cascading deletion.
- List and task screens, and the invitation UI (create link, preview, accept, manage members).
- Add Soft Delete for tasks. Allow users to restore deleted tasks for a limited time (e.g., 14 days) before permanent deletion.
- Add Favicon and app icon.

**Not done**

- PWA (make sure mobile has icon)
- Password reset; end-to-end test of email confirmation redirects (callback is allow-listed for ports 5173 and 3000).
- Add icon to sign up page.
- Add drop down menu for sign up section of the landing page.
- Add a "delete account" button
- Playwright end-to-end tests for the entire client flow.

## How the backend is used

The web server builds a Supabase client from the user's cookie, so every query runs as that user and RLS applies.
The app uses `supabase-js` directly on tables, and `supabase.rpc(...)` for the invitation functions. The client generates
the invitation token (at least 32 random characters) and builds the link. Authorization lives only in the database.
