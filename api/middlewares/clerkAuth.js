import { jwtVerify, createRemoteJWKSet } from "jose";
import { URL } from "url";

const CLERK_FRONTEND_API = process.env.CLERK_FRONTEND_API_URL;

const clerkJwks = createRemoteJWKSet(
  new URL(`${CLERK_FRONTEND_API}/.well-known/jwks.json`)
);

export async function clerkAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No auth token provided" });
    }

    const { payload } = await jwtVerify(token, clerkJwks, {
      issuer: "https://lasting-mantis-12.clerk.accounts.dev",
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}
