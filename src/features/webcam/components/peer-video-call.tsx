"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const socketRef = useRef<Socket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const latestGestureRef = useRef<{ prediction: string; imageUrl: string } | null>(
    null,
  );
  const [peerGesturePreview, setPeerGesturePreview] = useState<{
    prediction: string;
    imageUrl: string;
  } | null>(null);

  const emitGesturePreview = useCallback((prediction: string, imageUrl: string) => {
    latestGestureRef.current = { prediction, imageUrl };
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") return;
    channel.send(JSON.stringify({ type: "gesture-preview", prediction, imageUrl }));
  }, []);

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
    let dataChannel: RTCDataChannel | null = null;

    const bindDataChannel = (ch: RTCDataChannel) => {
      dataChannel = ch;
      dataChannelRef.current = ch;

      ch.onopen = () => {
        const latest = latestGestureRef.current;
        if (!latest) return;
        ch.send(
          JSON.stringify({
            type: "gesture-preview",
            prediction: latest.prediction,
            imageUrl: latest.imageUrl,
          }),
        );
      };

      ch.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(ev.data as string) as {
            type?: string;
            prediction?: string;
            imageUrl?: string;
          };
          if (
            parsed.type !== "gesture-preview" ||
            typeof parsed.prediction !== "string" ||
            typeof parsed.imageUrl !== "string"
          ) {
            return;
          }
          const prediction = parsed.prediction;
          const imageUrl = parsed.imageUrl;
          setPeerGesturePreview({ prediction, imageUrl });
        } catch {
          // Ignore malformed data-channel messages.
        }
      };
    };

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
      if (amCaller) {
        bindDataChannel(pc.createDataChannel("gesture-preview"));
      } else {
        pc.ondatachannel = (event) => {
          bindDataChannel(event.channel);
        };
      }

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

      socketRef.current = socket;

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
      socketRef.current = null;
      dataChannelRef.current = null;
      latestGestureRef.current = null;
      setPeerGesturePreview(null);
      dataChannel?.close();
      socket?.removeAllListeners();
      socket?.disconnect();
      pc?.close();
      local?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [peerId]);

  return (
    <div className="flex flex-col w-full min-h-full h-full gap-4 p-2 md:p-4 overflow-hidden">
      
      <div className="text-xs md:text-sm text-muted-foreground shrink-0 w-full bg-white/5 p-2 rounded-lg">
        <div className="truncate">
          Calling user id: <code className="text-primary font-mono">{peerId}</code>
        </div>
        <div className="mt-1 font-medium italic">{statusNote}</div>
      </div>

      <div className="flex-1 min-h-0">
        {phase === "unauthorized" || phase === "error" ? (
          <div className="flex h-full items-center justify-center text-destructive">
            Connection Error or Unauthorized
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full min-h-0">
            
            <section className="flex flex-col min-h-0 h-full">
              <p className="mb-2 text-lg md:text-2xl text-blue-800 font-bold shrink-0 bg-blue-500/50 rounded-xl md:rounded-2xl text-center py-1">
                You
              </p>
              <div className="flex-1 min-h-[200px] md:min-h-0 bg-blue-800/20 rounded-xl overflow-hidden relative">
                {localStream && self ? (
                  <Webcam
                    videoStream={localStream}
                    userId={self.userId}
                    username={self.username}
                    email={self.email}
                    muted
                    onPredictionImageReady={emitGesturePreview}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-4 text-sm text-muted-foreground">
                    {phase === "waiting-peer" ? "Camera starts after peer joins." : "Loading camera…"}
                  </div>
                )}
              </div>
            </section>

            <section className="flex flex-col min-h-0 h-full">
              <p className="mb-2 text-lg md:text-2xl text-red-800 font-bold shrink-0 bg-red-500/50 rounded-xl md:rounded-2xl text-center py-1">
                Peer
              </p>
              <div className="flex-1 min-h-[200px] md:min-h-0 bg-red-800/20 rounded-xl overflow-hidden relative">
                {remoteStream && self ? (
                  <Webcam
                    videoStream={remoteStream}
                    userId={peerId}
                    username="Peer"
                    email={`id: ${peerId}`}
                    muted={false}
                    predictEnabled={false}
                    remotePrediction={peerGesturePreview?.prediction}
                    remoteImageUrl={peerGesturePreview?.imageUrl}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-4 text-sm text-muted-foreground">
                    {phase === "waiting-peer"
                      ? "Waiting for peer to join…"
                      : "Remote video appears when ready."}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
