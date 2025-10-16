# eos archive

eos archive is a living index of independent art and club culture. Spaces around the world can submit their venues, publish events, and surface their programmes on an interactive Mapbox map. The project is built with the Next.js App Router, Supabase for data and auth, and Tailwind for the design system.

- **Live site:** https://eosarchive.app
- **Stacks together:** Next.js 15 · React 19 · Supabase · Mapbox GL · Tailwind CSS · Plausible · Vercel

---

## Features

- **Curated event map.** Mapbox GL renders space markers coloured by venue type, with a cascading filter system (city → space → date → category) backed by Supabase.
- **Space onboarding flow.** A multi-step signup process geocodes addresses with Mapbox, stores the venue, and provisions a Supabase auth user tagged with a `space` role.
- **Self-serve admin dashboard.** Authenticated space owners can edit details, upload hero imagery, and manage events via Supabase storage buckets (`space-images`, `event-images`, `event-documents`).
- **Rich event publishing.** Event submissions capture flyers, optional supporting documents, schedule metadata, and designer credits; moderation tooling supports multiple statuses.
- **Password recovery + secure auth.** Supabase Auth handles email/password login with branded reset flows that respect production origins.
- **Usage analytics and privacy UX.** Plausible analytics, cookie consent, share widgets, and responsive layouts deliver a production-ready archive experience.

---

## Project structure

```
src/
├─ app/                # Next.js App Router pages (landing, map, login, admin, signup, API routes)
├─ components/         # UI primitives (MapComponent, CityPicker, SpaceImageUpload, NavBar, etc.)
├─ contexts/           # Global state (filter cascade, Supabase user hook)
├─ hooks/              # Custom React hooks
└─ lib/                # Client helpers (Supabase client, SEO metadata, marker colours)
```

Tailwind styles live in `globals.css` and `tailwind.config.mjs`. Shared typography, spacing, and theme tokens are defined there.

---

## Getting started

### Prerequisites

- Node.js 18.18+ (the project targets Node 20 on Vercel)
- npm 9+ (or pnpm / yarn if you prefer)
- Supabase project with the required tables and storage buckets
- Mapbox account with a public access token

### 1. Clone and install

```bash
git clone https://github.com/your-user/eos-archive-mvp-2.git
cd eos-archive-mvp-2
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root and add the keys below:

| Key                                            | Required    | Description                                                     |
| ---------------------------------------------- | ----------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | ✅          | Supabase project REST URL                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                | ✅          | Supabase anon key for client queries                            |
| `SUPABASE_SERVICE_ROLE_KEY`                    | ✅          | Used by the `generate-signup-link` API route (keep server-only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN`                     | ✅          | Public Mapbox access token for geocoding + map                  |
| `NEXT_PUBLIC_SITE_URL`                         | ✅          | Production origin used in password reset emails                 |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`                 | ⛔ optional | Comma-separated domains tracked by Plausible                    |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL` | ⛔ optional | Fallback origins for redirects                                  |

If you deploy to Vercel or Netlify, mirror the same keys in the hosting dashboard.

### 3. Supabase schema essentials

At minimum you need these tables (all in schema `public`):

| Table                               | Purpose                                              | Key columns                                                                                                            |
| ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `profiles`                          | Extends Supabase auth users with roles               | `id (uuid, PK, references auth.users)`, `role`, `username`                                                             |
| `spaces`                            | Venue records                                        | `id`, `user_id (uuid)`, `name`, `type`, `city`, `address`, `latitude`, `longitude`, `status`, `image_url`              |
| `events`                            | Programme entries                                    | `id`, `space_id`, `created_by`, `title`, `start_date`, `end_date`, `category`, `image_url`, `document_url`, `approved` |
| `roadmap_items`, `organizers`, etc. | Optional supporting tables reused around the archive |

Storage buckets:

- `space-images` (public) — hero images per space
- `event-images` (public) — event flyers
- `event-documents` (restricted/public as you prefer) — supporting PDFs

Row Level Security (RLS) is enabled with policies that allow:

- public read access for `events` and `spaces`
- authenticated `space` owners to update their own rows
- admins to moderate everything

Capture your policies in version control (SQL files) or the Supabase dashboard so they can be replayed in other environments.

### 4. Run locally

```bash
npm run dev
# open http://localhost:3000
```

### 5. Build & lint

```bash
npm run lint   # ESLint (app dir + components)
npm run build  # Production build
npm run start  # Serve build locally
```

---

## Deployment notes

- **Hosting:** The main deployment lives on Vercel; any Node host that supports Next.js 15 works.
- **Environment parity:** Always set `NEXT_PUBLIC_SITE_URL` to your production origin and register the same URL under _Supabase → Authentication → Redirect URLs_, otherwise password reset emails revert to localhost links.
- **Storage policies:** Ensure the Supabase storage bucket policies allow authenticated users to upload under their own space. The app expects the `owner` field to match `auth.uid()`.
- **Analytics:** Plausible is loaded via a deferred script in `layout.js`. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to enable your account; leave it blank to disable tracking in previews.

---

## Roadmap & ideas

- Rich moderation queue for events (approve / reject with feedback)
- Public API endpoints powered by Supabase edge functions
- Full globalisation: locale-aware date formatting + city aliases
- Automated RLS tests using Supabase’s policy testing tools
- Snapshot testing for UI components with Storybook + Playwright

If you’re interested in contributing or want to discuss collaborations, reach out at [hello@eosarchive.app](mailto:hello@eosarchive.app).

---

## Credits

- **Product / design / development:** Micky Arratoon Pearson
- **Data & hosting:** Supabase
- **Maps & geocoding:** Mapbox
- **Analytics:** Plausible
- **Icons & UI helpers:** Heroicons, Headless UI

Thanks for taking a look! If you’re a recruiter or collaborator, feel free to contact me—there’s plenty more planned for the archive.
