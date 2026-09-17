import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, RotateCcw, Sparkles } from "lucide-react";
import { STAGES } from "@/components/research/stages";
import BriefReport from "@/components/research/BriefReport";
import RunLog from "@/components/research/RunLog";
import { Button } from "@/components/ui/button";
import {
  getHealth,
  getSampleGoal,
  runResearch,
  type Health,
  type ResearchResult,
} from "@/lib/research-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResearchRoute AI — Plan the route before the literature" },
      {
        name: "description",
        content:
          "An agent that frames a research goal, plans the steps, scores evidence and returns a brief with uncertainties and an action checklist.",
      },
      { property: "og:title", content: "ResearchRoute AI" },
      {
        property: "og:description",
        content: "Frame, plan, gather, synthesise, review — a research route in one run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STAGE_TICK_MS = 5200;

const DEPTHS = [
  { id: "quick", label: "Quick scan", note: "3 steps" },
  { id: "standard", label: "Standard review", note: "5 steps" },
  { id: "deep", label: "Deep dive", note: "7 steps" },
];

function Index() {
  const [goal, setGoal] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null | undefined>(undefined);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getHealth().then((res) => setHealth(res.success ? res.data : null));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Enter a research goal before running the agent.";
    if (trimmed.length < 15) return "That is too short — describe the goal in at least 15 characters.";
    if (trimmed.split(/\s+/).length < 4) return "Write the goal as a full sentence of at least four words.";
    return null;
  };

  const startStageTicker = () => {
    setCompleted([]);
    setActiveStage(STAGES[0]!.key);
    let index = 0;
    timerRef.current = setInterval(() => {
      index += 1;
      if (index >= STAGES.length) return;
      setCompleted(STAGES.slice(0, index).map((s) => s.key));
      setActiveStage(STAGES[index]!.key);
    }, STAGE_TICK_MS);
  };

  const handleRun = async () => {
    const problem = validate(goal);
    setValidationError(problem);
    if (problem) return;

    setApiError(null);
    setResult(null);
    setLoading(true);
    startStageTicker();

    const res = await runResearch(goal.trim(), depth);

    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(false);

    if (res.success) {
      const degraded = res.data.stats?.degraded_stages || [];
      setCompleted(STAGES.map((s) => s.key).filter((k) => !degraded.includes(k)));
      setActiveStage(null);
      setResult(res.data);
    } else {
      setActiveStage(null);
      setCompleted([]);
      setApiError(res.error);
    }
  };

  const handleSample = async () => {
    setValidationError(null);
    setApiError(null);
    const res = await getSampleGoal();
    if (res.success) {
      setGoal(res.data.goal);
      setDepth(res.data.depth || "standard");
    } else {
      setGoal(
        "Assess how effective urban tree-planting programmes are at reducing summer heat in mid-sized cities, and what evidence a city council would need before funding one."
      );
    }
  };

  const handleReset = () => {
    setGoal("");
    setResult(null);
    setApiError(null);
    setValidationError(null);
    setCompleted([]);
    setActiveStage(null);
  };

  const offline = health === null;
  const keyMissing = health?.api_key_configured === false;
  const current = STAGES.find((s) => s.key === activeStage);

  return (
    <div className="min-h-screen bg-background px-3 py-3 sm:px-6 sm:py-7 lg:px-10">
      <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl overflow-hidden border border-primary/30 bg-surface shadow-[var(--shadow-panel)] lg:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="flex flex-col bg-primary px-5 py-7 text-primary-foreground sm:px-7 lg:min-h-[calc(100vh-3.5rem)]">
          <div className="flex items-center gap-3 border-b border-primary-foreground/20 pb-6">
            <span className="grid size-11 place-items-center border border-accent/70 bg-primary-foreground/10 text-accent">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl leading-none">ResearchRoute</h1>
              <p className="mt-1 text-xs text-primary-foreground/65">AI research desk</p>
            </div>
          </div>

          <section className="py-7">
            <p className="text-xs font-semibold uppercase text-accent">Begin an inquiry</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Plan the route before the literature.</h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
              Define the decision you need to make. Your research brief will be arranged in the reading desk beside it.
            </p>

            <div className="mt-7 flex items-center justify-between text-xs text-primary-foreground/70">
              <label htmlFor="goal" className="font-semibold">Research question</label>
              <span>{goal.trim().length} / 1000</span>
            </div>
            <textarea
              id="goal"
              value={goal}
              maxLength={1000}
              disabled={loading}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you need to understand, and what decision will the answer support?"
              className={`mt-2 min-h-40 w-full resize-y border bg-primary-foreground/95 p-4 text-sm leading-relaxed text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:glow-ring ${validationError ? "border-destructive" : "border-primary-foreground/25"}`}
            />
            <p className={`mt-2 text-xs leading-relaxed ${validationError ? "text-destructive-foreground" : "text-primary-foreground/60"}`}>
              {validationError ?? "Use a full sentence and include the decision this research should support."}
            </p>

            <fieldset className="mt-6">
              <legend className="text-xs font-semibold text-primary-foreground/70">Depth of review</legend>
              <div className="mt-2 grid grid-cols-3 border border-primary-foreground/25 p-1">
                {DEPTHS.map((d) => (
                  <Button key={d.id} type="button" variant="ghost" disabled={loading} onClick={() => setDepth(d.id)} className={`h-auto min-w-0 flex-col gap-0 rounded-sm px-1 py-2 ${depth === d.id ? "bg-accent text-accent-foreground hover:bg-accent/90" : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"}`}>
                    <span className="text-xs">{d.label.replace(" scan", "").replace(" review", "").replace(" dive", "")}</span>
                    <span className="text-[10px] font-normal opacity-70">{d.note}</span>
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid gap-2">
              <Button onClick={handleRun} disabled={loading || offline || keyMissing} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                <Sparkles aria-hidden="true" /> {loading ? "Preparing brief…" : "Run research"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleSample} disabled={loading} className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Load sample</Button>
                <Button variant="outline" onClick={handleReset} disabled={loading || (!result && !apiError && !goal)} className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><RotateCcw aria-hidden="true" /> Reset</Button>
              </div>
            </div>
          </section>

          <div className="mt-auto border-t border-primary-foreground/20 pt-5 text-xs text-primary-foreground/60">
            Evidence is evaluated, not browsed. The brief recommends where to verify each finding.
          </div>
        </aside>

        <section className="min-w-0 bg-surface px-5 py-7 sm:px-8 lg:px-10">
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-primary">Research folio</span>
              <h2 className="mt-1 text-3xl text-foreground">Active workspace</h2>
            </div>
            <div className={`flex w-fit items-center gap-2 border px-3 py-1.5 text-xs font-medium ${offline || keyMissing ? "border-warning/50 text-warning" : "border-success/40 text-success"}`}>
              <span className="size-2 rounded-full bg-current" />
              {offline ? "Service unavailable" : keyMissing ? "Key required" : `Ready · ${health?.model || "research model"}`}
            </div>
          </header>

          <ol className="grid grid-cols-2 border-b border-border py-5 sm:grid-cols-5">
            {STAGES.map((stage, i) => {
              const done = completed.includes(stage.key);
              const active = activeStage === stage.key;
              return (
                <li key={stage.key} className="relative px-2 py-2 sm:border-r sm:border-border sm:last:border-r-0">
                  <div className={`text-[10px] font-semibold ${done || active ? "text-primary" : "text-muted-foreground"}`}>CHAPTER {String(i + 1).padStart(2, "0")}</div>
                  <div className={`mt-1 text-sm ${done || active ? "text-foreground" : "text-muted-foreground"}`}>{stage.name}</div>
                  <span className={`absolute bottom-0 left-2 h-0.5 transition-all ${done ? "w-[calc(100%-1rem)] bg-primary" : active ? "w-1/2 animate-pulse bg-accent" : "w-0"}`} />
                </li>
              );
            })}
          </ol>

          <div className="pt-7">
            {(offline || keyMissing) && (
              <div className="mb-5 border-l-4 border-warning bg-warning/10 p-4 text-sm">
                <strong>{offline ? "Service unavailable." : "Model key required."}</strong>{" "}
                <span className="text-muted-foreground">
                  {offline
                    ? "Research runs cannot start until the service is ready."
                    : "Add RESEARCH_API_KEY (or OPENAI_API_KEY) to a .env file in the project root, then restart npm run dev."}
                </span>
              </div>
            )}
            {apiError && <div className="mb-5 border-l-4 border-destructive bg-destructive/10 p-4 text-sm"><strong className="text-destructive">Run failed.</strong> <span className="text-muted-foreground">{apiError}</span></div>}

            {loading && (
              <section className="border border-border bg-background p-6 sm:p-8">
                <span className="text-xs font-semibold uppercase text-primary">Now preparing</span>
                <div className="mt-3 flex items-end justify-between gap-4"><h3 className="text-3xl">{current?.name || "Opening the folio"}</h3><span className="text-sm text-muted-foreground">In progress</span></div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{current?.desc || "Sending the goal to the agent…"}</p>
                <div className="mt-8 space-y-3">{[92, 78, 85, 62].map((w) => <div key={w} className="scan-line h-2 bg-muted" style={{ width: `${w}%` }} />)}</div>
                <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">A standard review usually takes 20–45 seconds; a deep dive can take longer.</p>
              </section>
            )}

            {!loading && !result && !apiError && (
              <div className="grid min-h-[22rem] place-items-center border border-dashed border-border bg-background/50 px-6 text-center">
                <div className="max-w-md"><BookOpen aria-hidden="true" className="mx-auto size-8 text-accent" /><h3 className="mt-5 text-3xl">A fresh folio awaits.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Enter your question in the research desk, or load the sample to begin.</p></div>
              </div>
            )}

            {result && <div ref={resultRef}><BriefReport result={result} /><RunLog result={result} /></div>}
          </div>
        </section>
      </main>
    </div>
  );
}
