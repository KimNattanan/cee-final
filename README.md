<p align="center">
  <a href='#'>
    <img 
      src="https://raw.githubusercontent.com/KimNattanan/spellcam/refs/heads/main/public/img/spellcam-thumb.png"
      alt="spellcam"
      width="480"
    />
  </a>
</p>

# SpellCam

A full-stack web application that combines **account-based access**, **real-time peer video**, and **camera-driven hand-gesture recognition**. Gestures are classified with MediaPipe and the **predicted label is shown as text** on screen; when the prediction equals the special **ANIME_SPELL** gesture (`[[anime]]`), the UI loads and displays a **random anime image** instead of repeating that token as plain text. During a call, peers synchronize the current prediction and the resolved image URL so both sides see the same illustration.

## Features

- **Authentication** — Register and sign in with credentials stored in MongoDB; sessions use signed JWTs delivered via HTTP-only cookies.
- **Solo webcam** — Local camera feed with continuous hand tracking; shows the predicted gesture as text and loads a random anime image only when **ANIME_SPELL** is detected.
- **Custom gesture recording** — `/record` lets each user create, update, delete, and record their own gesture templates (1-hand, 2-hand, and 2-hand-relate) stored in MongoDB.
- **Peer video calls** — WebRTC (camera + microphone) with Socket.IO signaling on the same process as the Next.js app; canonical rooms pair two authenticated users.
- **Gesture sync** — Over a WebRTC **data channel**, each peer sends the latest predicted label and, only for **ANIME_SPELL**, the fetched anime image URL so the remote feed can render the same picture; other gestures carry an empty image URL and the partner relies on the synced label for matching text.

## Tech stack

| Area | Technologies |
|------|----------------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript |
| Server | Custom Node HTTP server (`server.ts`) hosting Next and [Socket.IO](https://socket.io/) |
| Data | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| Auth | [jose](https://github.com/panva/jose) (JWT), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Vision | [@mediapipe/tasks-vision](https://ai.google.dev/edge/api/mediapipe/js/tasks-vision) Hand Landmarker |
| UI | Tailwind CSS 4, [Radix](https://www.radix-ui.com/) / shadcn-style components, Sonner toasts |

Gesture reference data and model assets are loaded from `public/hand_gesture_detection/` and the MediaPipe CDN.

## Prerequisites

- **Node.js** 20+ recommended  
- **MongoDB** instance (local or Atlas)  
- **Modern Chromium-based browser** recommended for WebRTC and MediaPipe (camera permissions required)

## Getting started

1. **Clone and install**

   ```sh
   git clone https://github.com/KimNattanan/cee-final.git
   cd cee-final
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in real values (see table below).

3. **Run development**

   ```sh
   npm run dev
   ```

   This starts the **custom server** (Next + Socket.IO) with file watching. The app is served at `http://localhost:3000` by default (see `HOSTNAME` / `PORT` in `server.ts` if you change them).

4. **Use the app**

   - Create an account and log in.
   - Open **Webcam** for single-user gesture preview.
   - Open **`/record`** to add custom gestures and capture landmark samples for your account.
   - Start a call by opening **`/play/<peer-user-id>`** so both users join the same signaling room (each uses the other’s user id in the URL).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `NEXT_PUBLIC_API_URL` | Browser-facing API base URL (e.g. `http://localhost:3000/api`) |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES` **or** `JWT_COOKIE_MAX_AGE_SEC` | Token lifetime |
| `NEXT_PUBLIC_SOCKET_URL` | Optional; Socket.IO origin if not same as the page |
| `NEXT_PUBLIC_APP_ORIGIN` | Production browser origin for Socket.IO CORS |
| `FORCE_HTTPS_REDIRECT` | Optional; set to `true` when terminating TLS in front and forcing HTTPS |

Never commit `.env` or real secrets.

## Architecture notes

- **Single process** — HTTP serves Next; Socket.IO attaches to the same server so cookies used for REST auth match signaling connections.
- **WebRTC** — STUN is configured in the client (`stun:stun.l.google.com:19302`). Production deployments often add TURN for restrictive networks.
- **Gesture pipeline** — Video frames drive `detectForVideo`; landmarks are compared to JSON datasets under `public/hand_gesture_detection/`. When the `ANIME_SPELL` gesture is detected, preview images are fetched from `https://api.nekosia.cat/api/v1/images/random` (see `src/lib/random-image.ts`); failures fall back to `/img/note_pc_error.png`.

## Contributing and support

Issues and pull requests are welcome on the repository. When reporting WebRTC problems, include browser, network conditions (e.g. VPN, symmetric NAT), and whether both peers completed signaling (`webrtc:peer-ready`).

---

Repository: [github.com/KimNattanan/cee-final](https://github.com/KimNattanan/cee-final)
