import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession } },
}));

import { streamChat } from "@/utils/streamChat";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const USER_JWT = "user-access-token-abc123";

function signedInSession() {
  return { data: { session: { access_token: USER_JWT, user: { id: "user-1" } } }, error: null };
}

function signedOutSession() {
  return { data: { session: null }, error: null };
}

function sseResponse(events: string[]) {
  let index = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        return {
          async read() {
            if (index >= events.length) return { done: true, value: undefined };
            return { done: false, value: new TextEncoder().encode(events[index++]) };
          },
        };
      },
    },
  };
}

function errorResponse(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

function mockFetch(impl: (url: string, init: RequestInit) => unknown) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => impl(url, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function baseArgs(overrides: Record<string, unknown> = {}) {
  return {
    messages: [{ role: "user" as const, content: "Explain Article 370" }],
    subject: "Polity",
    language: "hi",
    onDelta: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

async function runStream(args: ReturnType<typeof baseArgs>) {
  await streamChat(args);
  return args;
}

beforeEach(() => {
  getSession.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AI Tutor streaming auth", () => {
  it("has the Supabase client config available", () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(PUBLISHABLE_KEY).toBeTruthy();
  });

  it("sends the signed-in user's access token as the bearer, not the publishable key", async () => {
    getSession.mockResolvedValue(signedInSession());
    const fetchMock = mockFetch(() => sseResponse(["data: [DONE]\n"]));

    await runStream(baseArgs());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${SUPABASE_URL}/functions/v1/ai-chat`);

    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${USER_JWT}`);
    expect(headers.get("Authorization")).not.toBe(`Bearer ${PUBLISHABLE_KEY}`);
    expect(headers.get("apikey")).toBe(PUBLISHABLE_KEY);
  });

  it("still sends the selected subject, language and history", async () => {
    getSession.mockResolvedValue(signedInSession());
    const fetchMock = mockFetch(() => sseResponse(["data: [DONE]\n"]));

    const args = baseArgs();
    await runStream(args);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.subject).toBe("Polity");
    expect(body.language).toBe("hi");
    expect(body.messages).toEqual(args.messages);
  });

  it("does not call the Edge Function when there is no session, and reports an auth error", async () => {
    getSession.mockResolvedValue(signedOutSession());
    const fetchMock = mockFetch(() => sseResponse(["data: [DONE]\n"]));

    const args = baseArgs();
    await runStream(args);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(args.onDone).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledTimes(1);
    const error = args.onError.mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/sign in/i);
  });

  it("streams SSE deltas to the UI and completes", async () => {
    getSession.mockResolvedValue(signedInSession());
    mockFetch(() =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Article"}}]}\n',
        'data: {"choices":[{"delta":{"content":" 370"}}]}\n',
        "data: [DONE]\n",
      ])
    );

    const args = baseArgs();
    await runStream(args);

    expect(args.onDelta.mock.calls.map(([d]) => d)).toEqual(["Article", " 370"]);
    expect(args.onDone).toHaveBeenCalledTimes(1);
    expect(args.onError).not.toHaveBeenCalled();
  });

  it.each([
    [401, /sign in/i],
    [429, /rate limit/i],
    [402, /payment/i],
  ])("maps a %i response to a clear error", async (status, expected) => {
    getSession.mockResolvedValue(signedInSession());
    mockFetch(() => errorResponse(status));

    const args = baseArgs();
    await runStream(args);

    expect(args.onError).toHaveBeenCalledTimes(1);
    expect((args.onError.mock.calls[0][0] as Error).message).toMatch(expected);
    expect(args.onDelta).not.toHaveBeenCalled();
  });

  it("passes the caller's abort signal through and treats cancellation as non-fatal", async () => {
    const controller = new AbortController();
    getSession.mockResolvedValue(signedInSession());
    const fetchMock = mockFetch(() => {
      throw Object.assign(new Error("The user aborted a request."), { name: "AbortError" });
    });

    const args = baseArgs({ signal: controller.signal });
    await runStream(args);

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    expect(args.onError).not.toHaveBeenCalled();
  });

  it("never persists or logs the access token", async () => {
    getSession.mockResolvedValue(signedInSession());
    mockFetch(() => sseResponse(["data: [DONE]\n"]));

    await runStream(baseArgs());

    const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key) ?? "");
    expect(stored.some((value) => value.includes(USER_JWT))).toBe(false);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});
