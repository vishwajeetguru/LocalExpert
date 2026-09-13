# SevaSathi — Local Services Discovery (Shegaon)

**Find trusted local services near you. Fast. Local. Trusted. Simple. Free.**

Production-ready React Native + Expo (SDK 57) + TypeScript + Expo Router app for Android & iOS.

## Quick start

```sh
npm install
cp .env.example .env   # optional; defaults to mock mode
npx expo start
# press a → Android emulator, i → iOS simulator, w → web
```

Demo city: **Shegaon, Maharashtra** with fictional vendors/phones.

## Core journey

`Splash → Home → Search → Category → Vendor List → Vendor Profile → Login (only when needed) → Call / Chat / Request Service`
then `Add Your Service → Verification Pending → Vendor Dashboard`.

- No forced login: browse/search/vendors open without auth.
- Login gate uses a polished bottom sheet (never `Alert.alert`).
- Calling uses native dialer with confirm sheet; no fake durations.
- Chat, requests, saved, dashboard all work offline on mock data.

## Project layout

```
app/                    # Expo Router routes (file-based nav)
  index.tsx             # animated splash → (tabs)
  (tabs)/               # customer tabs: home, explore, requests, chats, profile
  search.tsx  category/[id].tsx  vendor/[id].tsx  vendor/[id]/request.tsx
  request/[id].tsx  chat/[id].tsx  auth/login.tsx  saved.tsx
  vendor-onboard/       # 4-step wizard + success (pending state)
  vendor-dashboard/     # status, stats, requests, edit service
src/
  theme/                # colors, typography, spacing, radius, shadows (light + dark-ready)
  types/models.ts       # User, Vendor, Category, ServiceRequest, Message, Review, …
  api/                  # config + repository interfaces + mock + wordpress stub
    config.ts           # EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_MODE
    repository.ts       # contracts UI depends on
    mock/               # realistic Shegaon data + in-memory repos
    wordpress/client.ts # TODO: WP REST mapping (swap one line in api/index.ts)
    index.ts            # `export const api` — single entry point
  services/             # AuthService, VendorService, CategoryService, RequestService, ChatService
  stores/               # zustand: useAuthStore, useAppStore, useUiStore (toast+gate), useOnboardStore
  components/           # ui/*, vendor/Cards, sheets/*, feedback/*
  hooks/                # useVendorActions (auth-gated call/chat/request/save), useDebouncedValue
  utils/                # format, device (haptics, tel:), …
```

## Architecture: UI → hooks/state → services → api/repository → backend

Screens never call `fetch` directly — they use `src/services/*`, which use `src/api/index.ts`.
To go live with WordPress:

1. Build WP plugin exposing `/wp-json/sevasathi/v1/*` (vendors, categories, requests, chat, auth, media).
2. Implement `wordpressApi` in `src/api/wordpress/client.ts` (+ `mappers.ts`) against the same `ApiBundle` interface.
3. Set `EXPO_PUBLIC_API_MODE=wordpress` + `EXPO_PUBLIC_API_URL=https://…`.
4. No screen changes needed. App never talks to WP DB directly and never stores admin/DB/Gmail secrets.

Mock auth is email-based and OTP-ready; real email sending happens server-side later.

## Design system

Centralized in `src/theme/`: brand teal `#0F766E`, amber accents, 4/8/12/16/20/24/32 spacing, cards with soft shadows, Reanimated micro-interactions, skeleton loaders, empty states, bottom sheets, toasts, confirm dialogs. Light-first, dark-ready via `useAppColors()`.

## Scripts

- `npx expo start` — dev
- `npx tsc --noEmit` — typecheck (clean)
- `npx expo-doctor` — health (21/21 passing)

Built per Expo SDK 57 docs (https://docs.expo.dev/versions/v57.0.0/).
