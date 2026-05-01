import { NextRequest, NextResponse } from "next/server";
import { LoginUserRequest } from "@/features/auth/types/users";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createAuthToken,
} from "@/lib/auth-token";

export async function POST(request: NextRequest) {
  await dbConnect();

  const { email, password } = (await request.json()) as LoginUserRequest;

  const user = await User.findOne({ email: { $eq: email } });
  if (!user) {
    return NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = await createAuthToken(user.id, user.email);

  const response = NextResponse.json({ message: "Login successful" });

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  return response;
}
