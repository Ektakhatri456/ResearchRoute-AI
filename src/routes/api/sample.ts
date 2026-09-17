import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sample")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          goal: "Assess how effective urban tree-planting programmes are at reducing summer heat in mid-sized cities, and what evidence a city council would need before funding one.",
          depth: "standard",
        });
      },
    },
  },
});
