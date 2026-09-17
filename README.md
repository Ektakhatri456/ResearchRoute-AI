# ResearchRoute AI

**Plan the route before the literature.**

An AI research desk that frames a research goal, plans the steps, scores evidence, and returns a structured brief with uncertainties and an action checklist.

## Features

- Research question input with depth selection (Quick / Standard / Deep)
- Multi-stage pipeline: Frame → Plan → Gather → Synthesis → Review
- Structured brief: findings, confidence, uncertainties, action checklist
- Run ledger (audit log of the run)
- **Real LLM backend** via any OpenAI-compatible API

## Setup

### 1. Install

```bash
npm install
```

### 2. Add your API key

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Set at least:

```env
RESEARCH_API_KEY=sk-your-key-here
```

Optional:

```env
RESEARCH_API_BASE=https://api.openai.com/v1
RESEARCH_MODEL=gpt-4o-mini
```

Works with OpenAI, Groq, OpenRouter, and other OpenAI-compatible providers.

### 3. Run

```bash
npm run dev
```

Open the URL shown in the terminal.

### 4. Test

1. Status badge should show **Ready · &lt;model name&gt;** (not “Key required”)
2. Click **Load sample** or paste a research question
3. Choose depth → **Run research**
4. Wait for the model (often 5–30 seconds)
5. Review the brief + run ledger

## Project structure

```
src/
├── lib/
│   ├── research-agent.ts   # LLM agent (server-side)
│   └── research-api.ts     # Frontend API client
├── routes/
│   ├── api/
│   │   ├── health.ts
│   │   ├── sample.ts
│   │   └── research.ts
│   ├── __root.tsx
│   └── index.tsx
└── components/research/    # BriefReport, RunLog, stages
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Notes

- The agent produces a **decision-oriented brief** from model knowledge. It does **not** live-browse the web or invent real paper citations.
- Always verify important claims before acting on the brief.
- Never commit your `.env` file (it is gitignored).
