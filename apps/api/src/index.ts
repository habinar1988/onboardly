import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { clientsRouter } from './routes/clients';
import { workflowsRouter } from './routes/workflows';
import { runsRouter } from './routes/runs';
import { documentsRouter } from './routes/documents';
import { billingRouter } from './routes/billing';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────
app.use('/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/v1', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// ── Body parsing ──────────────────────────────────────────
// Stripe webhooks need raw body
app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));

// ── Public routes ─────────────────────────────────────────
app.use('/v1/auth', authRouter);
app.use('/v1/webhooks', billingRouter); // stripe webhook is public

// ── Protected routes ──────────────────────────────────────
app.use('/v1', authenticate);
app.use('/v1/clients', clientsRouter);
app.use('/v1/workflows', workflowsRouter);
app.use('/v1/runs', runsRouter);
app.use('/v1/documents', documentsRouter);
app.use('/v1/billing', billingRouter);
app.use('/v1/dashboard', dashboardRouter);

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Onboardly API running on port ${PORT}`);
});

export default app;
