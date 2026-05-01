"use client";

import { Button } from "@/components/ui/button";
import { loginUser, LoginUserFormData } from "../api/login";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
    <div>
      <h1>Login Form</h1>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          id="email"
          placeholder="Email"
          name="email"
          required
        />
        <Input
          type="password"
          id="password"
          placeholder="Password"
          name="password"
          required
        />
        <Button type="submit" disabled={loading}>
          Login
        </Button>
        {loading && <p>Loading...</p>}
      </form>
    </div>
  );
};
