import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export const clientsRouter = Router();

const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateClientSchema = CreateClientSchema.partial().extend({
  status: z.enum(['new', 'active', 'completed', 'archived']).optional(),
});

// GET /v1/clients
clientsRouter.get('/', async (req: any, res, next) => {
  try {
    const { status, search, page = '1', per_page = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const perPage = Math.min(100, Math.max(1, parseInt(per_page)));
    const offset = (pageNum - 1) * perPage;

    let where = 'WHERE user_id = $1';
    const params: unknown[] = [req.userId];
    let idx = 2;

    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (search) {
      where += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR company ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM clients ${where}`, params
    );
    const data = await query(
      `SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    res.json({
      data,
      pagination: {
        total: parseInt(count),
        page: pageNum,
        per_page: perPage,
        total_pages: Math.ceil(parseInt(count) / perPage),
      },
    });
  } catch (err) { next(err); }
});

// POST /v1/clients
clientsRouter.post('/', async (req: any, res, next) => {
  try {
    const body = CreateClientSchema.parse(req.body);
    const existing = await queryOne(
      'SELECT id FROM clients WHERE user_id = $1 AND email = $2',
      [req.userId, body.email]
    );
    if (existing) throw new AppError(409, 'conflict', 'Client with this email already exists');

    const [client] = await query(
      `INSERT INTO clients (user_id, name, email, company, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, body.name, body.email, body.company ?? null, body.phone ?? null, body.notes ?? null]
    );
    res.status(201).json(client);
  } catch (err) { next(err); }
});

// GET /v1/clients/:id
clientsRouter.get('/:id', async (req: any, res, next) => {
  try {
    const client = await queryOne(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!client) throw new AppError(404, 'not_found', 'Client not found');
    res.json(client);
  } catch (err) { next(err); }
});

// PATCH /v1/clients/:id
clientsRouter.patch('/:id', async (req: any, res, next) => {
  try {
    const body = UpdateClientSchema.parse(req.body);
    const existing = await queryOne(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!existing) throw new AppError(404, 'not_found', 'Client not found');

    const fields = Object.entries(body).filter(([, v]) => v !== undefined);
    if (fields.length === 0) throw new AppError(400, 'bad_request', 'No fields to update');

    const setClause = fields.map(([k], i) => `${k} = $${i + 3}`).join(', ');
    const values = fields.map(([, v]) => v);

    const [client] = await query(
      `UPDATE clients SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.userId, ...values]
    );
    res.json(client);
  } catch (err) { next(err); }
});

// DELETE /v1/clients/:id
clientsRouter.delete('/:id', async (req: any, res, next) => {
  try {
    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.length) throw new AppError(404, 'not_found', 'Client not found');
    res.status(204).send();
  } catch (err) { next(err); }
});
