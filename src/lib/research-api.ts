const API_BASE = import.meta.env["VITE_API_URL"] || "/api";

export type Health = { api_key_configured?: boolean; model?: string; provider?: string };

export type ResearchResult = {
  run_id?: string;
  framing?: {
    restated_goal?: string;
    discipline?: string;
    adjacent_field?: string;
    audience?: string;
    sub_questions?: string[];
    scope_notes?: string;
  };
  plan?: {
    strategy?: string;
    steps?: { id: number; title: string; purpose?: string; evidence_type?: string }[];
  };
  brief?: {
    summary?: string;
    findings?: { claim: string; evidence?: string; confidence?: string }[];
    source_strategy?: string[];
  };
  review?: {
    readiness?: number;
    uncertainties?: { issue: string; why_it_matters?: string; how_to_resolve?: string }[];
    reviewer_note?: string;
    checklist?: { action: string; effort?: string }[];
  };
  stats?: {
    degraded_stages?: string[];
    duration_seconds?: number;
    llm_calls?: number;
    tool_calls?: number;
    context_trimmed?: boolean;
  };
  log?: { ts?: string; stage?: string; level?: string; message?: string }[];
  tool_calls?: { step: number; tool: string; arguments?: unknown; ok?: boolean; result?: { error?: string } }[];
};

type Res<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(path: string, init?: RequestInit): Promise<Res<T>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000);
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
    clearTimeout(timer);
    if (!response.ok) {
      let detail = "";
      try {
        const body = (await response.json()) as { detail?: unknown };
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? "");
      } catch {
        detail = "";
      }
      if (response.status === 422 && !detail) {
        return {
          success: false,
          error: "That goal was rejected by validation. Write it as a full sentence of at least 15 characters.",
        };
      }
      return { success: false, error: detail || `Request failed (${response.status}).` };
    }
    return { success: true, data: (await response.json()) as T };
  } catch (error) {
    const err = error as Error;
    if (err.name === "AbortError") {
      return { success: false, error: 'The run took too long and was cancelled. Try a "Quick scan" depth.' };
    }
    return { success: false, error: "Cannot reach the research service right now." };
  }
}

export const getHealth = () => request<Health>("/health");
export const getSampleGoal = () => request<{ goal: string; depth?: string }>("/sample");
export const runResearch = (goal: string, depth: string) =>
  request<ResearchResult>("/research", { method: "POST", body: JSON.stringify({ goal, depth }) });
