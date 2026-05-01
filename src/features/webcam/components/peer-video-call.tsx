"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import type { UserResponse } from "@/features/auth/types/users";
import { Webcam } from "./webcam";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

function socketUrl(): string {
  const env = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function fetchSelf(): Promise<UserResponse | null> {
  const r = await fetch(`${apiBase()}/users`, { credentials: "include" });
  if (!r.ok) return null;
  const j: { data?: UserResponse } = await r.json();
  return j.data ?? null;
}

type Phase =
  | "loading"
  | "waiting-peer"
  | "connecting"
  | "live"
  | "unauthorized"
  | "error";

export function PeerVideoCall({ peerId }: { peerId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [statusNote, setStatusNote] = useState("");
  const [self, setSelf] = useState<UserResponse | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pc: RTCPeerConnection | null = null;
    let local: MediaStream | null = null;
    let socket: Socket | null = null;

    const pendingSignals: { type: string; payload: unknown }[] = [];
    const iceBuffer: RTCIceCandidateInit[] = [];
    let processedOffer = false;
    let processedAnswer = false;
    let rtcStarted = false;

    async function flushIceBuffer() {
      if (!pc?.remoteDescription) return;
      while (iceBuffer.length > 0) {
        const init = iceBuffer.shift();
        if (!init) break;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(init));
        } catch {
          /* ignore */
        }
      }
    }

    async function tryAddIce(init: RTCIceCandidateInit) {
      if (!pc) return;
      if (!pc.remoteDescription) {
        iceBuffer.push(init);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(init));
      } catch {
        /* ignore */
      }
    }

    async function applySignal(
      type: string,
      payload: unknown,
      amCaller: boolean,
    ) {
      if (!pc) return;
      if (type === "offer") {
        if (amCaller || processedOffer) return;
        processedOffer = true;
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload as RTCSessionDescriptionInit),
        );
        await flushIceBuffer();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit("webrtc:signal", {
          type: "answer",
          payload: pc.localDescription!.toJSON(),
        });
      } else if (type === "answer") {
        if (!amCaller || processedAnswer) return;
        processedAnswer = true;
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload as RTCSessionDescriptionInit),
        );
        await flushIceBuffer();
      } else if (type === "ice") {
        await tryAddIce(payload as RTCIceCandidateInit);
      }
    }

    async function flushPendingSignals(amCaller: boolean) {
      while (pendingSignals.length > 0 && pc && !cancelled) {
        const m = pendingSignals.shift()!;
        await applySignal(m.type, m.payload, amCaller);
      }
    }

    async function setupWebRtc(me: UserResponse, amCaller: boolean) {
      setPhase("connecting");
      setStatusNote("Setting up WebRTC …");

      try {
        local = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (e) {
        setPhase("error");
        setStatusNote(e instanceof Error ? e.message : "Could not open camera");
        toast.error("Could not open camera or microphone");
        return;
      }

      if (cancelled) {
        local.getTracks().forEach((t) => t.stop());
        return;
      }

      setLocalStream(local);

      pc = new RTCPeerConnection(ICE_SERVERS);

      pc.ontrack = (ev) => {
        if (cancelled) return;
        const [remote] = ev.streams;
        if (remote) setRemoteStream(remote);
      };

      pc.onconnectionstatechange = () => {
        if (cancelled || !pc) return;
        if (pc.connectionState === "connected") {
          setPhase("live");
          setStatusNote("Connected");
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setStatusNote(`Connection ${pc.connectionState}`);
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || cancelled) return;
        socket?.emit("webrtc:signal", {
          type: "ice",
          payload: ev.candidate.toJSON(),
        });
      };

      local.getTracks().forEach((track) => pc!.addTrack(track, local!));

      await flushPendingSignals(amCaller);

      if (cancelled || !pc) return;

      if (amCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("webrtc:signal", {
          type: "offer",
          payload: pc.localDescription!.toJSON(),
        });
      }
    }

    void (async () => {
      const me = await fetchSelf();
      if (cancelled) return;

      if (!me) {
        setPhase("unauthorized");
        setStatusNote("Log in to start a call.");
        toast.error("Sign in required");
        return;
      }

      setSelf(me);

      if (me.userId === peerId) {
        setPhase("error");
        setStatusNote(
          "Use the other person’s user id in the path (not your own).",
        );
        return;
      }

      const amCaller = me.userId < peerId;

      setPhase("waiting-peer");
      setStatusNote(
        `Waiting for them to open /play/${encodeURIComponent(me.userId)} …`,
      );

      socket = io(socketUrl(), {
        path: "/socket.io/",
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      socket.on("webrtc:signal", (msg: { type: string; payload: unknown }) => {
        if (cancelled) return;
        if (!pc) {
          pendingSignals.push(msg);
          return;
        }
        void applySignal(msg.type, msg.payload, amCaller);
      });

      socket.on("webrtc:error", (msg: { message?: string }) => {
        toast.error(msg.message ?? "WebRTC room error");
      });

      socket.on("connect_error", (err: Error) => {
        if (!cancelled) {
          toast.error(err.message || "Could not connect to signaling server");
          setPhase("error");
          setStatusNote(err.message ?? "Socket connection failed");
        }
      });

      socket.on("connect", () => {
        socket?.emit("webrtc:join", { peerId });
      });

      socket.on("webrtc:peer-ready", () => {
        if (cancelled || rtcStarted) return;
        rtcStarted = true;
        void setupWebRtc(me, amCaller);
      });
    })();

    return () => {
      cancelled = true;
      socket?.removeAllListeners();
      socket?.disconnect();
      pc?.close();
      local?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [peerId]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm text-muted-foreground">
        <div>
          Calling user id: <code className="text-foreground">{peerId}</code>
        </div>
        <div className="mt-1">{statusNote}</div>
      </div>

      {phase === "unauthorized" || phase === "error" ? null : (
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <p className="mb-2 text-sm font-medium">You</p>
            {localStream && self ? (
              <Webcam
                videoStream={localStream}
                userId={self.userId}
                username={self.username}
                email={self.email}
                muted
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {phase === "waiting-peer" ? "Camera starts after peer joins." : "…"}
              </div>
            )}
          </section>
          <section>
            <p className="mb-2 text-sm font-medium">Peer</p>
            {remoteStream && self ? (
              <Webcam
                videoStream={remoteStream}
                userId={peerId}
                username="Peer"
                email={`id: ${peerId}`}
                muted={false}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {phase === "waiting-peer"
                  ? "Waiting…"
                  : "Remote video appears when the connection is ready."}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
