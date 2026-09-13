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

## Core journeys

**Customer:** `Splash → Home → Search → Category → Vendor Profile → Login (only when needed) → Call / Chat / Request Service`

- No forced login: browse/search/vendors open without auth.
- Login gate uses a polished bottom sheet (never `Alert.alert`).
- Calling uses native dialer with confirm sheet; no fake durations.
- Chat, requests, saved, dashboard all work offline on mock data.

**Vendor:** `Join as a vendor (partner card) → Vendor signup → OTP verify → Set password → 4-step business wizard → Verification Pending → Vendor Dashboard`

- **Login is identical for customers and vendors** (email + password); only the signup paths differ.
- Vendor signup collects the account (name, email, phone), then continues into the business wizard: category → business details → contact & location → review → success.
- Account phone is prefilled into the wizard's contact step.

## Project layout

```
app/                    # Expo Router routes (file-based nav)
  index.tsx             # animated splash → (tabs)
  (tabs)/               # home, explore, requests, chats, profile
  search.tsx  category/[id].tsx  vendor/[id].tsx  vendor/[id]/request.tsx
  request/[id].tsx  chat/[id].tsx  saved.tsx
  auth/                 # login (shared) → verify (OTP) → set-password
  vendor-onboard/       # signup (vendor account) + 4-step wizard + success
  vendor-dashboard/     # status, stats, requests, edit service
src/
  theme/                # colors, typography, spacing, radius, shadows (light + dark-ready)
  types/models.ts       # User, Vendor, Category, ServiceRequest, Message, Review, …
  api/                  # config + repository interfaces + mock + wordpress client
    config.ts           # EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_MODE
    repository.ts       # contracts UI depends on
    mock/               # realistic Shegaon data + in-memory repos
    wordpress/client.ts # live WP REST mapping (X-Seva-App-Key + X-Seva-Token)
    index.ts            # `export const api` — single entry point
  services/             # AuthService, VendorService, RequestService, ChatService, …
  stores/               # zustand: useAuthStore, useAppStore, useUiStore (toast+gate), useOnboardStore, …
  components/
    ui/*                # AppText, Button, Input, SearchBar, Clay, Pills, …
    keyboard/           # KeyboardAwareScreen (shared form/scroll container)
    sheets/*            # BottomSheet, ReviewSheet (scoped), Auth/Call/Location sheets
    vendor/             # Cards, LocationPicker, …
    feedback/           # Toast, ConfirmDialog
  hooks/                # useVendorActions (auth-gated call/chat/request/save), useDebouncedValue, useLiveSync, usePush, …
  i18n/                 # English / हिन्दी / मराठी (locales.ts + store)
  utils/                # format, device (haptics, tel:), taxonomy, …
```

## Architecture: UI → hooks/state → services → api/repository → backend

Screens never call `fetch` directly — they use `src/services/*`, which use `src/api/index.ts`.
Backend selection is one line (`src/api/index.ts` picks `wordpressApi` vs `mockApi`
from `EXPO_PUBLIC_API_MODE`). The live WordPress plugin lives outside this repo
(vendors, categories, requests, chat, OTP + password auth, push hooks, relevance/geo search).

No screen changes are needed to swap backends. App never talks to WP DB directly
and never stores admin/DB/Gmail secrets.

Auth is email + password: new accounts verify the inbox over OTP once, then set a
password. Daily logins use the password; sessions are 30-day rotating tokens.

## Keyboard handling

One engine everywhere — `react-native-keyboard-controller` with a single root
`<KeyboardProvider>` (no hardcoded keyboard heights, no magic padding):

- `KeyboardAwareScreen` — shared container for every form/scroll screen (login,
  OTP, passwords, request, search, vendor onboarding/edit). Focused inputs scroll
  into view with safe-area-aware bottom padding.
- **Chat** — native `KeyboardAvoidingView (padding)`: the message list shrinks in
  layout and the composer rides immediately above the keyboard; scrolls to the
  latest message on keyboard open.
- **Bottom sheets** — `KeyboardStickyView` lift (position-independent, safe inside
  a `Modal`) + inner keyboard-aware scroll for tall content.
- **Review sheet** — dedicated `ReviewSheet`: single lift only (short content must
  not be double-compensated) + height-capped multiline input with internal scroll.
- Shared `Input` defers its focus-ring state one frame so the commit never kills
  the iOS keyboard animation.
- Android uses `softwareKeyboardLayoutMode="resize"`; iOS-only lifts are gated by
  platform so layouts never double-shift.

## Design system

Centralized in `src/theme/`: brand orange `#FF4D24` on ink `#131313`, clay-style
puffy cards + concave wells, Nunito display + DM Sans body, 4/8/12/16/20/24/32
spacing, soft shadows, Reanimated micro-interactions, skeleton loaders, empty
states, bottom sheets, toasts, confirm dialogs. Light-first, dark-ready via
`useAppColors()`.

## Scripts

- `npx expo start` — dev (`--android` / `--ios` / `--web`)
- `npx tsc --noEmit` — typecheck (clean)
- `npx expo-doctor` — health

Built per Expo SDK 57 docs (https://docs.expo.dev/versions/v57.0.0/).
