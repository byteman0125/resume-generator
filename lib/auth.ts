import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserById, type UserRow, type UserRole } from "./db";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? "resume-builder-secret-change-in-production";
const JWT_EXPIRY = "30d";

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  assignedProfileId: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getAuthFromRequest(request: Request): JwtPayload | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return verifyToken(token);
}

/** Returns current user from request (validates JWT and that user still exists), or null if unauthorized. */
export function requireUser(request: Request): UserRow | null {
  const payload = getAuthFromRequest(request);
  if (!payload) return null;
  const user = getUserById(payload.userId);
  return user ?? null;
}

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
export function generateRandomPassword(length: number = 14): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}
