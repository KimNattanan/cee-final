"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserResponse } from "@/features/auth/types/users";
import { getUser } from "@/lib/auth";
import * as handGesture from "@/lib/hand-gesture";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import { randomImageUrl } from "@/lib/random-image";

export const Webcam = ({
  videoStream,
  userId,
  username,
  email,
  muted = true,
  /** Disable local prediction and render externally supplied prediction/image instead. */
  predictEnabled = true,
  remotePrediction,
  remoteImageUrl,
  /** After resolving an image for this feed, publish so the call partner can reuse it. */
  onPredictionImageReady,
}: {
  videoStream: MediaStream;
  userId: string;
  username: string;
  email: string;
  muted?: boolean;
  predictEnabled?: boolean;
  remotePrediction?: string;
  remoteImageUrl?: string;
  onPredictionImageReady?: (prediction: string, imageUrl: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const data1HandRef = useRef<any[]>([]);
  const data2HandRef = useRef<any[]>([]);
  const data2HandRelateRef = useRef<any[]>([]);
  const [prediction, setPrediction] = useState<string>("loading...");
  /** Bumps when prediction becomes a new label so loremflickr URLs are not browser-cached. */
  const [loremCacheBust, setLoremCacheBust] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [data1Hand, setData1Hand] = useState<any[]>([]);
  const [data2Hand, setData2Hand] = useState<any[]>([]);
  const [data2HandRelate, setData2HandRelate] = useState<any[]>([]);

  handLandmarkerRef.current = handLandmarker;
  data1HandRef.current = data1Hand;
  data2HandRef.current = data2Hand;
  data2HandRelateRef.current = data2HandRelate;

  useEffect(() => {
    if (!predictEnabled) return;
    const loadData = async () => {
      const { data1Hand, data2Hand,data2HandRelate } = await handGesture.loadData();
      setData1Hand(data1Hand);
      setData2Hand(data2Hand);
      setData2HandRelate(data2HandRelate)
      const handLandmarker = await handGesture.initMediaPipe();
      setHandLandmarker(handLandmarker);
    }
    loadData();
  }, [predictEnabled]);

  const effectivePrediction = predictEnabled
    ? prediction
    : (remotePrediction ?? "searching...");

  const showLoremPreview =
    effectivePrediction !== "loading..." &&
    effectivePrediction !== "unknown" &&
    effectivePrediction !== "need both hands" &&
    effectivePrediction !== "searching...";

  useEffect(() => {
    if (!predictEnabled) return;
    if (showLoremPreview) {
      setLoremCacheBust((n) => n + 1);
      (async () => {
        if(prediction === handGesture.ANIME_SPELL){
          const url = await randomImageUrl();
          setImageUrl(url);
          onPredictionImageReady?.(handGesture.ANIME_SPELL, url);
        } else {
          setImageUrl("");
          onPredictionImageReady?.(prediction, "");
        }
      })();
    } else {
      setImageUrl("");
      onPredictionImageReady?.(prediction, "");
    }
  }, [prediction, showLoremPreview, onPredictionImageReady, predictEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = videoStream;

    let frameHandle = 0;

    if (!predictEnabled) {
      return () => {
        video.srcObject = null;
      };
    }

    const tick = () => {
      const lm = handLandmarkerRef.current;
      const d1 = data1HandRef.current || [];
      const d2 = data2HandRef.current || [];
      const d3 = data2HandRelateRef.current || [];
      
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        lm &&
        d1.length >= 0 &&
        d2.length >= 0 && 
        d3.length >= 0
      ) {
        const next = handGesture.predictFromVideo(video, lm, d1, d2,d3);
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
  }, [videoStream, predictEnabled]);

  const displayImageUrl =
    predictEnabled ? imageUrl : (remoteImageUrl ?? "");

  return (
    <div className="flex">
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
      </div>
      {showLoremPreview && displayImageUrl && displayImageUrl.length > 0 && (
        <div className="relative w-[300px] h-[300px] overflow-hidden">
          <div
            className="absolute inset-0 animate-spin"
            style={{
              backgroundImage: "url('/img/loading.png')",
              backgroundSize: '30%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              animationDirection: 'normal',
            }}
          />
          <img
            key={`${effectivePrediction}-${loremCacheBust}-${displayImageUrl.slice(-24)}`}
            src={displayImageUrl}
            alt="Prediction"
            className="relative z-10 w-full h-full object-cover"
          />
        </div>
      )}
      {showLoremPreview && effectivePrediction !== handGesture.ANIME_SPELL && (
        <div className="content-center ml-4">
          <div className="bg-white border border-black text-black rounded-lg p-2 max-w-80 break-all">
            {effectivePrediction}
          </div>
        </div>
      )}
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