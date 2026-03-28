import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// ─── Actions that require authentication ─────────────────
const PUBLIC_ACTIONS = ["login", "authenticateClient"];

const ADMIN_ONLY_ACTIONS = [
  "addClient",
  "addClientContact",
  "deleteClientContact",
  "updateClientContact",
  "createASAFromOffer",
  "createDPA",
  "createNDA",
  "createProgram",
  "createProposalFromOffer",
  "generateComparisonQuoteFromOffer",
  "markOfferAsSigned",
  "updateOfferStatus",
  "sendDocumentsEmail",
  "cancelScheduledEmail",
];

// ─── GET handler ─────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  return handleProxy(request, params.action);
}

// ─── POST handler ────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  return handleProxy(request, params.action, "POST");
}

// ─── Core proxy logic ────────────────────────────────────
async function handleProxy(
  request: NextRequest,
  action: string,
  method: "GET" | "POST" = "GET"
) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return NextResponse.json(
      { success: false, error: "Backend not configured" },
      { status: 500 }
    );
  }

  // ── Auth check ──────────────────────────────────────
  if (!PUBLIC_ACTIONS.includes(action)) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Admin-only actions
    if (ADMIN_ONLY_ACTIONS.includes(action) && session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  // ── Build the forwarding URL ────────────────────────
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.searchParams);
  searchParams.set("action", action);

  const targetUrl = `${scriptUrl}?${searchParams.toString()}`;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Forward POST body if present
    if (method === "POST") {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON — that's fine for some actions
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // ── Log for debugging (dev only) ────────────────
    if (process.env.NODE_ENV === "development") {
      console.log(`[Proxy] ${action} → ${response.status}`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Proxy] Error for action '${action}':`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reach backend",
        action,
      },
      { status: 502 }
    );
  }
}
