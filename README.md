# StressLap

> Release Your Stress, One Slap at a Time!

StressLap is a playful, cartoon-style stress-relief web app. Upload a photo, the app finds the face
right in your browser, and you can unleash **slaps**, **punches** (with a squishy boxing glove) and
**kicks** (with a flying sneaker). The face reacts to every hit: the head wobbles and recoils, eyes
widen, eyebrows shoot up, the jaw drops, cheeks squish and blush, and comic bursts, stars and
shockwaves fly, all with synthesized cartoon sound effects.

## Privacy

- Photos are processed **only in your browser**. Nothing is uploaded or stored anywhere.
- The face-detection runtime (MediaPipe WASM) and model are served from this app's own `/public`
  folder, so no third-party service ever sees your photo.
- The **Remove photo** button clears the image from memory (the blob URL is revoked).

## Features

- Drag-and-drop or browse upload (JPG, JPEG, PNG, WEBP, up to 10 MB), with validation and friendly errors
- Real face detection with facial landmarks (MediaPipe Face Landmarker, up to 6 faces)
  - Auto-crops around the selected face with room for animations
  - "Target locked" indicator around the face
  - Pick a face in group photos (click a box on the preview or a thumbnail)
  - Falls back to tiled detection for small faces in large photos
  - Clear "no face found" state
- Three distinct action sequences with windup, impact and recovery timing:
  - **Slap**: open hand, head turn, cheek squish, red hand-print mark, sweat drop, speed lines
  - **Punch**: boxing glove, recoil, mouth drops open, shockwaves, orbiting stars
  - **Kick**: sneaker swings in, big recoil, screen shake, dizzy spiral eyes
- Tap/click anywhere on the face to punch that exact spot
- Animation lock (no overlapping actions) plus a short cooldown
- Sound effects generated with the Web Audio API (no audio files), with a Sound On/Off toggle;
  audio only starts after a user interaction
- Statistics (slaps, punches, kicks, total), a stress-relief meter and varied funny messages
- Controls: Slap, Punch, Kick, Random action, Reset, Upload another photo, Remove photo, Sound toggle
- Keyboard shortcuts: `S` slap, `P` punch, `K` kick, `Space` random
- Responsive layout for desktop and mobile; respects `prefers-reduced-motion` for shakes and idle motion

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

`npm install` runs a `postinstall` script that copies the MediaPipe WASM files from
`node_modules/@mediapipe/tasks-vision/wasm` into `public/mediapipe/wasm` (it also runs before
`dev` and `build`). The face model lives in `public/models/face_landmarker.task`.

### Other scripts

```bash
npm run lint
```

```bash
npm run build && npm start
```

## SEO, icons and production URL

Copy `.env.example` to `.env.local` (or set the variable in your host) before a production build:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

It drives `metadataBase`, canonical URLs, Open Graph URLs, `/sitemap.xml` and `/robots.txt`
(see `src/lib/site.ts`). On Vercel the production domain is used automatically if the variable is
unset. Any other production build without it falls back to localhost **and is marked noindex**, so
localhost URLs are never published.

- Metadata: `src/app/layout.tsx` (title template, Open Graph, Twitter/X card, robots, icons)
- `src/app/manifest.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`
- JSON-LD (`WebSite` + `WebApplication`): `src/components/StructuredData.tsx`
- Icons and the social image are generated from the header logo:

```bash
node scripts/generate-brand-assets.mjs
```

It writes `public/favicon.ico`, `public/favicon.svg`, `public/icon.png` (192),
`public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-icon.png` (180) and
`public/og-image.png` (1200x630). The outputs are committed, so builds do not need to run it.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4
- `@mediapipe/tasks-vision` for in-browser face landmarks
- `lucide-react` icons
- CSS keyframe animations + inline SVG art; Web Audio API for sounds

State is local to the page (`useState` / custom hooks), so Redux Toolkit wasn't needed.

## Project structure

```
src/
  app/                 layout, page, global styles + all animation keyframes
  components/
    StressLapApp.tsx   page-level state: upload, detection, actions, stats, controls
    ImageUploader.tsx  drag & drop / browse, validation, preview with face boxes
    FaceDetector.tsx   detection status, errors, multi-face picker
    FacePreview.tsx    the interactive stage (head layer, attackers, effects)
    ReactionEffects.tsx impact bursts, particles, facial warps, cheek marks
    animations/        Attacker positioning + SlapAnimation, PunchAnimation, KickAnimation
    ActionButtons.tsx  Slap / Punch / Kick / Random
    ControlPanel.tsx   Reset / Upload another / Remove / Sound
    InteractionStats.tsx, ReactionMessage.tsx, SoundController.tsx, Header.tsx, InfoSections.tsx
    ImagePatch.tsx     renders any region of the photo responsively (used for crops and warps)
  hooks/
    useFaceDetection.ts   load image locally + run detection
    useActionSequencer.ts windup -> impact -> cooldown state machine (prevents overlaps)
  lib/
    faceDetection.ts   MediaPipe loader, landmark -> feature mapping, tiled fallback
    geometry.ts        crop / coordinate conversions, feature regions
    actions.ts         timings, burst words, messages
    sound.ts           synthesized sound effects
```

### How the facial reactions work

MediaPipe returns 478 facial landmarks. From them StressLap locates the eyes, eyebrows, mouth,
cheeks, nose, chin and forehead. For each reaction it overlays feathered copies of those regions of
the photo and warps them with CSS transforms (eyes scale up, brows stretch upward, the jaw stretches
down, the hit cheek squishes), while the whole head layer rotates/recoils around the chin. Cartoon
overlays (open mouth, dizzy eyes, stars, blush marks) are positioned from the same landmarks.

## Troubleshooting

- **Build fails with `ERR_REQUIRE_ESM` for `magic-string`** on older Node 20 releases: `package.json`
  pins `magic-string` to 0.30.x via `overrides` to avoid this. Run `npm install` again, or use
  Node 20.19+ / 22+.
- **"Face detection couldn't start"**: make sure `public/mediapipe/wasm` exists (run
  `npm install` or `node scripts/copy-mediapipe-wasm.mjs`).
- **No face found**: use a clear, well-lit, mostly front-facing photo.
