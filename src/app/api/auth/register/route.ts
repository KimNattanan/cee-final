import { RegisterUserRequest } from "@/features/auth/types/users";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, createAuthToken } from "@/lib/auth-token";

export async function POST(request: NextRequest) {
  await dbConnect();
  const { username, email, password } = await request.json() as RegisterUserRequest;
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await User.findOne({
    email: { $eq: email },
  });
  if (existingUser) {
    return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
  }
  const user = await User.create({
    id: new mongoose.Types.ObjectId().toString(),
    username,
    email,
    password: hashedPassword,
  });

  const token = await createAuthToken(user.id, user.email);

  const response = NextResponse.json({ message: "Registered successfully" });

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  
  return response;
}