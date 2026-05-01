import { SignJWT, jwtVerify } from "jose";

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

export async function createAuthToken(userId: string, email: string, username: string) {
  return new SignJWT({ email, username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecretKey());
}

export type AuthTokenClaims = {
  userId: string;
  email: string;
  username: string;
};

/**
 * Verifies signature + expiry, then returns claims. Invalid or expired tokens return null.
 */
export async function decodeAuthToken(
  token: string,
): Promise<AuthTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const username = typeof payload.username === "string" ? payload.username : null;
    if (!userId || !email || !username) {
      return null;
    }
    return { userId, email, username };
  } catch {
    return null;
  }
}