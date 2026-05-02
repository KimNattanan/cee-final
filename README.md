# Comess (cee-final)

A full-stack web application that combines **account-based access**, **real-time peer video**, and **camera-driven hand-gesture recognition**. Gestures are classified with MediaPipe and mapped to themed preview images; during a call, preview selections are synchronized between peers so both sides see the same artwork when labels agree.

## Features

- **Authentication** — Register and sign in with credentials stored in MongoDB; sessions use signed JWTs delivered via HTTP-only cookies.
- **Solo webcam** — Local camera feed with continuous hand tracking and gesture-based preview images.
- **Peer video calls** — WebRTC (camera + microphone) with Socket.IO signaling on the same process as the Next.js app; canonical rooms pair two authenticated users.
- **Gesture sync** — Each caller publishes their chosen preview URL over the signaling channel so the remote participant can reuse the same image when the predicted label matches.

## Tech stack

| Area | Technologies |
|------|----------------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript |
| Server | Custom Node HTTP server (`server.ts`) hosting Next and [Socket.IO](https://socket.io/) |
| Data | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| Auth | [jose](https://github.com/panva/jose) (JWT), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Vision | [@mediapipe/tasks-vision](https://google.github.io/mediapipe/) Hand Landmarker |
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
- **Gesture pipeline** — Video frames drive `detectForVideo`; landmarks are compared to JSON datasets under `public/hand_gesture_detection/`. Preview images are fetched from an external API (see `src/lib/random-image.ts`); failures fall back to a local placeholder.

## Contributing and support

Issues and pull requests are welcome on the repository. When reporting WebRTC problems, include browser, network conditions (e.g. VPN, symmetric NAT), and whether both peers completed signaling (`webrtc:peer-ready`).

---

Repository: [github.com/KimNattanan/cee-final](https://github.com/KimNattanan/cee-final)
