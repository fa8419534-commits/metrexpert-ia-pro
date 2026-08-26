import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("LLM request diagnostics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs the normalized request structure while redacting binary URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "test",
      created: 1,
      model: "claude-sonnet-4-6",
      choices: [],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await invokeLLM({
      model: "claude-sonnet-4-6",
      max_tokens: 12_000,
      messages: [
        { role: "system", content: "system prompt" },
        { role: "user", content: [
          { type: "text", text: "description" },
          { type: "file_url", file_url: { url: "data:application/pdf;base64,SECRET", mime_type: "application/pdf" } },
        ] },
      ],
      response_format: { type: "json_object" },
    });

    const logged = String(info.mock.calls[0]?.[1] ?? info.mock.calls[0]?.[0]);
    expect(logged).toContain("claude-sonnet-4-6");
    expect(logged).toContain("12000");
    expect(logged).toContain("file_url");
    expect(logged).toContain('"hasFile":true');
    expect(logged).toContain("REDACTED file URL");
    expect(logged).not.toContain("SECRET");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      model: "claude-sonnet-4-6",
      max_tokens: 12_000,
      response_format: { type: "json_object" },
    });
  });

  it("aborts a request that exceeds the per-attempt timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    const request = invokeLLM({ messages: [{ role: "user", content: "timeout test" }] }).catch(() => undefined);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    for (let attempt = 0; attempt < 4; attempt += 1) await vi.advanceTimersByTimeAsync(90_000);
    await request;
    vi.useRealTimers();
  });

  it("logs the full provider error body before throwing", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify({ error: { message: "unsupported parameter", type: "invalid_request_error" } }),
      { status: 400, statusText: "Bad Request", headers: { "content-type": "application/json", "x-request-id": "req-test" } },
    ))));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const request = invokeLLM({ messages: [{ role: "user", content: "test" }] }).then(
      () => ({ ok: true as const }),
      (requestError) => ({ ok: false as const, requestError }),
    );
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await vi.advanceTimersByTimeAsync(30_000);
    }
    const settled = await request;
    expect(settled.ok).toBe(false);
    if (settled.ok) throw new Error("Expected the provider request to fail");
    expect(settled.requestError).toHaveProperty("message");
    expect(String(settled.requestError.message)).toContain("400");
    expect(fetch).toHaveBeenCalledTimes(1);
    const logged = String(error.mock.calls[0]?.[1] ?? error.mock.calls[0]?.[0]);
    expect(logged).toContain("unsupported parameter");
    expect(logged).toContain("invalid_request_error");
    expect(logged).toContain("req-test");
    vi.useRealTimers();
  });
});
