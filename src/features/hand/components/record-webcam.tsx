"use client";

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserResponse } from "@/features/auth/types/users";
import { getUser } from "@/lib/auth";
import * as handGesture from "@/lib/hand-gesture";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { HandGestureResponse, PatchHandData } from "../types/hand";
import { Input } from "@/components/ui/input";
import { updateHand } from "../api/update-hand";
import { deleteHand } from "../api/delete-hand";
import { Select } from "@/components/ui/select";
import { SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
import { SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DataBox = ({
  id, gestureName, gestureText, setData, handleSelect, isSelecting, invalidateData
} : {
  id: string;
  gestureName: string;
  gestureText: string;
  setData: Dispatch<SetStateAction<HandGestureResponse[]>>;
  handleSelect: (e:MouseEvent<HTMLButtonElement>) => void;
  isSelecting: boolean;
  invalidateData: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleChangeName = (e:ChangeEvent<HTMLInputElement>) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, gestureName: e.target.value } : item));
  };
  const handleChangeText = (e:ChangeEvent<HTMLInputElement>) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, gestureText: e.target.value } : item));
  };
  const handleUpdate = async (e:MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await updateHand({ id, gestureName, gestureText } as PatchHandData);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDelete = async (e:MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      const response = await deleteHand(id);
      toast.success(response.message);
      invalidateData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className={`flex flex-col gap-3 p-3 border-2 rounded-xl bg-white/5 shadow-sm transition-all ${isSelecting ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
      
      <div className="flex flex-col gap-2">
        <div className="relative">
          <span className="absolute -top-2 left-2 bg-gray-100/90 rounded-xl px-1 text-[10px] text-black uppercase">Name</span>
          <Input 
            type="text" 
            value={gestureName} 
            onChange={handleChangeName} 
            placeholder="Gesture Name" 
            className="h-9 text-sm bg-transparent"
          />
        </div>
        <div className="relative">
          <span className="absolute -top-2 left-2 bg-gray-100/90 rounded-xl px-1 text-[10px] text-black uppercase">Output Text</span>
          <Input 
            type="text" 
            value={gestureText} 
            onChange={handleChangeText} 
            placeholder="Display Text" 
            className="h-9 text-sm bg-transparent"
          />
        </div>
      </div>

      <div className="gap-2 justify-items-center">
        <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleUpdate} 
            disabled={isUpdating || isDeleting}
            className="h-8 text-xs"
          >
            Update
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleDelete} 
            disabled={isUpdating || isDeleting}
            className="h-8 text-xs border-1 border-red-500 bg-red-950/40 text-red-500"
          >
            Delete
          </Button>
        </div>
        <Button 
          size="sm"
          onClick={handleSelect} 
          disabled={isUpdating || isDeleting} 
          className={`col-span-2 h-8 text-xs transition-colors ${
            isSelecting 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isSelecting ? 'Deselect (Current)' : 'Select for Training'}
        </Button>
      </div>
    </div>
  )
}

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
  const data1HandRef = useRef<HandGestureResponse[]>([]);
  const data2HandRef = useRef<HandGestureResponse[]>([]);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [currentselect,setcurrentselect] = useState<HandGestureResponse | null>(null);
  const [data1Hand, setData1Hand] = useState<HandGestureResponse[]>([]);
  const [data2Hand, setData2Hand] = useState<HandGestureResponse[]>([]);
  const [data2HandRelate, setData2HandRelate] = useState<HandGestureResponse[]>([]);
  const [recording, setrecording] = useState(false);
  const [delayRecordTime,setDelayRecordTime] = useState(5000)

  handLandmarkerRef.current = handLandmarker;
  data1HandRef.current = data1Hand;
  data2HandRef.current = data2Hand;

  const handleSelect = (d:HandGestureResponse) => {
    setcurrentselect(currentselect => currentselect?.id === d.id ? null : d);
  };

  async function recordHand() {
    console.log(recording, currentselect);
    if(recording){return;}
    if(!currentselect){
        return
    }
    setrecording(true);
    await sleep(delayRecordTime);
    const video = videoRef.current;
    const lm = handLandmarkerRef.current;

    if (video && lm) {
        const result = await handGesture.getLandmark(video, lm, currentselect.handmode);
        if(result.length>0){
          await updateHand({ id:currentselect.id, landmark:result });
        }
    }
    setrecording(false);
  }

  const loadData = async () => {
    const { data1Hand, data2Hand,data2HandRelate } = await handGesture.loadData();
    setData1Hand(data1Hand);
    setData2Hand(data2Hand);
    setData2HandRelate(data2HandRelate);
    const handLandmarker = await handGesture.initMediaPipe();
    setHandLandmarker(handLandmarker);
  }

  const invalidateData = () => {
    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  const [newHandgestureName, setNewHandgestureName] = useState("");
  const [newHandgestureText, setNewHandgestureText] = useState("");
  const [newHandgestureSelected, setNewHandgestureSelected] = useState("1");
  const handleChangename = (e:ChangeEvent<HTMLInputElement>) => {
      setNewHandgestureName(e.target.value);
  };
  const handleChangetext = (e:ChangeEvent<HTMLInputElement>) => {
      setNewHandgestureText(e.target.value);
  };
  const handleChangeselected = (e: ChangeEvent<HTMLSelectElement>) => {
      setNewHandgestureSelected(e.target.value);
  };
  const handleClick = async (e:MouseEvent<HTMLButtonElement>) => {
      if(newHandgestureName!==""){
          const r = await fetch(`${apiBase()}/hand`, {method:"POST", credentials: "include",headers: {
              'Content-Type': 'application/json', // Inform the server we are sending JSON
          },body: JSON.stringify({
              gestureName:newHandgestureName,
              gestureText:newHandgestureText,
              handmode:parseInt(newHandgestureSelected)
          }) });
          setNewHandgestureName("");
          setNewHandgestureText("");
          if(r.ok && r.status==200){
              const json = await r.json();
              if(newHandgestureSelected==="1"){
                  setData1Hand([...data1Hand,json.data])
              }
              else if(newHandgestureSelected==="2"){
                  setData2Hand([...data2Hand,json.data])
              }
              else if(newHandgestureSelected==="3"){
                  setData2HandRelate([...data2HandRelate,json.data])
              }
          }
      }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = videoStream;

    let frameHandle = 0;

    const tick = () => {
      const lm = handLandmarkerRef.current;
      const d1 = data1HandRef.current;
      const d2 = data2HandRef.current;

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
    <div className="flex max-w-full flex-col items-center gap-y-8 py-5">
      
      <div className="flex w-full flex-col gap-2 px-5 text-sm sm:flex-row sm:justify-between sm:text-base">
        <p className="font-medium">Username: <span className="font-normal opacity-90">{username}</span></p>
        <p className="font-medium">Email: <span className="font-normal opacity-90">{email}</span></p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-6 px-5 lg:flex-row lg:items-start lg:gap-10">
        
        <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border-2 border-white/20 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="h-auto w-full"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
          
        <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur-md lg:p-6">
          <h3 className="text-lg font-bold">New Gesture</h3>
          <Input type="text" value={newHandgestureName} onChange={handleChangename} placeholder="Gesture Name..." className="h-11" />
          <Input type="text" value={newHandgestureText} onChange={handleChangetext} placeholder="Gesture Text..." className="h-11" />
          
          <p className="text-[12px] text-amber-200/80 md:text-sm">
            Tip: Use <span className="font-mono">"[[anime]]"</span> for Anime Gesture
          </p>

          <Select value={newHandgestureSelected} onValueChange={(value:string)=>setNewHandgestureSelected(value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a gesture" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              <SelectItem value="1">one hand</SelectItem>
              <SelectItem value="2">two hand</SelectItem>
              <SelectItem value="3">two hand relate</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleClick} className="h-11 w-full bg-primary hover:bg-primary/80">
            Create New Gesture
          </Button>
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-4 border-y border-white/10 py-6 px-5">
        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap">Delay Time:</span>
          <Input
            className="w-20 text-center"
            type="number"
            value={delayRecordTime ? delayRecordTime/1000 : 0}
            onChange={(e:ChangeEvent<HTMLInputElement>)=>{
              setDelayRecordTime(parseInt(e.target.value)*1000)
            }}
          />
          <span>seconds</span>
        </div>
        
        <Button 
          onClick={recordHand} 
          disabled={recording || !currentselect}
          variant={recording ? "destructive" : "default"}
          className="min-w-[140px] shadow-lg transition-all"
        >
          {recording ? "● Recording..." : "Start Record"}
        </Button>
      </div>  

      <div className="grid w-full grid-cols-1 gap-6 px-5 md:grid-cols-2 lg:grid-cols-3">
        
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-500/20 p-5 shadow-inner">
          <h2 className="text-xl font-bold border-b border-red-500/30 w-full text-center pb-2">1 Hand</h2>
          <div className="w-full space-y-3">
            {data1Hand.map((d) => (
              <DataBox
              key={d.id} {...d}
              setData={setData1Hand}
              handleSelect={()=>handleSelect(d)}
              isSelecting={currentselect?.id === d.id}
              invalidateData={invalidateData} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl bg-blue-500/20 p-5 shadow-inner">
          <h2 className="text-xl font-bold border-b border-blue-500/30 w-full text-center pb-2">2 Hand</h2>
          <div className="w-full space-y-3">
            {data2Hand.map((d) => (
              <DataBox
              key={d.id} {...d}
              setData={setData2Hand}
              handleSelect={()=>handleSelect(d)} 
              isSelecting={currentselect?.id === d.id}
              invalidateData={invalidateData} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl bg-purple-500/20 p-5 shadow-inner">
          <h2 className="text-xl font-bold border-b border-purple-500/30 w-full text-center pb-2">2 Hand Relate</h2>
          <div className="w-full space-y-3">
            {data2HandRelate.map((d) => (
              <DataBox
              key={d.id} {...d}
              setData={setData2HandRelate}
              handleSelect={()=>handleSelect(d)}
              isSelecting={currentselect?.id === d.id}
              invalidateData={invalidateData} />
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export const SelfWebcam = () => {
  const [mediaStream1, setMediaStream1] = useState<MediaStream | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  useEffect(() => {
    const streams: MediaStream[] = [];
    let cancelled = false;

    getUser().then((user) => setUser(user ?? null));

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
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div>No webcam found</div>
        </div>
      )}
    </div>
  );
}