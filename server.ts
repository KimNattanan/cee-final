import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import {
  AUTH_COOKIE_NAME,
  decodeAuthToken,
  type AuthTokenClaims,
} from "./src/lib/auth-token";
import { canonicalRoomId } from "./src/lib/webrtc-canonical";

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return undefined;
}

type SocketData = {
  claims: AuthTokenClaims;
  roomId?: string;
};

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin:
        dev || !process.env.NEXT_PUBLIC_APP_ORIGIN
          ? true
          : process.env.NEXT_PUBLIC_APP_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie;
      const token = readCookie(raw, AUTH_COOKIE_NAME);
      if (!token) {
        next(new Error("Unauthorized"));
        return;
      }
      const claims = await decodeAuthToken(token);
      if (!claims) {
        next(new Error("Unauthorized"));
        return;
      }
      (socket.data as SocketData).claims = claims;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const data = socket.data as SocketData;

    socket.on(
      "webrtc:join",
      async ({ peerId }: { peerId?: string }, ack?: (err?: string) => void) => {
        const claims = data.claims;
        if (!peerId || typeof peerId !== "string" || peerId.trim() === "") {
          socket.emit("webrtc:error", { message: "Invalid peer" });
          ack?.("Invalid peer");
          return;
        }
        if (peerId === claims.userId) {
          socket.emit("webrtc:error", { message: "Cannot call yourself" });
          ack?.("Cannot call yourself");
          return;
        }

        const roomId = canonicalRoomId(claims.userId, peerId);

        const existing = await io.in(roomId).fetchSockets();
        for (const s of existing) {
          const prevClaims = (s.data as SocketData).claims;
          if (prevClaims?.userId === claims.userId) {
            s.leave(roomId);
            s.disconnect(true);
          }
        }

        socket.join(roomId);
        data.roomId = roomId;

        const size = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
        if (size >= 2) {
          io.to(roomId).emit("webrtc:peer-ready");
        }

        ack?.();
      },
    );

    socket.on(
      "webrtc:signal",
      ({
        type,
        payload,
      }: {
        type?: string;
        payload?: unknown;
      }) => {
        const roomId = data.roomId;
        if (
          !roomId ||
          !type ||
          !["offer", "answer", "ice"].includes(type)
        ) {
          return;
        }
        socket.to(roomId).emit("webrtc:signal", { type, payload });
      },
    );

    socket.on("disconnecting", () => {
      const roomId = data.roomId;
      if (roomId) {
        void socket.leave(roomId);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`Ready on http://${hostname}:${port}`);
  });
});
