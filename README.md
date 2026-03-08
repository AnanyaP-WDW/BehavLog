<p align="center">
  <img src="docs/behavlog-logo.svg" alt="BehavLog" width="860" />
</p>

<p align="center">
  Open-source scientific software for animal behavior and keypoint annotation from video.
</p>

<p align="center">
  <a href="https://github.com/AnanyaP-WDW/BehavLog/actions/workflows/release.yml"><img src="https://github.com/AnanyaP-WDW/BehavLog/actions/workflows/release.yml/badge.svg" alt="Tauri Release" /></a>
  <a href="https://github.com/AnanyaP-WDW/BehavLog/actions/workflows/ci.yml"><img src="https://github.com/AnanyaP-WDW/BehavLog/actions/workflows/ci.yml/badge.svg" alt="Tests" /></a>
  <a href="https://github.com/AnanyaP-WDW/BehavLog/releases/tag/v0.1.2"><img src="https://img.shields.io/badge/release-v0.1.2-14b8a6" alt="Release v0.1.2" /></a>
  <a href="https://github.com/AnanyaP-WDW/BehavLog/releases/tag/v0.1.2"><img src="https://img.shields.io/badge/platforms-macOS%20%7C%20Linux%20%7C%20Windows-334155" alt="macOS Linux Windows" /></a>
  <a href="https://opensource.org/license/gpl-3-0-only"><img src="https://img.shields.io/badge/license-GPL--3.0--only-blue.svg" alt="License GPL-3.0-only" /></a>
</p>

## Overview

BehavLog is a local-first desktop application for frame-accurate video annotation in behavioral science workflows. It combines keypoint labeling, behavior event logging, project-based organization, and exportable research data in a single cross-platform Tauri app.

The latest desktop installers are published on the [latest release page](https://github.com/AnanyaP-WDW/BehavLog/releases/latest), with the current public release available at [v0.1.2](https://github.com/AnanyaP-WDW/BehavLog/releases/tag/v0.1.2).

## Highlights

- **Cross-platform desktop app** built with Tauri for macOS, Linux, and Windows
- **Frame-accurate keypoint annotation** with a default 10-point animal skeleton
- **Behavior logging timeline** for start/stop event recording, editing, notes, and quick review
- **Project library** to organize multiple videos and export data per video or per project
- **Customizable ontology** for both keypoints and behaviors through the settings UI
- **Local-first storage** using IndexedDB in the desktop app, so data stays on the machine by default
- **Keyboard-driven workflow** for high-throughput annotation and review
- **Research-friendly exports** including keypoints, timestamps, behavior definitions, and recorded behaviors

## Latest Release

Download the latest installers from [BehavLog v0.1.2](https://github.com/AnanyaP-WDW/BehavLog/releases/tag/v0.1.2).

| Platform | Installer formats |
|----------|-------------------|
| macOS | `.dmg` |
| Windows | `.msi`, `-setup.exe` |
| Linux | `.AppImage`, `.deb`, `.rpm` |

## Features

### Annotation workflow

- Annotate video frame-by-frame with click placement and direct keypoint removal
- Navigate precisely with keyboard shortcuts and multi-frame stepping
- Copy keypoints from the previous frame to speed up dense annotation tasks
- Toggle skeleton overlays, label visibility, zoom, and keypoint size while reviewing frames

### Behavior workflow

- Record behavior bouts directly on the current timeline using keyboard shortcuts
- Review behaviors in a dedicated sidebar with recent activity, notes, undo, and redo
- Edit start and end frame boundaries by dragging timeline handles
- Configure whether behaviors can overlap

### Projects and data management

- Create projects and assign uploaded videos to a project library
- Re-open stored videos with their annotation state and behavior records
- Export annotations for a single video or a full project as JSON
- Preserve custom keypoint and behavior definitions between sessions

## Quick Start

### Run locally

```bash
npm install
npm run dev
```

### Run the desktop app

Prerequisite: install the stable Rust toolchain and Tauri platform dependencies for your operating system.

```bash
# Sync the Tauri app version from the root VERSION file
npm run sync:version

# Start the desktop app in development mode
npm run tauri:dev

# Build desktop installers
npm run tauri:build
```

### Run with Docker

```bash
docker compose up --build
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9, 0` | Select a default keypoint |
| `Click` | Place point |
| `Space` | Next frame |
| `Shift+Space` | Previous frame |
| `←` / `→` | Navigate frames |
| `V` | Toggle visibility |
| `C` | Copy previous frame keypoints |
| `Del` | Remove selected keypoint |
| `Cmd/Ctrl+S` | Export annotations |
| Behavior hotkeys | Start or stop behavior recording |
| `Esc` | Stop active behavior recording |
| `Cmd/Ctrl+Z` | Undo behavior edits |
| `Cmd/Ctrl+Shift+Z` | Redo behavior edits |

## Default Data Model

### Default keypoints

1. `nose`
2. `left_ear`
3. `right_ear`
4. `neck`
5. `spine_mid`
6. `tail_base`
7. `left_front_paw`
8. `right_front_paw`
9. `left_hind_paw`
10. `right_hind_paw`

### Default behaviors

- Grooming
- Eating
- Drinking
- Sniffing
- Rear (unsupported)
- Rear (wall)
- Walking
- Freezing

## Export Format

BehavLog exports structured JSON with both pose and behavior metadata:

```json
{
  "video_name": "trial_001.mp4",
  "fps": 30,
  "resolution": [640, 480],
  "annotations": [
    {
      "frame_idx": 0,
      "timestamp": 0,
      "keypoints": {
        "nose": { "x": 320, "y": 240, "visible": true, "confidence": 1 }
      }
    }
  ],
  "behavior_definitions": [
    { "id": "grooming", "name": "Grooming", "color": "#ef4444", "key": "g" }
  ],
  "behaviors": [
    {
      "id": "behavior_001",
      "behaviorId": "grooming",
      "startFrame": 12,
      "endFrame": 45
    }
  ]
}
```

## Testing

BehavLog uses `Vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and GitHub Actions CI for automated test runs and coverage artifact uploads.

```bash
npm run test
npm run test:watch
npm run test:coverage
```

You can also run the Docker-backed test commands from the `Makefile`:

```bash
make test
make test-coverage
```

### Current test files

| File | Coverage area |
|------|---------------|
| `src/App.test.tsx` | Main app layout and high-level integration behavior |
| `src/components/__tests__/Header.test.tsx` | Header actions, uploads, and status UI |
| `src/components/__tests__/ControlBar.test.tsx` | Frame controls, zoom, label, and skeleton toggles |
| `src/components/__tests__/KeypointSidebar.test.tsx` | Keypoint selection, removal, and shortcut help |
| `src/constants/keypoints.test.ts` | Default keypoint definitions, skeleton links, and FPS constant |
| `src/utils/export.test.ts` | Video and project export data builders |

## Tech Stack

- React 19
- TypeScript 5
- Vite 5
- Tailwind CSS
- Tauri 2 and Rust for desktop packaging
- Lucide React for UI icons
- Vitest, Testing Library, and jsdom for tests
- Docker for containerized development and test runs
- GitHub Actions for CI and release automation

## Release Automation

- Desktop releases are versioned from the root `VERSION` file
- Pushing an updated `VERSION` to `main` triggers the Tauri release workflow
- GitHub Actions builds installers for macOS, Windows, and Linux and publishes them to a GitHub Release

## Development Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the frontend |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage output |
| `npm run tauri:dev` | Start the Tauri desktop app in development mode |
| `npm run tauri:build` | Build desktop installers |

## Notes

- Annotation data and project metadata are stored locally by default.

