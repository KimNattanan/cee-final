"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserResponse } from "@/features/auth/types/users";
import { getUser } from "@/lib/auth";
import * as handGesture from "@/lib/hand-gesture";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import { MouseEvent } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
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
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [currentselect,setcurrentselect] = useState<any>();
  const [data1Hand, setData1Hand] = useState<any[]>([]);
  const [data2Hand, setData2Hand] = useState<any[]>([]);
  const [data2HandRelate, setData2HandRelate] = useState<any[]>([]);
  const [recording, setrecording] = useState(false);
  const [delayRecordTime,setDelayRecordTime] = useState(5000)

  handLandmarkerRef.current = handLandmarker;
  data1HandRef.current = data1Hand;
  data2HandRef.current = data2Hand;

  async function recordHand() {
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
        console.log(result)
        if(result.length>0){
            await fetch(`${apiBase()}/hand`, {method:"PATCH", credentials: "include",headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },body: JSON.stringify({
                id:currentselect.id,
                landmark:result
            }) });
        }
        
        
    }
    setrecording(false);
  }

  useEffect(() => {
    const loadData = async () => {
      const { data1Hand, data2Hand,data2HandRelate } = await handGesture.loadData();
      setData1Hand(data1Hand);
      setData2Hand(data2Hand);
      setData2HandRelate(data2HandRelate);
      const handLandmarker = await handGesture.initMediaPipe();
      setHandLandmarker(handLandmarker);
    }
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
                    setData1Hand([...data2Hand,json.data])
                }
                else if(newHandgestureSelected==="3"){
                    setData1Hand([...data2HandRelate,json.data])
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
      <input 
        type="text" 
        value={newHandgestureName} 
        onChange={handleChangename} 
        placeholder="Type a message..."
      />
      <input 
        type="text" 
        value={newHandgestureText} 
        onChange={handleChangetext} 
        placeholder="Type a message..."
      />
      <select value={newHandgestureSelected} onChange={handleChangeselected}>
        <option value="1">onehand</option>
        <option value="2">twohand</option>
        <option value="3">twohandrelate</option>
      </select>
      <button onClick={handleClick} >create new gesture</button>
      <h2>1 hand</h2>
      {data1Hand.map((d) => (
        <div>
            <input type="text" value={d.gestureName} onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData1Hand(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureName: e.target.value } : item)
                );
            }} placeholder="name" />
            <input type="text" value={d.gestureText} onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData1Hand(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureText: e.target.value } : item)
                );
            }} placeholder="name" />
            <button onClick={async ()=>{await fetch(`${apiBase()}/hand`, {method:"PATCH", credentials: "include",headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },body: JSON.stringify({
                id:d.id,
                gestureName:d.gestureName,
                gestureText:d.gestureText
            }) });}}>update</button>
            <button style={{backgroundColor: (currentselect && currentselect.id === d.id) ? 'lightblue' : 'red'}} onClick={()=>{setcurrentselect(d)}}>select</button>
        </div>
      ))}
      <h2>2 hand</h2>
      {data2Hand.map((d) => (
        <div>
            <input type="text" onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData2Hand(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureName: e.target.value } : item)
                );
            }} value={d.gestureName} placeholder="name" />
            <input type="text"  onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData2Hand(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureText: e.target.value } : item)
                );
            }} value={d.gestureText} placeholder="name" />
            <button onClick={async ()=>{await fetch(`${apiBase()}/hand`, {method:"PATCH", credentials: "include",headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },body: JSON.stringify({
                id:d.id,
                gestureName:d.gestureName,
                gestureText:d.gestureText
            }) });}}>update</button>
            <button style={{backgroundColor: currentselect.id === d.id ? 'lightblue' : 'red'}} onClick={()=>{setcurrentselect(d)}}>select</button>
        </div>
      ))}
      <h2>2 hand Relate</h2>
      {data2HandRelate.map((d) => (
        <div>
            <input type="text" onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData2HandRelate(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureName: e.target.value } : item)
                );
            }} value={d.gestureName} placeholder="name" />
            <input type="text" onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setData2HandRelate(prev => 
                    prev.map(item => item.id === d.id ? { ...item, gestureText: e.target.value } : item)
                );
            }} value={d.gestureText} placeholder="name" />
            <button onClick={async ()=>{await fetch(`${apiBase()}/hand`, {method:"PATCH", credentials: "include",headers: {
                'Content-Type': 'application/json', // Inform the server we are sending JSON
            },body: JSON.stringify({
                id:d.id,
                gestureName:d.gestureName,
                gestureText:d.gestureText
            }) });}}>update</button>
            <button style={{backgroundColor: currentselect.id === d.id ? 'lightblue' : 'red'}} onClick={()=>{if(!recording)setcurrentselect(d)}}>select</button>
        </div>
      ))}
      <input type="number" value={delayRecordTime ? delayRecordTime/1000 : 0} onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                setDelayRecordTime(parseInt(e.target.value)*1000)
            }} placeholder="delaytime" />
      <button onClick={recordHand}>Record</button>
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