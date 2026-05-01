import { SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "auth-token";

/** Seconds; align with `JWT_EXPIRES` when you change expiry. */
export const AUTH_COOKIE_MAX_AGE =
  Number(process.env.JWT_COOKIE_MAX_AGE_SEC) || 60 * 60 * 24 * 7;

const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "7d";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(userId: string, email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecretKey());
}
