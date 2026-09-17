import type { ResearchResult } from "@/lib/research-api";

function Panel({
  title,
  meta,
  className = "",
  children,
}: {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-b border-border py-7 last:border-b-0 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-2xl text-foreground">{title}</h3>
        {meta && <span className="label-mono">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

const confTone: Record<string, string> = {
  high: "text-success border-success/40 bg-success/10",
  medium: "text-warning border-warning/40 bg-warning/10",
  low: "text-destructive border-destructive/40 bg-destructive/10",
};

export default function BriefReport({ result }: { result: ResearchResult }) {
  const { framing, plan, brief, review, stats } = result;
  const degraded = stats?.degraded_stages || [];

  return (
    <div className="divide-y divide-border">
      {degraded.length > 0 && (
        <div className="border-l-4 border-warning bg-warning/10 p-4 text-sm">
          <span className="label-mono text-warning">Partial run</span>
          <p className="mt-1 text-muted-foreground">
            Skipped stages: {degraded.join(", ")}. The rest of the brief is still valid.
          </p>
        </div>
      )}

      {framing && (
        <Panel title="Framing" meta="01 · frame">
          <p className="max-w-3xl text-lg leading-relaxed text-foreground">{framing.restated_goal}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Discipline", framing.discipline],
              ["Adjacent field", framing.adjacent_field],
              ["Written for", framing.audience],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="border-l-2 border-accent bg-background p-3">
                  <dt className="label-mono">{k}</dt>
                  <dd className="mt-1 text-sm text-foreground">{v}</dd>
                </div>
              ))}
          </dl>
          {framing.sub_questions && framing.sub_questions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {framing.sub_questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          )}
          {framing.scope_notes && (
            <p className="mt-4 text-xs text-muted-foreground">{framing.scope_notes}</p>
          )}
        </Panel>
      )}

      {review && typeof review.readiness === "number" && (
        <Panel title="Readiness" meta="score">
          <div className="text-5xl text-primary">{review.readiness}</div>
          <div className="label-mono mt-1">out of 100</div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, review.readiness))}%` }}
            />
          </div>
          {review.reviewer_note && (
            <p className="mt-4 text-xs text-muted-foreground">{review.reviewer_note}</p>
          )}
        </Panel>
      )}

      {plan && plan.steps && plan.steps.length > 0 && (
        <Panel title="Research plan" meta={`02 · ${plan.steps.length} steps`}>
          {plan.strategy && <p className="mb-4 text-sm text-muted-foreground">{plan.strategy}</p>}
          <ol className="space-y-3">
            {plan.steps.map((s) => (
              <li key={s.id} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                <span className="font-mono text-xs text-primary">{String(s.id).padStart(2, "0")}</span>
                <div>
                  <h4 className="text-sm text-foreground">{s.title}</h4>
                  {s.purpose && <p className="mt-1 text-xs text-muted-foreground">{s.purpose}</p>}
                  {s.evidence_type && (
                    <span className="label-mono mt-2 inline-block rounded border border-border px-2 py-0.5">
                      {s.evidence_type}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {brief && (
        <Panel title="Evidence brief" meta="04 · synthesis">
          {brief.summary && <p className="mb-4 text-sm text-muted-foreground">{brief.summary}</p>}
          <div className="space-y-3">
            {brief.findings?.map((f, i) => (
              <div key={i} className="border border-border bg-background p-4">
                <div className="text-sm text-foreground">{f.claim}</div>
                {f.evidence && <div className="mt-1 text-xs text-muted-foreground">{f.evidence}</div>}
                {f.confidence && (
                  <span
                    className={`label-mono mt-2 inline-block rounded border px-2 py-0.5 ${
                      confTone[f.confidence] || "border-border"
                    }`}
                  >
                    {f.confidence} confidence
                  </span>
                )}
              </div>
            ))}
          </div>
          {brief.source_strategy && brief.source_strategy.length > 0 && (
            <>
              <div className="label-mono mt-5">Where to look, in order</div>
              <ol className="mt-2 space-y-1">
                {brief.source_strategy.map((s, i) => (
                  <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                    <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </>
          )}
        </Panel>
      )}

      {review && review.uncertainties && review.uncertainties.length > 0 && (
        <Panel title="Uncertainties" meta="05 · review">
          <div className="space-y-3">
            {review.uncertainties.map((u, i) => (
              <div key={i} className="border-l-2 border-warning/50 pl-3">
                <h4 className="text-sm text-foreground">{u.issue}</h4>
                {u.why_it_matters && (
                  <p className="mt-1 text-xs text-muted-foreground">{u.why_it_matters}</p>
                )}
                {u.how_to_resolve && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="label-mono mr-2">Resolve by</span>
                    {u.how_to_resolve}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {review && review.checklist && review.checklist.length > 0 && (
        <Panel
          title="Action checklist"
          meta={`${review.checklist.length} actions`}
          className=""
        >
          <ul className="space-y-2">
            {review.checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-3 border-b border-border bg-background p-3 last:border-b-0">
                <span className="mt-1 size-3 shrink-0 rounded-sm border border-primary/60" />
                <span className="flex-1 text-sm text-foreground">{c.action}</span>
                {c.effort && <span className="label-mono">{c.effort}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
