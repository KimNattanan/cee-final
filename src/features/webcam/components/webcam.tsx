"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserResponse } from "@/features/auth/types/users";
import { getUser } from "@/lib/auth";
import * as handGesture from "@/lib/hand-gesture";
import { HandLandmarker } from "@mediapipe/tasks-vision";

export const Webcam = ({
  videoStream,
  userId,
  username,
  email,
  muted = true,
}: {
  videoStream: MediaStream;
  userId: string;
  username: string;
  email: string;
  muted?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const data1HandRef = useRef<any[]>([]);
  const data2HandRef = useRef<any[]>([]);
  const [prediction, setPrediction] = useState<string>("loading...");
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [data1Hand, setData1Hand] = useState<any[]>([]);
  const [data2Hand, setData2Hand] = useState<any[]>([]);

  handLandmarkerRef.current = handLandmarker;
  data1HandRef.current = data1Hand;
  data2HandRef.current = data2Hand;

  useEffect(() => {
    const loadData = async () => {
      const { data1Hand, data2Hand } = await handGesture.loadData();
      setData1Hand(data1Hand);
      setData2Hand(data2Hand);
      const handLandmarker = await handGesture.initMediaPipe();
      setHandLandmarker(handLandmarker);
    }
    loadData();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = videoStream;

    let frameHandle = 0;

    const tick = () => {
      const lm = handLandmarkerRef.current;
      const d1 = data1HandRef.current;
      const d2 = data2HandRef.current;

      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        lm &&
        d1.length > 0 &&
        d2.length > 0
      ) {
        const next = handGesture.predictFromVideo(video, lm, d1, d2);
        setPrediction((prev) => (prev === next ? prev : next));
      } else {
        setPrediction((prev) => (prev === "loading..." ? prev : "loading..."));
      }

      if (typeof video.requestVideoFrameCallback === "function") {
        frameHandle = video.requestVideoFrameCallback(() => tick());
      } else {
        frameHandle = requestAnimationFrame(tick);
      }
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      frameHandle = video.requestVideoFrameCallback(() => tick());
    } else {
      frameHandle = requestAnimationFrame(tick);
    }

    return () => {
      if (typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(frameHandle);
      } else {
        cancelAnimationFrame(frameHandle);
      }
      video.srcObject = null;
    };
  }, [videoStream]);
  return (
    <div>
      <div>{username} ({email})</div>
      <div>
        <video
          ref={videoRef}
          width={320}
          height={240}
          autoPlay
          playsInline
          muted={muted}
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
      <div>Prediction: {prediction}</div>
    </div>
  );
};

export const SelfWebcam = () => {
  const [mediaStream1, setMediaStream1] = useState<MediaStream | null>(null);
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
    };
  }, []);
  return (
    <div>
      {mediaStream1 ? (
        <Webcam videoStream={mediaStream1} userId={user?.userId ?? 'ー'} username={user?.username ?? 'ー'} email={user?.email ?? 'ー'} />
      ) : (
        <div>No webcam found</div>
      )}
    </div>
  );
}