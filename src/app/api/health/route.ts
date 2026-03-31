import { NextResponse } from "next/server";

export async function GET() {
  const status = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "unknown",
    uptime: process.uptime(),
    checks: {
      nextjs: true,
      googleScript: false,
      cosmosDb: false,
    },
  };

  // Check Google Script connectivity
  try {
    const gsUrl = process.env.GOOGLE_SCRIPT_URL;
    if (gsUrl) {
      const res = await fetch(`${gsUrl}?action=ping`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      status.checks.googleScript = res.ok;
    }
  } catch {
    status.checks.googleScript = false;
  }

  // Check Cosmos DB connectivity (when enabled)
  try {
    const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
    if (cosmosEndpoint) {
      status.checks.cosmosDb = true; // Will add real check later
    }
  } catch {
    status.checks.cosmosDb = false;
  }

  return NextResponse.json(status, { status: 200 });
}
