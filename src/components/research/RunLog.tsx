import { useState } from "react";
import type { ResearchResult } from "@/lib/research-api";
import { Button } from "@/components/ui/button";

export default function RunLog({ result }: { result: ResearchResult }) {
  const [open, setOpen] = useState(false);
  const { log = [], tool_calls: toolCalls = [], stats = {}, run_id: runId } = result;

  return (
    <section className="mt-2 border-t border-border py-7">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-2xl text-foreground">Run ledger</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="text-xs"
        >
          {open ? "Hide entries" : `Show ${log.length} entries`}
        </Button>
      </div>

      <div className="label-mono mt-3 flex flex-wrap gap-x-5 gap-y-1">
        <span>run {runId}</span>
        <span>{stats.duration_seconds}s</span>
        <span>{stats.llm_calls} llm calls</span>
        <span>{stats.tool_calls} tool calls</span>
        {stats.context_trimmed && <span className="text-warning">context trimmed</span>}
      </div>

      {toolCalls.length > 0 && (
        <div className="mt-4 space-y-1 text-xs">
          {toolCalls.map((t) => (
            <div key={t.step} className={t.ok ? "text-muted-foreground" : "text-destructive"}>
              <span className="text-primary">{String(t.step).padStart(2, "0")} {t.tool}</span>{" "}
              ({JSON.stringify(t.arguments)})
              {!t.ok && ` — ${t.result?.error || "failed"}`}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-4 max-h-80 overflow-auto border border-border bg-background p-3 text-xs">
          {log.map((entry, i) => (
            <div
              key={i}
              className={`grid grid-cols-[64px_88px_1fr] gap-2 py-0.5 ${
                entry.level === "error" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <span>{(entry.ts || "").slice(11, 19)}</span>
              <span className="text-primary">{entry.stage}</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
