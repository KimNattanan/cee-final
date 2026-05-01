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
    <div>
      <h1>Home</h1>
      <h2>Your ID: {user?.userId}</h2>
      <Link href="/login">
        <Button>Login</Button>
      </Link>
      <Link href="/register">
        <Button>Register</Button>
      </Link>
      <LogoutButton />
      <Link href="/webcam">
        <Button>Webcam</Button>
      </Link>
      <PeerSearch />
    </div>
  );
}
