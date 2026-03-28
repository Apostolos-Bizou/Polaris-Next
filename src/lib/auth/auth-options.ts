import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";

// ─── Types ───────────────────────────────────────────────
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "client" | "viewer";
    clientId?: string;
    clientName?: string;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "client" | "viewer";
    clientId?: string;
    clientName?: string;
  }
}

// ─── Google Script auth proxy ────────────────────────────
async function authenticateViaGoogleScript(
  username: string,
  password: string
): Promise<{
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    client_id?: string;
    client_name?: string;
  };
}> {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) throw new Error("GOOGLE_SCRIPT_URL not configured");

  try {
    const response = await fetch(
      `${scriptUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Google Script auth error:", error);
    return { success: false };
  }
}

// ─── Build providers list ────────────────────────────────
const providers: NextAuthOptions["providers"] = [];

// Always available: username/password login
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Polaris Login",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials?.password) return null;

      const result = await authenticateViaGoogleScript(
        credentials.username,
        credentials.password
      );

      if (!result.success || !result.user) return null;

      return {
        id: result.user.id || credentials.username,
        name: result.user.name || credentials.username,
        email: result.user.email || `${credentials.username}@polaris.local`,
        role: (result.user.role as "admin" | "client" | "viewer") || "viewer",
        clientId: result.user.client_id,
        clientName: result.user.client_name,
      };
    },
  })
);

// Optional: Azure AD — only active when env vars are set
if (
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_TENANT_ID
) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name || profile.preferred_username,
          email: profile.email || profile.preferred_username,
          role: "admin" as const,
          clientId: undefined,
          clientName: undefined,
        };
      },
    })
  );
}

// ─── NextAuth Options ────────────────────────────────────
export const authOptions: NextAuthOptions = {
  providers,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId;
        token.clientName = user.clientName;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientId = token.clientId;
        session.user.clientName = token.clientName;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};
