# BehavLog
## A lightweight general purpose animal keypoint and behavior annotation tool

A web-based annotation tool for creating rat behavior training data with keypoint labeling.

## Features

- **10-point skeleton annotation**: Nose, ears, neck, spine, tail base, and all four paws
- **Frame-by-frame navigation**: Precise video control with keyboard shortcuts
- **Skeleton visualization**: Real-time overlay with gradient connections
- **Export to JSON**: Training-ready format with coordinates, visibility, and confidence scores
- **Productivity shortcuts**: Copy from previous frame, toggle visibility, quick keypoint selection
- **Rat behavior annotation**: Frame-by-frame labeling for rat behavior analysis

## Quick Start with Docker

```bash
# Build and run
docker compose up --build

# Access the tool
open http://localhost:3000
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Desktop (Tauri)

Prerequisites:
- Rust toolchain (stable) and platform-specific Tauri dependencies

```bash
# Sync the desktop/app version from the root VERSION file
npm run sync:version

# Run the desktop app in dev mode (starts Vite + Tauri shell)
npm run tauri:dev

# Build desktop installers
npm run tauri:build
```

Notes:
- The app uses IndexedDB; data persists per-user per-app in the Tauri webview.

## Release CI

- Desktop releases are driven by the root `VERSION` file.
- Pushing a commit to `main` that updates `VERSION` triggers the GitHub Actions release workflow.
- The release workflow creates a `v<version>` tag, builds installers on macOS, Windows, and Linux, and publishes them to a GitHub Release with short install notes.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9, 0` | Select keypoint |
| `Click` | Place keypoint |
| `Space` | Next frame |
| `Shift+Space` | Previous frame |
| `←` / `→` | Navigate frames |
| `V` | Toggle visibility |
| `C` | Copy from previous frame |
| `Cmd/Ctrl+S` | Export annotations |

## Keypoints

1. **Nose** - Tip of the snout
2. **Left Ear** - Left ear base
3. **Right Ear** - Right ear base
4. **Neck** - Shoulder center
5. **Spine Mid** - Middle of the back
6. **Tail Base** - Where tail meets body
7. **Left Front Paw** - Left forelimb
8. **Right Front Paw** - Right forelimb
9. **Left Hind Paw** - Left hindlimb
10. **Right Hind Paw** - Right hindlimb

## Export Format

```json
{
  "video_name": "rat_trial_001.mp4",
  "fps": 30,
  "resolution": [640, 480],
  "annotations": [
    {
      "frame_idx": 0,
      "timestamp": 0.0,
      "keypoints": {
        "nose": {"x": 320, "y": 240, "visible": true, "confidence": 1.0},
        "left_ear": {"x": 305, "y": 225, "visible": true, "confidence": 1.0}
      }
    }
  ]
}
```

## Makefile Commands

### Docker Commands

| Command | Action |
|---------|--------|
| `make build` | Build and start containers (`docker compose up --build -d`) |
| `make up` | Start containers in detached mode |
| `make down` | Stop and remove containers |
| `make restart` | Restart containers (down + up) |
| `make logs` | View container logs (follow mode) |
| `make shell` | Open shell in running container |
| `make clean` | Remove containers, volumes, and local images |

### Test Commands

| Command | Action |
|---------|--------|
| `make test` | Run tests in Docker container |
| `make test-watch` | Run tests in watch mode (Docker) |
| `make test-coverage` | Run tests with coverage report (Docker) |
| `make test-local` | Run tests locally (requires npm install) |

### Development Commands

| Command | Action |
|---------|--------|
| `make install` | Install npm dependencies locally |
| `make dev` | Start development server locally |
| `make lint` | Run ESLint |

## Testing

The project uses **Vitest** with **React Testing Library** for UI testing.

```bash
# Run tests locally
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `src/components/__tests__/Header.test.tsx` | 11 | Upload/Export buttons, file input, save status |
| `src/components/__tests__/ControlBar.test.tsx` | 19 | Frame navigation, zoom controls, skeleton toggle |
| `src/components/__tests__/KeypointSidebar.test.tsx` | 19 | Keypoint list, shortcuts, progress bar |
| `src/App.test.tsx` | 9 | Integration tests for main app layout |
| `src/constants/keypoints.test.ts` | 14 | Keypoint definitions, skeleton connections, FPS |

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons
- Vitest + React Testing Library
- Docker + Nginx
