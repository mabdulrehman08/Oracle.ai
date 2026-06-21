# Oracle Evolution

Oracle Evolution is a hackathon MVP that treats a company like a living organism. Agents are born, assigned work, evaluated by HUD-style scoring, terminated when they fail or finish, and replaced by more specialized agents.

This repo now includes both:

- Task 1: the original birth / work / evaluate / die / evolve demo
- Task 2: Autonomous Company Mode with approvals, budget flow, hiring research, sandbox runs, and parallel agent activity

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS + React Flow
- Backend: Node.js + Express + TypeScript
- Realtime: Socket.io
- Storage: in-memory Maps with mock sponsor integrations

## Run locally

```bash
npm install
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd install
npm.cmd run dev
```

- Client: [http://localhost:5173](http://localhost:5173)
- Server: [http://localhost:4000](http://localhost:4000)

## Task 1 Demo

`Run Task 1 Demo` shows:

- CEO spawns Research, Product, Marketing, and Finance agents
- Research Agent completes market analysis and earns a strong HUD score
- Marketing Agent fails, dies, and gets replaced by better specialists
- Timeline, org chart, and company metrics update live

## Task 2 Demo

`Run Phase 2 Demo` adds Autonomous Company Mode:

- Marketing Agent requests a `$300` ad budget
- Finance Agent reviews the spend and recommends approval
- User approves or rejects in the Approvals tab
- Hiring Agent requests contractor help and returns mock candidates
- Product Agent runs a mock sandbox task and returns logs, files changed, and a preview URL
- CEO reviews the outcomes, kills weaker agents, and spawns TikTok, Partnership, and Conversion specialists

## Tabs and panels

- `Org Chart`: live React Flow company structure
- `Timeline`: live event stream
- `Approvals`: human approval queue with finance reasoning and hiring candidates
- `Sandbox`: Product Agent execution logs and preview state
- `Memory`: company memory accumulated from agent work

## API

- `POST /api/company/start`
- `GET /api/company/:id`
- `POST /api/demo/run`
- `POST /api/demo/phase2`
- `POST /api/approvals/request`
- `GET /api/company/:id/approvals`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`
- `POST /api/hiring/search`
- `POST /api/sandbox/run`
- `POST /api/agents/:id/run`
- `POST /api/evaluate`
- `POST /api/agents/:id/terminate`
- `POST /api/agents/spawn`

## Realtime events

- Task 1 events:
  - `company_created`
  - `agent_created`
  - `task_started`
  - `task_completed`
  - `hud_evaluated`
  - `agent_completed`
  - `agent_terminated`
  - `agents_spawned`
  - `metrics_updated`
  - `timeline_event`
- Task 2 additions:
  - `approval_requested`
  - `approval_approved`
  - `approval_rejected`
  - `finance_reviewed`
  - `hiring_candidates_found`
  - `sandbox_started`
  - `sandbox_completed`
  - `parallel_run_started`
  - `parallel_run_completed`

## Environment

`.env.example`, `client/.env.example`, and `server/.env.example` are present for future sponsor integrations such as Fireworks, Exa, HUD, and Supabase. The app works with zero API keys using mock data.
