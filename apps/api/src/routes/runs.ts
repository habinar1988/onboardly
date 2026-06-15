import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/email';

export const runsRouter = Router();

const StartRunSchema = z.object({
  client_id: z.string().uuid(),
  workflow_id: z.string().uuid(),
});

// GET /v1/runs
runsRouter.get('/', async (req: any, res, next) => {
  try {
    const { status, client_id } = req.query;
    let where = 'WHERE r.user_id = $1';
    const params: unknown[] = [req.userId];
    let idx = 2;

    if (status) { where += ` AND r.status = $${idx++}`; params.push(status); }
    if (client_id) { where += ` AND r.client_id = $${idx++}`; params.push(client_id); }

    const data = await query(
      `SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email, 'company', c.company) as client,
        json_build_object('id', w.id, 'name', w.name, 'steps', w.steps) as workflow
       FROM onboarding_runs r
       JOIN clients c ON c.id = r.client_id
       JOIN workflows w ON w.id = r.workflow_id
       ${where}
       ORDER BY r.started_at DESC`,
      params
    );
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /v1/runs
runsRouter.post('/', async (req: any, res, next) => {
  try {
    const body = StartRunSchema.parse(req.body);

    // Verify ownership
    const client = await queryOne<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM clients WHERE id = $1 AND user_id = $2',
      [body.client_id, req.userId]
    );
    if (!client) throw new AppError(404, 'not_found', 'Client not found');

    const workflow = await queryOne<{ id: string; steps: unknown[] }>(
      'SELECT id, steps FROM workflows WHERE id = $1 AND user_id = $2',
      [body.workflow_id, req.userId]
    );
    if (!workflow) throw new AppError(404, 'not_found', 'Workflow not found');

    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    const totalSteps = steps.length || 1;

    const [run] = await query(
      `INSERT INTO onboarding_runs (user_id, client_id, workflow_id, total_steps)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, body.client_id, body.workflow_id, totalSteps]
    );

    // Update client status to active
    await query(
      "UPDATE clients SET status = 'active', onboarding_stage = 'intake' WHERE id = $1",
      [body.client_id]
    );

    // Send welcome email (non-blocking)
    sendEmail({
      to: client.email,
      subject: `Welcome! Your onboarding has started`,
      type: 'welcome',
      data: { clientName: client.name },
    }).catch(console.error);

    res.status(201).json(run);
  } catch (err) { next(err); }
});

// GET /v1/runs/:id
runsRouter.get('/:id', async (req: any, res, next) => {
  try {
    const [run] = await query(
      `SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email, 'company', c.company) as client,
        json_build_object('id', w.id, 'name', w.name, 'steps', w.steps) as workflow
       FROM onboarding_runs r
       JOIN clients c ON c.id = r.client_id
       JOIN workflows w ON w.id = r.workflow_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!run) throw new AppError(404, 'not_found', 'Run not found');
    res.json(run);
  } catch (err) { next(err); }
});

// POST /v1/runs/:id/advance
runsRouter.post('/:id/advance', async (req: any, res, next) => {
  try {
    const run = await queryOne<{ id: string; current_step: number; total_steps: number; status: string }>(
      'SELECT * FROM onboarding_runs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!run) throw new AppError(404, 'not_found', 'Run not found');
    if (run.status === 'completed') throw new AppError(400, 'bad_request', 'Run already completed');

    const nextStep = run.current_step + 1;
    const pct = Math.round((nextStep / run.total_steps) * 100);
    const isComplete = nextStep > run.total_steps;

    const [updated] = await query(
      `UPDATE onboarding_runs
       SET current_step = $3, progress_pct = $4, status = $5,
           completed_at = $6, last_activity_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [
        req.params.id, req.userId,
        isComplete ? run.total_steps : nextStep,
        isComplete ? 100 : pct,
        isComplete ? 'completed' : 'in_progress',
        isComplete ? new Date() : null,
      ]
    );
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /v1/runs/:id/complete
runsRouter.post('/:id/complete', async (req: any, res, next) => {
  try {
    const [run] = await query(
      `UPDATE onboarding_runs
       SET status = 'completed', progress_pct = 100, completed_at = now(), last_activity_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.userId]
    );
    if (!run) throw new AppError(404, 'not_found', 'Run not found');

    // Update client stage
    await query(
      "UPDATE clients SET onboarding_stage = 'complete', status = 'completed' WHERE id = $1",
      [(run as any).client_id]
    );

    res.json(run);
  } catch (err) { next(err); }
});
