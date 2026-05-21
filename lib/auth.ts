import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { Student, Teacher, User } from "@/lib/models";

const cookieName = "afajics_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "student" | "admin";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(role?: SessionUser["role"]) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (role && session.role !== role) {
    redirect(session.role === "teacher" ? "/teacher" : "/student");
  }

  return session;
}

export async function getTeacherByUserId(userId: string) {
  await connectDb();
  return Teacher.findOne({ userId });
}

export async function getStudentByUserIdOrEmail(userId: string, email: string) {
  await connectDb();
  const linked = await Student.findOne({ userId });
  if (linked) {
    return linked;
  }

  const existing = await Student.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.userId = userId as never;
    await existing.save();
  }
  return existing;
}

export async function findUserForLogin(email: string) {
  await connectDb();
  return User.findOne({ email: email.toLowerCase().trim() });
}

