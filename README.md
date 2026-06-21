# Oracle Evolution

Oracle Evolution is a self-evolving company OS built for a hackathon demo. A founder enters a business goal, Oracle creates agents, assigns work, evaluates outcomes with HUD, saves memory, kills weak agents, and spawns better replacements.

This repo keeps all prior milestones working:

- Task 1: core birth -> work -> HUD evaluate -> die -> evolve demo
- Task 2: approvals, Finance Agent, Hiring Agent, Product sandbox, and parallel execution
- Final: sponsor integration layer, genome, Memory Agent, pitch mode, and the full evolution demo

## Architecture

- Frontend: React + Vite + TypeScript + Tailwind CSS + React Flow
- Backend: Node.js + Express + TypeScript
- Realtime: Socket.io
- Storage: in-memory Maps for companies, agents, approvals, evaluations, genome, memory, sandbox runs, and hiring candidates

## Sponsor integrations

Server wrappers live in `server/src/services/sponsors/`:

- `hudClient.ts`: evaluation / natural selection
- `fireworksClient.ts`: agent reasoning summaries
- `exaClient.ts`: research and competitor discovery
- `daytonaClient.ts`: coding sandbox execution
- `modalClient.ts`: parallel specialist execution
- `sixtyFourClient.ts`: contractor and hiring research

Each wrapper:

- uses a real API path if its env key exists
- falls back to a simulated response if the key is missing or the integration errors
- never crashes the demo

## Setup

From `C:\Users\muham\Oracle.ai\Oracle.ai-`:

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
- Sponsors page: [http://localhost:5173/sponsors](http://localhost:5173/sponsors)

## Environment variables

Root, client, and server `.env.example` files include:

```bash
HUD_API_KEY=
FIREWORKS_API_KEY=
EXA_API_KEY=
DAYTONA_API_KEY=
MODAL_API_KEY=
SIXTYFOUR_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

The app runs fully without any API keys by using simulated sponsor responses.

## Main demos

### Task 1 Demo

`Run Task 1 Demo` shows:

- CEO spawns the initial company
- Research Agent uses research logic and gets a strong HUD score
- Research Agent completes and dies after saving knowledge
- Marketing Agent fails and is replaced by better specialists

### Task 2 Demo

`Run Phase 2 Demo` shows:

- Marketing Agent requests a `$300` ad budget
- Finance Agent reviews the spend
- Hiring Agent finds contractor candidates
- Product Agent runs a sandbox task
- CEO evolves the growth team

### Final Demo

`Run Full Evolution Demo` shows:

1. User starts an AI Translator company
2. CEO creates core agents
3. Research Agent uses Exa
4. HUD evaluates Research Agent
5. Research Agent dies after completion
6. Marketing Agent requests `$300`
7. Finance Agent recommends approval
8. User approves or the system auto-approves after 5 seconds
9. Marketing Agent executes a campaign simulation
10. HUD gives a low score
11. Marketing Agent dies
12. CEO spawns TikTok, Partnership, and Conversion Agents
13. Product Agent runs the Daytona sandbox flow
14. Hiring Agent uses the SixtyFour hiring flow
15. HUD evaluates active work
16. Genome updates
17. Dashboard shows `Company Evolved`

## Final dashboard

- `Evolution`: judge-friendly story and pitch mode
- `Agents`: live React Flow org chart
- `Approvals`: budget and hiring requests
- `Sandbox`: Product Agent sandbox runs
- `Genome`: company mutation logic
- `Memory`: Memory Agent records
- `Sponsors`: sponsor status and role in the system

## API

- `POST /api/company/start`
- `GET /api/company/:id`
- `GET /api/sponsors`
- `POST /api/demo/run`
- `POST /api/demo/phase2`
- `POST /api/demo/full`
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

## What to say to judges

“Oracle Evolution is a self-evolving company OS. A founder enters a business goal. Oracle creates agents, gives them tasks, evaluates them with HUD, kills bad agents, saves memory, and spawns better agents. Companies should evolve like software.”
