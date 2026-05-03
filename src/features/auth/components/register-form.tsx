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
    <div className="justify-self-center justify-items-center bg-fuchsia-600/30 backdrop-blur-md rounded-2xl shadow-2xl p-4 px-6">
      <h1>Register Form</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-4 placeholder:text-white">
        <Input
          type="text"
          id="username"
          placeholder="Username"
          name="username"
          required
          className="placeholder:text-white"
        />
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
        <Input
          type="password"
          id="confirmPassword"
          placeholder="Confirm Password"
          name="confirmPassword"
          required
          className="placeholder:text-white"
        />
        <Button type="submit" disabled={loading}>
          Register
        </Button>
        <p className="text-xl">Already have an account? <Link href="/login" className="font-bold tex">Login</Link></p>
        {loading && <p>Loading...</p>}
      </form>
    </div>
  );
};
