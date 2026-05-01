import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function Home() {
  
  return (
    <div>
      <h1>Home</h1>
      <Link href="/login">
        <Button>Login</Button>
      </Link>
      <Link href="/register">
        <Button>Register</Button>
      </Link>
      <LogoutButton />
      <Link href="/webrtc">
        <Button>WebRTC</Button>
      </Link>
    </div>
  );
}
