import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/email';

export const documentsRouter = Router();

const AddDocSchema = z.object({
  type: z.enum(['contract', 'nda', 'questionnaire', 'proposal', 'invoice']),
  title: z.string().min(1),
  content: z.record(z.unknown()).optional(),
});

// GET /v1/runs/:runId/documents
documentsRouter.get('/runs/:runId/documents', async (req: any, res, next) => {
  try {
    // Verify run ownership
    const run = await queryOne(
      'SELECT id FROM onboarding_runs WHERE id = $1 AND user_id = $2',
      [req.params.runId, req.userId]
    );
    if (!run) throw new AppError(404, 'not_found', 'Run not found');

    const data = await query(
      'SELECT * FROM documents WHERE onboarding_run_id = $1 ORDER BY created_at ASC',
      [req.params.runId]
    );
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /v1/runs/:runId/documents
documentsRouter.post('/runs/:runId/documents', async (req: any, res, next) => {
  try {
    const run = await queryOne(
      'SELECT id FROM onboarding_runs WHERE id = $1 AND user_id = $2',
      [req.params.runId, req.userId]
    );
    if (!run) throw new AppError(404, 'not_found', 'Run not found');

    const body = AddDocSchema.parse(req.body);
    const [doc] = await query(
      `INSERT INTO documents (user_id, onboarding_run_id, type, title, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, req.params.runId, body.type, body.title, body.content ? JSON.stringify(body.content) : null]
    );
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

// POST /v1/documents/:id/send
documentsRouter.post('/:id/send', async (req: any, res, next) => {
  try {
    const doc = await queryOne<{ id: string; title: string; onboarding_run_id: string }>(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!doc) throw new AppError(404, 'not_found', 'Document not found');

    // Get client email
    const [clientData] = await query<{ email: string; name: string }>(
      `SELECT c.email, c.name FROM clients c
       JOIN onboarding_runs r ON r.client_id = c.id
       WHERE r.id = $1`,
      [doc.onboarding_run_id]
    );

    const [updated] = await query(
      "UPDATE documents SET status = 'sent', sent_at = now() WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    // Send email notification
    if (clientData) {
      sendEmail({
        to: clientData.email,
        subject: `Action required: ${doc.title}`,
        type: 'document_request',
        data: { clientName: clientData.name, documentTitle: doc.title },
      }).catch(console.error);
    }

    res.json(updated);
  } catch (err) { next(err); }
});

// POST /v1/documents/:id/sign
documentsRouter.post('/:id/sign', async (req: any, res, next) => {
  try {
    const [doc] = await query(
      "UPDATE documents SET status = 'signed', signed_at = now() WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.userId]
    );
    if (!doc) throw new AppError(404, 'not_found', 'Document not found');
    res.json(doc);
  } catch (err) { next(err); }
});
