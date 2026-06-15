import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export const workflowsRouter = Router();

const StepSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(['email', 'form', 'document', 'task', 'delay']),
  auto: z.boolean().default(false),
  config: z.record(z.unknown()).optional(),
});

const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(StepSchema),
  is_default: z.boolean().optional(),
});

// GET /v1/workflows
workflowsRouter.get('/', async (req: any, res, next) => {
  try {
    const data = await query(
      'SELECT * FROM workflows WHERE user_id = $1 AND is_archived = false ORDER BY is_default DESC, created_at DESC',
      [req.userId]
    );
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /v1/workflows
workflowsRouter.post('/', async (req: any, res, next) => {
  try {
    const body = WorkflowSchema.parse(req.body);

    // If setting as default, unset others
    if (body.is_default) {
      await query('UPDATE workflows SET is_default = false WHERE user_id = $1', [req.userId]);
    }

    const [workflow] = await query(
      `INSERT INTO workflows (user_id, name, description, steps, is_default)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, body.name, body.description ?? null, JSON.stringify(body.steps), body.is_default ?? false]
    );
    res.status(201).json(workflow);
  } catch (err) { next(err); }
});

// GET /v1/workflows/:id
workflowsRouter.get('/:id', async (req: any, res, next) => {
  try {
    const workflow = await queryOne(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!workflow) throw new AppError(404, 'not_found', 'Workflow not found');
    res.json(workflow);
  } catch (err) { next(err); }
});

// PATCH /v1/workflows/:id
workflowsRouter.patch('/:id', async (req: any, res, next) => {
  try {
    const body = WorkflowSchema.partial().parse(req.body);
    const existing = await queryOne(
      'SELECT id FROM workflows WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!existing) throw new AppError(404, 'not_found', 'Workflow not found');

    if (body.is_default) {
      await query('UPDATE workflows SET is_default = false WHERE user_id = $1', [req.userId]);
    }

    const updates: string[] = [];
    const values: unknown[] = [req.params.id, req.userId];
    let idx = 3;

    if (body.name !== undefined) { updates.push(`name = $${idx++}`); values.push(body.name); }
    if (body.description !== undefined) { updates.push(`description = $${idx++}`); values.push(body.description); }
    if (body.steps !== undefined) { updates.push(`steps = $${idx++}`); values.push(JSON.stringify(body.steps)); }
    if (body.is_default !== undefined) { updates.push(`is_default = $${idx++}`); values.push(body.is_default); }

    if (!updates.length) throw new AppError(400, 'bad_request', 'No fields to update');

    const [workflow] = await query(
      `UPDATE workflows SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      values
    );
    res.json(workflow);
  } catch (err) { next(err); }
});

// DELETE /v1/workflows/:id
workflowsRouter.delete('/:id', async (req: any, res, next) => {
  try {
    const result = await query(
      'DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.length) throw new AppError(404, 'not_found', 'Workflow not found');
    res.status(204).send();
  } catch (err) { next(err); }
});
