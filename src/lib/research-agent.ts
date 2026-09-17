/**
 * ResearchRoute agent — calls an OpenAI-compatible chat API and returns
 * a structured ResearchResult. Configure via environment variables:
 *
 *   RESEARCH_API_KEY   (required) — API key
 *   RESEARCH_API_BASE  (optional) — default https://api.openai.com/v1
 *   RESEARCH_MODEL     (optional) — default gpt-4o-mini
 */

export type AgentHealth = {
  api_key_configured: boolean;
  model: string;
  provider: string;
};

export function getAgentConfig() {
  const apiKey =
    process.env.RESEARCH_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  const apiBase = (
    process.env.RESEARCH_API_BASE ||
    process.env.OPENAI_API_BASE ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.RESEARCH_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini";

  return { apiKey, apiBase, model };
}

export function getAgentHealth(): AgentHealth {
  const { apiKey, apiBase, model } = getAgentConfig();
  let provider = "openai-compatible";
  try {
    provider = new URL(apiBase).hostname.replace(/^api\./, "");
  } catch {
    /* keep default */
  }
  return {
    api_key_configured: Boolean(apiKey && apiKey.length > 8),
    model,
    provider,
  };
}

type Depth = "quick" | "standard" | "deep" | string;

const DEPTH_GUIDE: Record<string, string> = {
  quick:
    "Quick scan (about 3 steps). Be concise. Fewer sub-questions, 2–3 findings, short checklist.",
  standard:
    "Standard review (about 5 steps). Balanced depth. 3–5 findings, clear uncertainties, practical checklist.",
  deep:
    "Deep dive (about 7 steps). Thorough analysis. More sub-questions, 4–6 findings with nuanced confidence, richer uncertainties and checklist.",
};

function buildSystemPrompt(depth: Depth): string {
  const guide = DEPTH_GUIDE[depth] || DEPTH_GUIDE.standard;
  return `You are ResearchRoute, an AI research desk that plans the route BEFORE diving into literature.

Your job is NOT to invent fake citations or pretend you browsed the web. You:
1. Frame the decision-oriented research goal
2. Plan an evidence strategy
3. Synthesise a careful brief based on general domain knowledge
4. Explicitly name uncertainties and where a human should verify
5. Produce an action checklist for the decision-maker

Depth mode: ${guide}

Return ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "framing": {
    "restated_goal": "string",
    "discipline": "string",
    "adjacent_field": "string",
    "audience": "string",
    "sub_questions": ["string"],
    "scope_notes": "string"
  },
  "plan": {
    "strategy": "string",
    "steps": [
      { "id": 1, "title": "string", "purpose": "string", "evidence_type": "string" }
    ]
  },
  "brief": {
    "summary": "string",
    "findings": [
      { "claim": "string", "evidence": "string", "confidence": "high" | "medium" | "low" }
    ],
    "source_strategy": ["string"]
  },
  "review": {
    "readiness": 0-100,
    "uncertainties": [
      { "issue": "string", "why_it_matters": "string", "how_to_resolve": "string" }
    ],
    "reviewer_note": "string",
    "checklist": [
      { "action": "string", "effort": "string" }
    ]
  }
}

Rules:
- confidence must be exactly "high", "medium", or "low"
- readiness is an integer 0–100 reflecting how decision-ready the evidence picture is
- Do not fabricate specific paper titles, DOIs, or URLs
- evidence fields should describe the *type* of support and known patterns, and note verification needs
- Write for a practical decision-maker, not an academic seminar
- Match the user's language (if they write in English, respond in English)`;
}

function buildUserPrompt(goal: string, depth: Depth): string {
  return `Research goal / decision context:

${goal}

Depth: ${depth}

Produce the full research route JSON now.`;
}

export type ResearchAgentResult = {
  run_id: string;
  framing?: Record<string, unknown>;
  plan?: Record<string, unknown>;
  brief?: Record<string, unknown>;
  review?: Record<string, unknown>;
  stats: {
    degraded_stages: string[];
    duration_seconds: number;
    llm_calls: number;
    tool_calls: number;
    context_trimmed: boolean;
  };
  log: { ts: string; stage: string; level: string; message: string }[];
  tool_calls: {
    step: number;
    tool: string;
    arguments?: unknown;
    ok?: boolean;
    result?: { error?: string };
  }[];
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

export async function runResearchAgent(
  goal: string,
  depth: Depth = "standard",
): Promise<ResearchAgentResult> {
  const { apiKey, apiBase, model } = getAgentConfig();
  if (!apiKey) {
    throw new Error(
      "No research API key configured. Set RESEARCH_API_KEY (or OPENAI_API_KEY) in your .env file.",
    );
  }

  const started = Date.now();
  const runId = `run-${Date.now().toString(36)}`;
  const log: ResearchAgentResult["log"] = [];
  const push = (stage: string, message: string, level = "info") => {
    log.push({ ts: new Date().toISOString(), stage, level, message });
  };

  push("frame", "Starting research route.");
  push("plan", `Depth=${depth}; calling model ${model}.`);

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: depth === "deep" ? 0.4 : 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(depth) },
        { role: "user", content: buildUserPrompt(goal, depth) },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };
      detail = errBody.error?.message || errBody.message || "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    push("review", `Model request failed: ${response.status}`, "error");
    throw new Error(
      detail ||
        `Research model request failed (${response.status}). Check API key, base URL, and model name.`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Model returned an empty response.");
  }

  push("gather", "Received model output.");
  push("synthesis", "Parsing structured brief.");

  const parsed = extractJson(content) as {
    framing?: Record<string, unknown>;
    plan?: Record<string, unknown>;
    brief?: Record<string, unknown>;
    review?: Record<string, unknown>;
  };

  push("review", "Research route complete.");

  const durationSeconds = Math.max(
    1,
    Math.round((Date.now() - started) / 1000),
  );

  return {
    run_id: runId,
    framing: parsed.framing,
    plan: parsed.plan,
    brief: parsed.brief,
    review: parsed.review,
    stats: {
      degraded_stages: [],
      duration_seconds: durationSeconds,
      llm_calls: 1,
      tool_calls: 0,
      context_trimmed: false,
    },
    log,
    tool_calls: [
      {
        step: 1,
        tool: "chat.completions",
        arguments: { model, depth },
        ok: true,
      },
    ],
  };
}
