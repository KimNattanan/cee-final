import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";

export default function Register() {
  return (
    <div className="w-screen h-screen space-y-5 my5 bg-linear-to-bl from-pink-500 via-fuchsia-500 to-blue-400 text-cyan-50 text-3xl flex flex-col">
      <div className="w-screen p-5">
        <h1 className="text-blue-300 text-4xl font-extrabold justify-self-center">Register</h1>
        <Link href="/">
          <Button>Back</Button>
        </Link>
      </div>
      <div className="items-center justify-center p-10">
        <RegisterForm />
      </div>
    </div>
  );
}
