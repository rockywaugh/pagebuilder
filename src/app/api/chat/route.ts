import { LIMITS } from "@/lib/config";
import { STEP_COPY } from "@/lib/guide";
import { reviewUserText } from "@/lib/content-policy";
import { moderateText } from "@/lib/moderation";
import { requireProject } from "@/lib/project";
import { toPublic } from "@/lib/public-project";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { runTurn } from "@/lib/ai";
import { EXAMPLES } from "@/lib/examples-catalog";
import { cleanText, newId } from "@/lib/sanitize";
import { jsonError, sameOrigin } from "@/lib/security";
import { saveProject } from "@/lib/store";

export async function POST(request: Request) {
  try {
    return await handleChat(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That could not be used.";
    return jsonError(message, 500);
  }
}

async function handleChat(request: Request) {
  if (!sameOrigin(request)) return jsonError("Blocked cross-origin request.", 403);

  const limited = rateLimit(clientKey(request, "chat"), LIMITS.chatPerHour);
  if (!limited.ok) {
    return jsonError("Too many prompts. Wait a bit, then continue.", 429, {
      retryAfterSec: limited.retryAfterSec,
    });
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
    advance?: boolean;
    fromHint?: boolean;
    skip?: boolean;
  } | null;
  const skip = body?.skip === true;
  const message = cleanText(body?.message || (skip ? "Skip" : ""), LIMITS.maxMessageChars);
  if (!message) return jsonError("Write a short answer first.");

  const policy = reviewUserText(message);
  if (!policy.ok) return jsonError(policy.reason, 400, { code: policy.code });

  const moderated = await moderateText(message);
  if (!moderated.ok) return jsonError(moderated.reason, 400);

  const { user, project } = await requireProject();
  if (project.messages.length >= LIMITS.maxMessagesPerProject) {
    return jsonError("This page has enough conversation. Unlock the files or start a membership for another page.");
  }

  project.messages.push({
    id: newId("msg"),
    role: "user",
    text: message,
    createdAt: new Date().toISOString(),
  });

  const fromStep = project.step;
  const turn = await runTurn(project.spec, project.step, message, {
    advance: body?.advance !== false,
    fromHint: body?.fromHint === true,
    skip,
  });
  project.spec = turn.spec;
  project.step = turn.step;
  project.previewRevision += 1;
  if (turn.examples?.length) {
    project.exampleBrowse = {
      items: turn.examples,
      selectedId: project.exampleBrowse?.selectedId,
    };
  }
  if (turn.exampleId) {
    const picked = EXAMPLES.find((item) => item.id === turn.exampleId);
    const current = project.exampleBrowse?.items ?? [];
    project.exampleBrowse = {
      items: current.length
        ? current
        : EXAMPLES.filter((item) => item.kind === (picked?.kind ?? "background")).slice(0, 8),
      selectedId: turn.exampleId,
    };
  }
  if (turn.assistant && turn.assistant !== STEP_COPY[turn.step].prompt) {
    project.messages.push({
      id: newId("msg"),
      role: "assistant",
      text: turn.assistant,
      createdAt: new Date().toISOString(),
    });
  }
  if (turn.step !== fromStep || !turn.assistant) {
    project.messages.push({
      id: newId("msg"),
      role: "assistant",
      text: STEP_COPY[turn.step].prompt,
      createdAt: new Date().toISOString(),
    });
  }
  await saveProject(project);

  return Response.json({
    project: await toPublic(project, user, {
      suggestions: turn.suggestions,
      examples: turn.examples,
    }),
  });
}
