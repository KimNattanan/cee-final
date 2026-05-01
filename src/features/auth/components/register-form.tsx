"use client";

import { Button } from "@/components/ui/button";
import { registerUser, RegisterUserFormData } from "../api/register";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const RegisterForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data: RegisterUserFormData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };
    try {
      const response = await registerUser(data);
      setSuccess(response.message);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h1>Register Form</h1>
      <form onSubmit={handleSubmit}>
        <Input type="text" id="username" placeholder="Username" name="username" required/>
        <Input type="email" id="email" placeholder="Email" name="email" required/>
        <Input type="password" id="password" placeholder="Password" name="password" required/>
        <Input type="password" id="confirmPassword" placeholder="Confirm Password" name="confirmPassword" required/>
        <Button type="submit" disabled={loading}>Register</Button>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p>{success}</p>}
      </form>
    </div>
  );
};
