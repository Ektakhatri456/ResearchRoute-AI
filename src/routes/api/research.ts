import { createFileRoute } from "@tanstack/react-router";
import { getAgentHealth, runResearchAgent } from "@/lib/research-agent";

export const Route = createFileRoute("/api/research")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { goal?: string; depth?: string } = {};
        try {
          body = (await request.json()) as { goal?: string; depth?: string };
        } catch {
          return Response.json(
            { detail: "Invalid JSON body. Expected { goal, depth }." },
            { status: 400 },
          );
        }

        const goal = (body.goal || "").trim();
        const depth = body.depth || "standard";

        if (goal.length < 15) {
          return Response.json(
            {
              detail:
                "That goal was rejected by validation. Write it as a full sentence of at least 15 characters.",
            },
            { status: 422 },
          );
        }

        const health = getAgentHealth();
        if (!health.api_key_configured) {
          return Response.json(
            {
              detail:
                "Model key required. Add RESEARCH_API_KEY (or OPENAI_API_KEY) to your .env file and restart the dev server.",
            },
            { status: 503 },
          );
        }

        try {
          const result = await runResearchAgent(goal, depth);
          return Response.json(result);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Research run failed.";
          return Response.json({ detail: message }, { status: 502 });
        }
      },
    },
  },
});
