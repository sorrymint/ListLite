# LiteList

A demo to-do list app for [sorrymint](https://github.com/sorrymint) to learn backend as a service (BaaS).
It is a learning project, not a template for production use.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the architecture, current status, and next steps.

## AI Disclosure

This project was created with the help of AI tools.
I used this project not only to learn about BaaS, but also to learn how to work effectively with AI. I am learning to use AI tools to help me write code, documentation, and tests. I am also learning to use AI tools to help me understand and debug code.

## Quick start

Run Supabase commands to create local Supabase environment.

```bash
npm install # Install Project dependencies.
npx supabase start       # starts the local Supabase stack
npx supabase db reset    # applies migrations and seed data (deletes local data!)
npm run dev              # Starts the SvelteKit dev server
```

## Commands

| Command                      | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `npm run build`              | Production build                                                           |
| `npm run check`              | Svelte and TypeScript checks                                               |
| `npm run test:unit -- --run` | Unit tests                                                                 |
| `npm run test:db`            | Database tests against the running local stack (access rules, invitations) |
| `npm run test:e2e`           | Playwright end-to-end tests                                                |
| `npx supabase migration up`  | Apply new migrations without deleting local data                           |
| `npx supabase db reset`      | Recreate the local database from migrations and seed                       |

> `test:db` needs `npx supabase start` and a seeded database. It cleans up its own lists, but each run leaves one extra
> test user until the next `db reset`.

## Database

Schema changes live in `supabase/migrations`. Add a new migration file for each change; do not edit applied ones.
Tests are in `supabase/tests`. Supabase Auth owns `auth.users`; a trigger creates a matching `public.profiles` row.

## Web UI Implementation

The complete Svelte 5 UI is now implemented. See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed architecture documentation.
