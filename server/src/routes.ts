import { Router } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { evaluateTaskOutput } from './evaluator.js';
import {
  approveRequest,
  completePhaseTwoRun,
  continuePhaseTwoAfterApproval,
  createApprovalRequest,
  createHiringCandidates,
  finalizeFullEvolution,
  rejectRequest,
  runAgentTask,
  runDemoSequence,
  runFullEvolutionDemo,
  runPhaseTwoDemo,
  runSandboxTask,
  startCompanyFlow,
  terminateAgent,
} from './demoEngine.js';
import { createAgent, createCompany, createEvaluation, getAgent, getApprovalsByCompany, getCompany, getCompanySnapshot, getMemoryByCompany, getSponsorStatuses } from './store.js';

export const createRoutes = (io: SocketServer) => {
  const router = Router();

  router.post('/company/start', (req, res) => {
    const { idea, budget, mode } = req.body as {
      idea?: string;
      budget?: number;
      mode?: 'profit' | 'growth';
    };

    if (!idea || typeof budget !== 'number' || !mode) {
      return res.status(400).json({ error: 'idea, budget, and mode are required' });
    }

    const company = createCompany(idea, budget, mode);
    const ceo = createAgent({
      companyId: company.id,
      name: 'CEO Agent',
      role: 'Chief Evolution Officer',
      status: 'spawned',
      kpi: 'Build and evolve the org chart',
      isCore: true,
    });

    startCompanyFlow(io, idea, budget, mode, company);
    const snapshot = getCompanySnapshot(company.id);

    return res.json({
      company,
      agents: [ceo],
      events: snapshot?.events ?? [],
    });
  });

  router.get('/company/:id', (req, res) => {
    const snapshot = getCompanySnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json(snapshot);
  });

  router.get('/sponsors', (_req, res) => {
    return res.json({ sponsors: getSponsorStatuses() });
  });

  router.post('/demo/run', (req, res) => {
    const { companyId } = req.body as { companyId?: string };
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    runDemoSequence(io, companyId).catch((error: unknown) => {
      console.error('Task 1 demo failed', error);
    });

    return res.json({ ok: true, companyId });
  });

  router.post('/demo/phase2', async (req, res) => {
    const { companyId } = req.body as { companyId?: string };
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    try {
      const run = await runPhaseTwoDemo(io, companyId);
      return res.json({ ok: true, companyId, pendingApprovalId: run.approvalId });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/demo/full', async (req, res) => {
    const { companyId } = req.body as { companyId?: string };
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    try {
      const run = await runFullEvolutionDemo(io, companyId);
      return res.json({ ok: true, companyId, pendingApprovalId: run.approvalId });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/agents/:id/run', (req, res) => {
    try {
      const agent = runAgentTask(io, req.params.id);
      return res.json({ agent });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/evaluate', async (req, res) => {
    const { agentId, taskOutput, taskTitle } = req.body as { agentId?: string; taskOutput?: string; taskTitle?: string };
    if (!agentId || !taskOutput) {
      return res.status(400).json({ error: 'agentId and taskOutput are required' });
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const company = getCompany(agent.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const result = await evaluateTaskOutput({
      company,
      agent,
      taskTitle: taskTitle ?? 'Manual evaluation',
      taskOutput,
      memory: getMemoryByCompany(agent.companyId),
    });
    createEvaluation(result);
    return res.json(result);
  });

  router.post('/agents/:id/terminate', (req, res) => {
    try {
      const agent = terminateAgent(io, req.params.id, req.body?.deathReason);
      return res.json({ agent });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/agents/spawn', (req, res) => {
    const { companyId, parentAgentId, agents } = req.body as {
      companyId?: string;
      parentAgentId?: string;
      agents?: Array<{ name: string; role: string; kpi: string }>;
    };

    if (!companyId || !agents?.length) {
      return res.status(400).json({ error: 'companyId and agents are required' });
    }

    const created = agents.map((agent) =>
      createAgent({
        companyId,
        parentAgentId,
        name: agent.name,
        role: agent.role,
        status: 'spawned',
        kpi: agent.kpi,
      }),
    );

    return res.json({ agents: created });
  });

  router.post('/approvals/request', async (req, res) => {
    const { companyId, agentId, type, title, amount, reason } = req.body as {
      companyId?: string;
      agentId?: string;
      type?: 'ad_budget' | 'hiring' | 'tool_usage' | 'contractor';
      title?: string;
      amount?: number;
      reason?: string;
    };

    if (!companyId || !agentId || !type || !title || typeof amount !== 'number' || !reason) {
      return res.status(400).json({ error: 'companyId, agentId, type, title, amount, and reason are required' });
    }

    const approval = await createApprovalRequest(io, companyId, agentId, type, title, amount, reason);
    return res.json({ approval });
  });

  router.get('/company/:id/approvals', (req, res) => {
    return res.json({ approvals: getApprovalsByCompany(req.params.id) });
  });

  router.post('/approvals/:id/approve', async (req, res) => {
    try {
      const approval = approveRequest(io, req.params.id);
      if (approval.type === 'ad_budget') {
        await continuePhaseTwoAfterApproval(io, approval.id);
        const snapshot = getCompanySnapshot(approval.companyId);
        const ceo = snapshot?.agents.find((agent) => agent.name === 'CEO Agent');
        if (ceo) {
          await completePhaseTwoRun(io, approval.companyId, ceo.id);
          await finalizeFullEvolution(io, approval.companyId);
        }
      }
      return res.json({ approval });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/approvals/:id/reject', (req, res) => {
    try {
      const approval = rejectRequest(io, req.params.id);
      return res.json({ approval });
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/hiring/search', async (req, res) => {
    const { companyId, agentId } = req.body as { companyId?: string; agentId?: string };
    if (!companyId || !agentId) {
      return res.status(400).json({ error: 'companyId and agentId are required' });
    }

    const candidates = await createHiringCandidates(io, companyId, agentId);
    return res.json({ candidates });
  });

  router.post('/sandbox/run', async (req, res) => {
    const { agentId, taskTitle, filesToCreate } = req.body as {
      agentId?: string;
      taskTitle?: string;
      filesToCreate?: string[];
    };
    if (!agentId || !taskTitle || !filesToCreate?.length) {
      return res.status(400).json({ error: 'agentId, taskTitle, and filesToCreate are required' });
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const run = await runSandboxTask(io, agent.companyId, agentId, taskTitle, filesToCreate);
    return res.json(run);
  });

  return router;
};
