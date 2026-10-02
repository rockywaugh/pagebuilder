type Moderation = { ok: true } | { ok: false; reason: string };

export async function moderateText(text: string): Promise<Moderation> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: true };

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text,
      }),
    });
    if (!response.ok) return { ok: true };
    const data = (await response.json()) as {
      results?: Array<{ flagged?: boolean }>;
    };
    if (data.results?.[0]?.flagged) {
      return {
        ok: false,
        reason: "That request was flagged by our safety filter.",
      };
    }
  } catch {
    return { ok: true };
  }

  return { ok: true };
}

export async function moderateImage(bytes: Buffer, mime: string): Promise<Moderation> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: true };

  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      }),
    });
    if (!response.ok) return { ok: true };
    const data = (await response.json()) as {
      results?: Array<{ flagged?: boolean }>;
    };
    if (data.results?.[0]?.flagged) {
      return {
        ok: false,
        reason: "That image was flagged as not suitable for this studio.",
      };
    }
  } catch {
    return { ok: true };
  }

  return { ok: true };
}
