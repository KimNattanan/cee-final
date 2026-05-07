import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";

export default function Register() {
  return (
    <div className="w-screen h-screen bg-[url('/img/background_2.jpg')] bg-cover bg-center bg-no-repeat">
      <div className="w-screen min-h-screen space-y-5 my5 bg-linear-to-bl from-pink-500/50 via-fuchsia-500/50 to-blue-400/50 text-cyan-50 text-3xl flex flex-col">
        <div className="w-screen p-5">
          <h1 className="text-amber-50/90 text-4xl font-extrabold justify-self-center ">Register</h1>
          <Link href="/">
            <Button className="justify-self-start w-20 text-xl">Back</Button>
          </Link>
        </div>
        <div className="items-center justify-center p-10">
          <RegisterForm />
        </div>
      </div>
    </div>
    
  );
}
