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
    <div className="w-[50vw]">
      <h2>Peer Video Call</h2>
      <Input type="text" placeholder="Peer ID" value={peerId} onChange={handlePeerIdChange} />
      <Button onClick={handleCall} disabled={!peerId.trim()} className="w-[50vw]">Call</Button>
    </div>
  );
};