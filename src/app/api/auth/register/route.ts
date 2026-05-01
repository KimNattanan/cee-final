import { RegisterUserRequest } from "@/features/auth/types/users";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  await dbConnect();
  const { username, email, password } = await request.json() as RegisterUserRequest;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const existingUser = await User.find({
      email: { $eq: email },
    });
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'Email is already registered' }, { status: 400 });
    }
    const user = await User.create({
      id: new mongoose.Types.ObjectId().toString(),
      username,
      email,
      password: hashedPassword,
    });
    return NextResponse.json({ message: 'User registered successfully', data: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error registering user' }, { status: 500 });
  }
}