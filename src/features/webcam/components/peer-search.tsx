"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { useRouter } from "next/navigation";

export const PeerSearch = () => {
  const router = useRouter();
  const [peerId, setPeerId] = useState("");
  const handlePeerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPeerId(e.target.value);
  };
  const handleCall = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push(`/play/${peerId}`);
  };
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-y-4 px-4 py-5 md:max-w-md lg:max-w-lg">
      <h2 className="text-center text-xl font-bold text-gray-50 md:text-2xl">
        Peer Video Call
      </h2>
      
      <Input 
        type="text" 
        placeholder="Peer ID" 
        value={peerId} 
        onChange={handlePeerIdChange} 
        className="h-12 w-full text-lg shadow-inner"
      />
      
      <Button 
        onClick={handleCall} 
        disabled={!peerId.trim()} 
        className="h-12 w-full text-lg"
      >
        Call
      </Button>
    </div>
  );
};