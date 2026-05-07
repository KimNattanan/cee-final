import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";

export default function Login() {
  return (
    <div className="relative min-h-screen w-full bg-[url('/img/background_2.jpg')] bg-cover bg-center bg-no-repeat">
      <div className="flex min-h-screen w-full flex-col space-y-5 bg-gradient-to-bl from-blue-400/50 via-fuchsia-500/50 to-pink-500/50 p-4 text-cyan-50 md:p-8">
        <div className="relative flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">

          <Link href="/" className="order-2 sm:order-1 sm:absolute sm:left-0">
            <Button className="w-20 text-lg md:text-xl">Back</Button>
          </Link>

          <h1 className="order-1 text-3xl font-extrabold text-amber-50/90 md:text-5xl lg:text-6xl sm:w-full sm:text-center">
            Login
          </h1>
        </div>

      <div className="flex flex-1 items-center justify-center p-2 sm:p-10">
        <div className="w-full max-w-md lg:max-w-lg">
          <LoginForm />
        </div>
      </div>
  </div>
</div>
    
  );
}
