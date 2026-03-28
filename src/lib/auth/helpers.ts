import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { redirect } from "next/navigation";

// Get current session (server components)
export async function getSession() {
  return getServerSession(authOptions);
}

// Require authentication — redirects to login if not authenticated
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

// Require admin role
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }
  return session;
}

// Require client role
export async function requireClient() {
  const session = await requireAuth();
  if (session.user.role !== "client") {
    redirect("/unauthorized");
  }
  return session;
}

// Check if user has a specific role (without redirect)
export async function hasRole(role: "admin" | "client" | "viewer") {
  const session = await getSession();
  return session?.user?.role === role;
}
