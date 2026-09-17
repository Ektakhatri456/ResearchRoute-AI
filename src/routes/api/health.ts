import { createFileRoute } from "@tanstack/react-router";
import { getAgentHealth } from "@/lib/research-agent";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const health = getAgentHealth();
        return Response.json({
          api_key_configured: health.api_key_configured,
          model: health.model,
          provider: health.provider,
        });
      },
    },
  },
});
