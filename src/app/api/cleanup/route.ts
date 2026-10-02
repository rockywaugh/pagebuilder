import { purgeExpiredGuests } from "@/lib/guest";
import { jsonError, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const secret = process.env.CLEANUP_SECRET;
  const header = request.headers.get("x-cleanup-secret");
  if (secret && header === secret) {
    return Response.json(await purgeExpiredGuests());
  }
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);
  return Response.json(await purgeExpiredGuests());
}
