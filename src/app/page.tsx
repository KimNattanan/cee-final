"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { PeerSearch } from "@/features/webcam/components/peer-search";
import { getUser } from "@/lib/auth";
import { UserResponse } from "@/features/auth/types/users";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<UserResponse | null>(null);
  useEffect(() => {
    getUser().then(setUser);
  }, []);
  return (
    <div className="w-screen h-screen bg-linear-to-r from-pink-500 via-fuchsia-500 to-purple-500 from-0% to-150% text-3xl text-gray-50 flex flex-col overflow-hidden">
      <div className="flex justify-between w-screen h-min p-5 items-center animate-color-change">
        <h2 className="">Your ID: {user?.userId}</h2>
        <div className="space-x-5 h-max items-center flex">
          <Link href="/login">
          <Button variant={"plant"}>Login</Button>
          </Link>
          <Link href="/register">
          <Button variant={"plant"}>Register</Button>
          </Link>
          <LogoutButton />
          <Link href="/webcam">
          <Button variant={"plant"}>Webcam</Button>
          </Link>
          <Link href="/record">
          <Button variant={"plant"}>Record</Button>
          </Link>
        </div>
      </div>
      <h1 className="justify-self-center p-5 h-25 content-center text-center text-5xl font-extrabold text-animate-color-change bg-amber-50">LET'S PLAY!</h1>
      <div className="p-5 flex-1 overflow-auto justify-items-center content-center">
        <PeerSearch />
      </div>
      <div className="h-20 bg-primary">

      </div>
    </div>
  );
}
