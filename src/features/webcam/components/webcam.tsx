"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserResponse } from "@/features/auth/types/users";
import { getUser } from "@/lib/auth";

export const Webcam = (
  { videoStream, userId, username, email }:
  { videoStream: MediaStream, userId: string, username: string, email: string }
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = videoStream;
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [videoStream]);
  return (
    <div>
      <div>{username} ({email})</div>
      <div>
        <video ref={videoRef} width="320" height="240" autoPlay></video>
      </div>
    </div>
  );
};

export const DualWebcam = () => {
  const [mediaStream1, setMediaStream1] = useState<MediaStream | null>(null);
  const [mediaStream2, setMediaStream2] = useState<MediaStream | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  useEffect(() => {
    const streams: MediaStream[] = [];
    let cancelled = false;

    getUser().then(setUser);

    (async () => {
      try {
        const stream1 = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream1.getTracks().forEach((t) => t.stop());
          return;
        }
        streams.push(stream1);
        setMediaStream1(stream1);

        const stream2 = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream2.getTracks().forEach((t) => t.stop());
          stream1.getTracks().forEach((t) => t.stop());
          return;
        }
        streams.push(stream2);
        setMediaStream2(stream2);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error accessing webcam');
      }
    })();

    return () => {
      cancelled = true;
      streams.forEach((stream) =>
        stream.getTracks().forEach((track) => track.stop()),
      );
      setMediaStream1(null);
      setMediaStream2(null);
    };
  }, []);
  return (
    <div>
      {mediaStream1 ? (
        <Webcam videoStream={mediaStream1} userId={user?.userId ?? 'ー'} username={user?.username ?? 'ー'} email={user?.email ?? 'ー'} />
      ) : (
        <div>No webcam found</div>
      )}
      {mediaStream2 ? (
        <Webcam videoStream={mediaStream2} userId={user?.userId ?? 'ー'} username={user?.username ?? 'ー'} email={user?.email ?? 'ー'} />
      ) : (
        <div>No webcam found</div>
      )}
    </div>
  );
}