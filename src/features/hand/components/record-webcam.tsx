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
    <div>
      <Input type="text" value={gestureName} onChange={handleChangeName} placeholder="name" />
      <Input type="text" value={gestureText} onChange={handleChangeText} placeholder="text" />
      <Button onClick={handleUpdate} disabled={isUpdating || isDeleting}>Update</Button>
      <Button onClick={handleDelete} disabled={isUpdating || isDeleting}>Delete</Button>
      <Button
        style={{backgroundColor: isSelecting ? 'lightblue' : 'red'}}
        onClick={handleSelect}
        disabled={isUpdating || isDeleting}
      >Select</Button>
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
      <Input type="text" value={newHandgestureName} onChange={handleChangename} placeholder="Gesture Name..." />
      <Input type="text" value={newHandgestureText} onChange={handleChangetext} placeholder="Gesture Text..." />
      <Select value={newHandgestureSelected} onValueChange={(value:string)=>setNewHandgestureSelected(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a gesture" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">one hand</SelectItem>
          <SelectItem value="2">two hand</SelectItem>
          <SelectItem value="3">two hand relate</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleClick} >create new gesture</Button>
      <h2>1 hand</h2>
      {data1Hand.map((d) => (
        <DataBox
          key={d.id}
          id={d.id}
          gestureName={d.gestureName}
          gestureText={d.gestureText}
          setData={setData1Hand}
          handleSelect={()=>handleSelect(d)}
          isSelecting={currentselect?.id === d.id}
          invalidateData={invalidateData}
        />
      ))}
      <h2>2 hand</h2>
      {data2Hand.map((d) => (
        <DataBox
          key={d.id}
          id={d.id}
          gestureName={d.gestureName}
          gestureText={d.gestureText}
          setData={setData2Hand}
          handleSelect={()=>handleSelect(d)}
          isSelecting={currentselect?.id === d.id}
          invalidateData={invalidateData}
        />
      ))}
      <h2>2 hand Relate</h2>
      {data2HandRelate.map((d) => (
        <DataBox
          key={d.id}
          id={d.id}
          gestureName={d.gestureName}
          gestureText={d.gestureText}
          setData={setData2HandRelate}
          handleSelect={()=>handleSelect(d)}
          isSelecting={currentselect?.id === d.id}
          invalidateData={invalidateData}
        />
      ))}
      <div className="flex">
        <span>Delay Time: </span>
        <Input
          className="w-fit"
          type="number"
          value={delayRecordTime ? delayRecordTime/1000 : 0}
          onChange={(e:ChangeEvent<HTMLInputElement>)=>{
            setDelayRecordTime(parseInt(e.target.value)*1000)
          }}
          placeholder="delaytime"
        />
        <span>seconds</span>
        <Button onClick={recordHand} disabled={recording || !currentselect}>{recording ? "Recording..." : "Record"}</Button>
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
        <div>No webcam found</div>
      )}
    </div>
  );
}