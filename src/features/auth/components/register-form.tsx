"use client";

import { Button } from "@/components/ui/button";
import { registerUser, RegisterUserFormData } from "../api/register";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export const RegisterForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data: RegisterUserFormData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };
    try {
      const response = await registerUser(data);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-md lg:max-w-lg bg-fuchsia-600/30 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
      <h1 className="text-center text-2xl md:text-3xl font-bold mb-4 text-white">Register Form</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
        <div className="w-full space-y-4">
          <Input
            type="text"
            id="username"
            placeholder="Username"
            name="username"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20 text-white"
          />
          <Input
            type="email"
            id="email"
            placeholder="Email"
            name="email"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20 text-white"
          />
          <Input
            type="password"
            id="password"
            placeholder="Password"
            name="password"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20 text-white"
          />
          <Input
            type="password"
            id="confirmPassword"
            placeholder="Confirm Password"
            name="confirmPassword"
            required
            className="w-full h-12 text-lg placeholder:text-white/70 bg-white/10 border-white/20 text-white"
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full md:w-auto md:px-12 h-12 text-xl transition-all active:scale-95 shadow-lg"
        >
          {loading ? "Creating Account..." : "Register"}
        </Button>

        <p className="text-sm md:text-lg text-center mt-2 text-white/90">
          Already have an account?{" "}
          <Link href="/login" className="font-bold hover:underline underline-offset-4 decoration-2">
            Login
          </Link>
        </p>

        {loading && <p className="animate-pulse text-sm text-white/80">Setting up your profile...</p>}
      </form>
    </div>
  );
};
