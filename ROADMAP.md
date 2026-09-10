# DeepSleep — Engineering Roadmap

Status of this document: written 2026-09-10 after a full read of `src/`, the Supabase
migration, and the deploy config, plus a reproduction of the build in a clean checkout.

Every claim marked **[verified]** was reproduced locally. Everything else is a code
reading, not a test result.

---

## Where the project actually stands

The published docs (`UI_UX_ASSESSMENT.md`, `TEST_SUMMARY.md`, `DEPLOYMENT_SUCCESS.md`)
score the app "9.5/10, production ready, critical issues found: NONE". That assessment
does not match the code. The screens are genuinely well-built in isolation, but three
layers underneath them are broken:

1. the project does not install or build,
2. the app talks to a database schema that does not match the migration,
3. every confirmation and error dialog is a no-op in the browser — which is the only
   place the app is actually shipped.

The roadmap below is ordered by what unblocks the next thing, not by effort.

---

## P0 — The deployed site cannot be rebuilt or signed out of

### 0.1 `npm install` fails on a clean checkout **[verified]**

Two independent peer-dependency conflicts:

- `@expo/webpack-config@^19.0.1` declares `peer expo@"^49.0.7 || ^50.0.0-0"`, but the
  project is on `expo@~54.0.0`. Expo moved web bundling from webpack to Metro in SDK 50;
  this package (and `webpack.config.js`) are leftovers from an SDK 49 era.
- `react` is pinned to `19.2.0` while `react-dom` floats on `^19.2.0`, which resolves to
  `19.3.0` and peers `react@^19.3.0`.

Fix: drop `@expo/webpack-config` and `webpack.config.js`, pin `react-dom` to the same
exact version as `react`, then run `npx expo install --fix` to align the rest. Ten
packages are currently off the versions SDK 54 expects, including `react-native@0.83.2`
(expected `0.81.5`) and `expo-status-bar@55.0.6` (expected `~3.0.9`).

### 0.2 `babel-preset-expo` is used but never declared **[verified]**

`babel.config.js` references it; it appears in no dependency list. It resolves today only
by accident of hoisting, and Metro fails outright with
`Cannot find module 'babel-preset-expo'` once the tree changes. Add it to
`devDependencies`.

### 0.3 The Vercel build command no longer exists **[verified]**

`vercel.json` runs `expo build:web` into `web-build/`. That command was removed in Expo
SDK 50. The working invocation on SDK 54 is `npx expo export --platform web`, which emits
to `dist/`. With 0.1–0.3 applied, the web bundle builds clean (1.89 MB JS).

### 0.4 `Alert.alert()` is an empty function on web **[verified]**

`react-native-web`'s Alert module is literally `class Alert { static alert() {} }`. The
app calls `Alert.alert` 20+ times. On the deployed site this means:

- **You cannot sign out.** `ProfileScreen.handleSignOut` puts the actual `signOut()` call
  inside a confirmation dialog's `onPress`. No dialog, no callback, no sign-out.
- **The log form never resets** after a save — `LogScreen` resets its fields inside the
  success dialog's `onPress`, so the user sees a submitted form that looks unsubmitted and
  has no idea whether it saved.
- Every load failure, save failure and validation error is silent. Login and signup errors
  from Supabase never reach the user.
- Delete confirmation in `SleepLogList` silently does nothing.

Fix: one cross-platform `confirm()` / `toast()` helper backed by `Alert` on native and a
modal (or `window.confirm`) on web, and replace all call sites. This is the single
highest-value change in the list — it is the difference between "the app is broken" and
"the app works" for every web user.

### 0.5 Secrets are committed

`.env` is tracked in git with a live Supabase URL and anon key. `.gitignore` only excludes
`.env*.local`. The anon key is designed to be public, so this is not an emergency — but it
means the project's entire security posture rests on RLS being correct, and §1.2 shows it
is not. Untrack `.env`, add `.env` to `.gitignore`, and rotate.

---

## P1 — The app and the database disagree about what a sleep log is

### 1.1 Two incompatible schemas, both in the codebase

