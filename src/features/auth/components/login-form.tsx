"use client";

import { Button } from "@/components/ui/button";
import { loginUser, LoginUserFormData } from "../api/login";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data: LoginUserFormData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    try {
      const response = await loginUser(data);
      toast.success(response.message);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto w-full max-w-[90%] sm:max-w-md lg:max-w-lg bg-sky-400/30 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
      <h1 className="text-center text-2xl md:text-3xl font-bold mb-4">Login Form</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
        <div className="w-full space-y-4">
          <Input
            type="email"
            id="email"
            placeholder="Email"
            name="email"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20"
          />
          <Input
            type="password"
            id="password"
            placeholder="Password"
            name="password"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20"
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full md:w-auto md:px-10 h-12 text-xl transition-transform active:scale-95"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-sm md:text-lg text-center mt-2">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold hover:underline underline-offset-4">
            Register
          </Link>
        </p>

        {loading && <p className="animate-pulse text-sm">Processing...</p>}
      </form>
    </div>
  );
};
