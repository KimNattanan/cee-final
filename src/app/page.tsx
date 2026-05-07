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
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[url('/img/background_1.jpg')] bg-cover bg-center bg-no-repeat text-xl text-gray-50 md:text-3xl">
  
      <div className="animate-color-change flex w-full flex-col items-center gap-y-4 py-5 md:flex-row md:justify-between md:px-10">
        
        <div className="w-full px-5 text-center md:w-auto md:text-left">
          <h2 className="text-sm font-medium md:text-xl">Your ID: {user?.userId}</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 px-5 md:justify-end">
          {user?.userId ? (
            <LogoutButton />
          ) : (
            <Link href="/login">
              <Button variant="plant" className="px-3 py-1 text-sm md:text-base">Login</Button>
            </Link>
          )}
          
          <Link href="/register">
            <Button variant="plant" className="px-3 py-1 text-sm md:text-base">Register</Button>
          </Link>
          
          <Link href="/webcam">
            <Button variant="plant" className="px-3 py-1 text-sm md:text-base">Webcam</Button>
          </Link>
          
          <Link href="/record">
            <Button variant="plant" className="px-3 py-1 text-sm md:text-base">Record</Button>
          </Link>
        </div>
      </div>

      <h1 className="text-animate-color-change flex h-20 items-center justify-center p-5 text-center text-4xl font-extrabold bg-amber-50/80 md:h-28 md:text-6xl">
        -SpellCam-
      </h1>

      <div className="bg-primary/30 flex flex-1 flex-col items-center justify-center overflow-auto p-4 md:p-10">
        <div className="w-full max-w-6xl justify-items-center">
          <PeerSearch />
        </div>
      </div>

      <div className="h-16 w-full bg-primary md:h-20" />
    </div>
  );
}