There are two parallel data models and neither is fully wired up:

| | `sleep_entries` | `sleep_logs` |
|---|---|---|
| In the migration? | yes | **no** |
| Shape | `sleep_quality`, `sleep_duration` (hours), `wake_up_refreshed` | `tst_minutes`, `tib_minutes`, `sol_minutes`, `waso_minutes`, … |
| Written by | `LogScreen` | `SleepLogForm` |
| Read by | `HomeScreen`, `ProgressScreen` | `useSleepLogs`, `SleepLogList` |
| Reachable in the UI? | yes | **no** |

`src/types/index.ts` describes the second model. `src/lib/sleep.ts` — 101 lines of
sleep-efficiency, ISI scoring, streak and sleep-window maths, the clinically interesting
part of the product — operates on that second model, and **nothing imports it**. So does
`useSleepLogs`, `SleepLogForm`, `SleepLogList`, and `SleepDiaryChart`: all dead code
pointing at a table that does not exist.

Meanwhile the live UI stores a single self-reported "hours slept" number, which cannot
produce sleep efficiency, and therefore cannot support CBT-I sleep restriction — the thing
`sleep_windows` and `lib/sleep.ts` exist for.

**Decision required before anything else in P1**: is this a simple sleep journal
(`sleep_entries`) or a CBT-I tool (`sleep_logs`)? The rest of the roadmap assumes the
latter, because that is what the types, the maths, the assessment scales and the
`sleep_windows` table were all built for.

Migration path: add `sleep_logs` to the migration with RLS, port `LogScreen` to capture
bedtime / lights-out / sleep-onset latency / awakenings / rise time, backfill
`sleep_entries` rows as approximations, then delete the `sleep_entries` path.

### 1.2 The `profiles` table can never be populated

- The migration grants `profiles` SELECT and UPDATE policies but **no INSERT policy**, and
  there is no `on auth.user created` trigger. Nothing ever creates a profile row.
- `useAuth` therefore calls `.single()` on an empty result, which returns an error that is
  discarded (`const { data } = ...` — `error` is never destructured), and `profile` stays
  `null` forever.
- Even if a row existed, the migration's columns are `full_name` / `email` / `avatar_url`,
  while `src/types/index.ts` and `HomeScreen` read `display_name`, `onboarding_completed`,
  `timezone`, `baseline_avg_tst_minutes` and ten other fields that do not exist.

Consequence: the home screen greets every user as "there", forever. Signup collects a
display name into `auth.users.user_metadata` and it is never read back.

Fix: a `handle_new_user()` trigger that inserts a profile row from `raw_user_meta_data`, an
INSERT policy, and one schema that matches `Profile` in the types.

### 1.3 Onboarding is unreachable

`OnboardingScreen` is 603 lines — country selection with crisis lines, medications, caffeine,
alcohol, shift work — and it is registered in the navigator but **nothing ever navigates to
it**. `AppNavigator` branches on `user` only; it never checks `profile.onboarding_completed`.
New users land straight on an empty home screen.

Also: `onboarding_data` has no unique constraint on `user_id`, so re-running it silently
duplicates rows, and the screen's completion navigation lives inside an `Alert` callback
(§0.4), so on web it would never complete even if it were reachable.

### 1.4 `useAuth` is a hook pretending to be a context

`AuthContext.tsx` is a no-op that renders `<>{children}</>` — its own comment admits it.
Every screen calls `useAuth()` independently, so the app currently holds **six separate
copies** of auth state, six `onAuthStateChange` subscriptions, and fires a duplicate
`profiles` query per screen on every auth event.

Fix: make `AuthProvider` a real provider holding one instance of the hook's state.
Small change, removes a whole class of "why is this screen stale" bugs.

---

## P2 — Things the UI claims that aren't true

- **`ProfileScreen` stats are hardcoded**: "7 Sleep Logs", "28 Days Streak", "6.8 Avg
  Hours" are string literals shown to every user regardless of their data. `computeStreak`
  in `lib/sleep.ts` already does this correctly and is unused.
