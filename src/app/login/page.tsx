import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";

export default function Login() {
  return (
    <div className="w-screen h-screen space-y-5 bg-linear-to-bl from-blue-400 via-fuchsia-500 to-pink-500 text-cyan-50 text-3xl flex flex-col">
      <div className="w-screen p-5">
        <h1 className="text-pink-500 text-4xl font-extrabold justify-self-center">Login</h1>
        <Link href="/">
          <Button className="justify-self-start">Back</Button>
        </Link>
      </div>
      <div className="items-center justify-center p-10">
        <LoginForm/>
      </div>
    </div>
  );
}
