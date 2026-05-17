# eos archive — Supabase Schema Reference

Generated from source code analysis. Keep this up to date before making any schema changes — the mobile app shares the same database.

---

## Tables

### `events`
The core table. Stores all event listings submitted by spaces.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `space_id` | uuid | FK → `spaces.id` |
| `created_by` | uuid | FK → `auth.users.id` |
| `title` | text | Programme/event name |
| `category` | text | One of the 15 categories (see below) |
| `designer` | text | Flyer graphic designer credit |
| `description` | text | Optional programme context |
| `start_date` | date | `YYYY-MM-DD` |
| `end_date` | date | `YYYY-MM-DD` |
| `start_time` | time | `HH:MM` or `HH:MM:SS` |
| `end_time` | time | `HH:MM` or `HH:MM:SS` |
| `image_url` | text | Public URL to event flyer in `event-images` bucket |
| `document_url` | text | Optional public URL to PDF in `event-documents` bucket |
| `approved` | boolean | `true` = published and visible in feed |
| `terms_accepted` | boolean | User confirmed rights on submission |
| `slug` | text | URL-safe identifier, falls back to `id` if null |
| `city` | text | Fallback city if space has no city set |
| `status` | text | Used in some approval flows (`approved`, `denied`) |
| `created_at` | timestamptz | Auto-set by Supabase |
| `updated_at` | timestamptz | Auto-set by Supabase |

**Event categories:** `exhibition` · `opening` · `closing` · `concert` · `live music` · `dj night` · `day party` · `festival` · `performance` · `workshop` · `market` · `film` · `talk` · `community` · `other`

**Visibility rule:** only events where `approved = true` appear in the public feed and filter context.

---

### `spaces`
Venue/space profiles. Each space is managed by one user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users.id` — the space admin |
| `name` | text | Display name |
| `type` | text | e.g. `gallery`, `club`, `studio` — normalised to lowercase |
| `city` | text | City name |
| `address` | text | Street address |
| `description` | text | About the space |
| `website` | text | URL |
| `latitude` | float | For map placement |
| `longitude` | float | For map placement |
| `image_url` | text | Public URL to space image in `space-images` bucket |
| `leico` | boolean | Whether the space is part of the Leico collaboration |
| `status` | text | `pending` on signup, updated by admin review |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `profiles`
Extends `auth.users` with app-level user data.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, FK → `auth.users.id` |
| `role` | text | `space` for space admins |
| `username` | text | Set to space name on signup |

---

### `conversations`
Editorial content — interviews and essays.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `slug` | text | URL identifier — `/conversations/[slug]` |
| `title` | text | |
| `dek` | text | Subtitle / deck |
| `quote` | text | Pull quote |
| `convo_date` | date | Date of conversation |
| `location` | text | Where it took place |
| `instagram_url` | text | |
| `website_url` | text | |
| `cover_image_url` | text | |
| `show_cover` | boolean | Whether to display the cover image |
| `status` | text | `draft` or `published` |
| `source` | text | `native` for in-app created |
| `published_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `conversation_items`
Individual content blocks within a conversation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `conversation_id` | uuid | FK → `conversations.id` |
| `idx` | integer | Ordering index |
| `kind` | text | Content type (e.g. `text`) |
| `text_md` | text | Markdown source |
| `html` | text | Rendered HTML |

---

### `roadmap_items`
Internal product roadmap. Admin-only, not surfaced to end users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | text | |
| `description` | text | |
| `status` | text | `upcoming`, `in-progress`, `done` |

---

## Storage Buckets

| Bucket | Used for |
|---|---|
| `event-images` | Event flyer images (JPG, PNG, WEBP · max 5MB). Uploads via `/api/events/upload-image` server route using service role key. |
| `event-documents` | Supporting PDFs attached to events (max 10MB). Uploaded client-side from `EventSubmissionForm`. |
| `space-images` | Space profile images. Uploaded via `SpaceImageUpload` component. |

---

## Key Relationships

```
auth.users
  ├── profiles (1:1)
  └── spaces (1:many via user_id)
        └── events (1:many via space_id)

conversations
  └── conversation_items (1:many via conversation_id)
```

---

## API Routes (mobile will call these)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/events` | All events (`select *`) |
| `GET` | `/api/events/[id]` | Single event with joined space `(id, name)` |
| `GET` | `/api/spaces` | All spaces |
| `GET` | `/api/spaces/[id]` | Single space |
| `POST` | `/api/events/upload-image` | Upload event image (requires Bearer token) |
| `POST` | `/api/newsletter` | Mailchimp subscribe |
| `POST` | `/api/support/create-payment-intent` | Stripe payment intent |
| `POST` | `/api/generate-signup-link` | Admin — generate space signup magic link |

---

## Environment Variables (required for mobile)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
```

The mobile app can use the same Supabase URL and anon key. The service role key (`SUPABASE_SERVICE_ROLE_KEY`) must stay server-side only and should never be in the mobile app bundle.