- **`HomeScreen` streak is fake**: `const streak = sleepData.length` — the count of the
  last 7 rows, labelled "Logged", but it is not a streak.
- **Dark Mode / Notifications / Sleep Reminders toggles do nothing.** They set local
  `useState` that is discarded on unmount. `UI_UX_ASSESSMENT.md` lists dark mode as
  "already implemented".
- **`SettingsScreen` is orphaned** — not in the navigator, and duplicates the
  Profile screen's toggles. Its "Export Sleep Data" and "Delete All Data" buttons have no
  `onPress` at all.
- **`AlarmScreen` is orphaned and would break the build** if imported: it
  `require`s `../../assets/alarm.mp3`, which does not exist in `assets/`.
- **`LearnScreen` articles are not readable.** Six articles with titles, categories and
  read-times; only the four external resources have URLs. Tapping an article does nothing.
- **"Last Updated: March 2026"** is hardcoded in the About card.

Either build these or remove them. Shipping non-functional toggles in a health app costs
more trust than the features would have earned.

---

## P3 — Correctness and polish

- `ProgressScreen` bar heights are raw pixel maths (`sleep_quality * 10`,
  `sleep_duration * 12`) against a fixed 100px container, so a 12-hour night overflows its
  chart. `SleepDiaryChart` already normalises against `maxValue` — and is unused.
- No `KeyboardAvoidingView` on Login, Signup, or the notes field; no `onSubmitEditing`, no
  `autoComplete`/`textContentType`, so password managers don't fire and Enter doesn't submit.
- `useSleepLogs` never resets `loading` when `userId` changes, discards errors, and has no
  cleanup — a fast tab switch can land a stale response.
- `HomeScreen` and `ProgressScreen` both `import { subDays }` unused / partially unused.
- No error boundary. Any render throw shows a blank white page in production.
- `AppNavigator` renders `null` while loading — a blank screen on every cold start,
  with a `// Or a loading screen` comment marking the spot.
- No tests. `App-test.tsx` and `TestScreen.tsx` are scratch components, not tests, and
  `package.json` has no test script. `lib/sleep.ts` is pure functions and is the obvious
  place to start.
- Seven overlapping deployment markdown files (`DEPLOY.md`, `DEPLOYMENT.md`,
  `DEPLOY_NOW.md`, `DEPLOYMENT_SUCCESS.md`, `ONE_CLICK_DEPLOY.md`,
  `TEST_DEPLOYMENT.md`, `VERCEL_DEPLOY_NOW.md`) with conflicting instructions. Collapse to
  one.

---

## P4 — Product, once the foundation holds

These are the items the existing docs list as "future enhancement". They are correct, but
none of them are reachable until P0 and P1 land.

- **Sleep restriction / stimulus control.** The `sleep_windows` table, `LESSON_UNLOCK_DAYS`
  and the whole of `lib/sleep.ts` are scaffolding for CBT-I. This is the actual product
  differentiator and it is currently 100% dormant.
- **ISI / PHQ-9 / GAD-7.** Typed in `src/types/index.ts`, storable in `assessments`, and
  never presented anywhere in the UI. `getISILabel` exists and is unused. Note that PHQ-9
  item 9 asks about self-harm — shipping it requires wiring the crisis resources already
  collected in onboarding to the result screen.
- Reminders / notifications (the toggle already promises this).
- Offline cache and pull-to-refresh.
- Real charts, data export, and health-platform sync.

---

## Suggested sequence

| Step | Contents | Unblocks |
|---|---|---|
| 1 | 0.1 – 0.3 | Anyone can build and deploy again |
| 2 | 0.4 | Web users can sign out and see errors |
| 3 | 0.5, 1.2, 1.4 | Auth and profile actually work |
| 4 | 1.1 decision + migration | One data model |
| 5 | 1.3 | New users get onboarded |
| 6 | P2 | UI stops lying |
| 7 | P3 | Tests and hardening |
| 8 | P4 | The product people came for |

Steps 1 and 2 are roughly a day together and account for most of the user-visible
breakage.
