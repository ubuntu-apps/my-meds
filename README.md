# My Meds

A simple, installable Progressive Web App (PWA) for tracking the medications you
take daily (or several times a day). Describe each medication, set the times you
take it, confirm each dose, skip when needed, and get a reminder 15 minutes
before every scheduled dose.

Works offline and installs to the home screen on both **iPhone (iOS/Safari)** and
**Android (Chrome)**.

## Features

- **Describe medications** — name, dose (e.g. "1 tablet, 500 mg"), and free-text notes.
- **Flexible schedule** — set one or more times of day per medication.
- **Confirm a dose** — tap *Take* to record it; the time you took it is saved.
- **Skip a dose** — tap *Skip*; the skip is remembered too.
- **Undo** — a recorded dose can be reverted.
- **Reminders** — a notification fires **15 minutes before** each scheduled dose.
- **History** — every taken/skipped dose is logged by day.
- **Local & private** — all data is stored on your device (localStorage); nothing
  is sent to a server.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/) with [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)
- [`lucide-react`](https://lucide.dev/) icons

## Getting started

```bash
npm install
npm run generate-icons   # renders the PWA icons from the SVG sources
npm run dev              # start the dev server
```

Then open the printed local URL. To test installability and notifications, build
and preview a production bundle:

```bash
npm run build
npm run preview
```

## Notifications

Tap **Enable** on the reminder banner to grant notification permission. Reminders
are scheduled while the app is open or running in the background.

> **iOS note:** Safari only delivers web notifications when the app has been
> **added to the Home Screen** (Share → *Add to Home Screen*) and opened from
> there. On Android/Chrome, notifications work in the browser and when installed.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (PWA enabled in dev). |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run generate-icons` | Regenerate PNG icons from the SVG sources. |

## License

Part of the [ubuntu-apps](https://github.com/ubuntu-apps) collection.
