"use client";

import { Button } from "@/components/ui/button";
import { loginUser, LoginUserFormData } from "../api/login";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export const LoginForm = () => {
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="justify-self-center justify-items-center bg-sky-400/30 backdrop-blur-md rounded-2xl shadow-2xl p-4 px-6">
      <h1>Login Form</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-4">
        <Input
          type="email"
          id="email"
          placeholder="Email"
          name="email"
          required
          className="placeholder:text-white"
        />
        <Input
          type="password"
          id="password"
          placeholder="Password"
          name="password"
          required
          className="placeholder:text-white"
        />
        <Button type="submit" disabled={loading}>
            Login
        </Button>
        <p className="text-xl">Don't have an account? <Link href="/register" className="font-bold tex">Register</Link></p>
        {loading && <p>Loading...</p>}
      </form>
    </div>
  );
};
