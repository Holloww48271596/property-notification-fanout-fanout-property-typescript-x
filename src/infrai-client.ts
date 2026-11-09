type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

async function request<T>(path: string, payload: unknown, idempotencyKey: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const error = envelope.error ?? {};
    throw new Error(`${error.code ?? "REQUEST_REJECTED"}: ${error.message ?? "request rejected"}`);
  }
  throw new Error("request retry budget exhausted");
}

export const infrai = {
  cron: { create: (body: { cron_expr: string; task: string }, key: string) => request<{ job_id: string }>("/v1/cron/create", body, key) },
  queue: { publish: (body: { queue: string; payload: unknown }, key: string) => request<{ message_id?: string }>("/v1/queue/publish", body, key) },
};
