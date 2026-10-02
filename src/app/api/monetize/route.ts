import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { jsonError } from "@/lib/security";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const FILE = path.join(process.cwd(), "data", "monetize.jsonl");

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "monetize"), 400);
  if (!limited.ok) return jsonError("Too many events.", 429);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Bad event.", 400);

  await mkdir(path.dirname(FILE), { recursive: true });
  await appendFile(FILE, `${JSON.stringify({ ...body, receivedAt: new Date().toISOString() })}\n`);
  return Response.json({ ok: true });
}
