export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await request.json();
    const provider = payload.provider || "gemini";
    const model = payload.model;
    const messages = payload.messages || [];
    const temperature = payload.temperature ?? 0.7;
    const max_tokens = payload.max_tokens ?? 8192;
    const response_format = payload.response_format;

    let url;
    let apiKey;
    let body;

    if (provider === "gemini") {
      apiKey = env.GEMINI_API_KEY;
      if (!apiKey) return json({ error: { message: "Missing GEMINI_API_KEY secret" } }, 500);

      url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      body = {
        model,
        messages,
        temperature,
        max_tokens,
        ...(response_format ? { response_format } : {}),
      };
    } else if (provider === "groq") {
      apiKey = env.GROQ_API_KEY;
      if (!apiKey) return json({ error: { message: "Missing GROQ_API_KEY secret" } }, 500);

      url = "https://api.groq.com/openai/v1/chat/completions";
      body = {
        model,
        messages,
        temperature,
        max_tokens,
        ...(response_format ? { response_format } : {}),
      };
    } else if (provider === "cerebras") {
      apiKey = env.CEREBRAS_API_KEY;
      if (!apiKey) return json({ error: { message: "Missing CEREBRAS_API_KEY secret" } }, 500);

      url = "https://api.cerebras.ai/v1/chat/completions";
      body = {
        model,
        messages,
        temperature,
        max_completion_tokens: max_tokens,
        ...(response_format ? { response_format } : {}),
      };
    } else {
      return json({ error: { message: "Unsupported provider" } }, 400);
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    return json({ error: { message: err.message || "Unexpected server error" } }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
