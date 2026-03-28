import { NextResponse } from "next/server";

export async function GET() {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  let proxyStatus = "not_configured";

  if (scriptUrl) {
    try {
      const response = await fetch(`${scriptUrl}?action=getClients`, {
        signal: AbortSignal.timeout(5000),
      });
      proxyStatus = response.ok ? "connected" : "error";
    } catch {
      proxyStatus = "unreachable";
    }
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    phase: 1,
    services: {
      googleScriptProxy: proxyStatus,
      cosmosDb: process.env.COSMOS_ENDPOINT ? "configured" : "phase_6",
      azureAD:
        process.env.AZURE_AD_CLIENT_ID ? "configured" : "not_configured",
    },
  });
}
