import { NextResponse } from "next/server";
import { createResultsWorkbookBuffer } from "@/app/lib/results-excel";
import { fetchAllResultsForExport } from "@/app/lib/results-store";

export const runtime = "nodejs";

function getRequestToken(request: Request) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim();

  return null;
}

export async function GET(request: Request) {
  const expectedToken = process.env.RESULTS_ADMIN_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ ok: false, error: "RESULTS_ADMIN_TOKEN is not configured." }, { status: 500 });
  }

  const requestToken = getRequestToken(request);
  if (!requestToken || requestToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const records = await fetchAllResultsForExport();
    const workbookBuffer = await createResultsWorkbookBuffer(records);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return new Response(workbookBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iv-simulation-results-${timestamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export simulation results", error);
    return NextResponse.json({ ok: false, error: "Results export failed. Please try again." }, { status: 500 });
  }
}
