type Msg = { role: "system" | "user" | "assistant" | "tool"; content: string; name?: string };

type Provider = "openai" | "anthropic" | "google" | "xai";
type OpenAITool = {
  type: "function";
  function: { name: string; description?: string; parameters?: any };
};

export async function chatCompletion({
  provider, model, system, messages, tools,
}: {
  provider: Provider;
  model: string;
  system: string;
  messages: Msg[];
  tools?: OpenAITool[];
}) {
  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const body: any = { model, temperature: 0.2, messages:[{ role:"system", content:system }, ...messages] };
      if (tools && tools.length) { body.tools = tools; body.tool_choice = "auto"; }

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(`OpenAI error ${r.status}: ${await r.text()}`);
      const j = await r.json();
      const msg = j.choices?.[0]?.message || {};
      // return content + tool_calls (if any). Callers can handle both shapes.
      return { content: msg.content ?? "…", tool_calls: msg.tool_calls || [] };
    }
  } catch (e:any) {
    return { content: `Error: ${e?.message || "LLM request failed"}`, tool_calls: [] };
  }
  const last = messages[messages.length - 1]?.content || "";
  return { content: `Simulated: ${last.slice(0, 120)}`, tool_calls: [] };
}

export async function* chatStream({
  provider, model, system, messages,
}: {
  provider: Provider;
  model: string;
  system: string;
  messages: Msg[];
}) {
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, temperature:0.2, stream:true, messages:[{ role:"system", content:system }, ...messages] })
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("❌ OpenAI stream error:", resp.status, body);
      throw new Error(`OpenAI stream error ${resp.status}: ${body}`);
    }
    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta as string;
        } catch {}
      }
    }
    return;
  }

  const last = messages[messages.length - 1]?.content || "";
  const fake = `Simulated: ${last}`.split(/\s+/);
  for (const w of fake) { yield w + " "; }
}
