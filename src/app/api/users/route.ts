import { AUTH_COOKIE_NAME, decodeAuthToken } from "@/lib/auth-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userClaims = await decodeAuthToken(token);
  if (!userClaims) {
    const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
  return NextResponse.json({ data: {
    userId: userClaims.userId,
    email: userClaims.email,
    username: userClaims.username,
  }});
}