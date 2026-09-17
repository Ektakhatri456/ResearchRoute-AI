export const STAGES = [
  { key: "frame", name: "Frame", desc: "Restate the goal, infer the field, derive sub-questions." },
  { key: "plan", name: "Plan", desc: "Order the research steps and name the evidence each yields." },
  { key: "gather", name: "Gather", desc: "Call tools for vocabulary, sources, scoring and effort." },
  { key: "synthesis", name: "Synthesis", desc: "Draft the brief: findings, evidence, confidence." },
  { key: "review", name: "Review", desc: "Name uncertainties, then write the action checklist." },
] as const;
