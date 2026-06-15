import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(userId: string, plan: string) {
  return jwt.sign({ userId, plan }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

// POST /v1/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [body.email]);
    if (existing) throw new AppError(409, 'conflict', 'Email already registered');

    const hash = await bcrypt.hash(body.password, 12);
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial

    const [user] = await query<{ id: string; email: string; name: string; plan: string; trial_ends_at: string }>(
      `INSERT INTO users (email, password_hash, name, plan, trial_ends_at)
       VALUES ($1, $2, $3, 'free', $4)
       RETURNING id, email, name, plan, trial_ends_at`,
      [body.email, hash, body.name, trialEnd]
    );

    // Seed a default workflow for new users
    await query(
      `INSERT INTO workflows (user_id, name, description, steps, is_default)
       VALUES ($1, 'Standard Onboarding', 'Default onboarding workflow', $2, true)`,
      [user.id, JSON.stringify([
        { id: 1, title: 'Send Welcome Email', type: 'email', auto: true },
        { id: 2, title: 'Collect Intake Form', type: 'form', auto: false },
        { id: 3, title: 'Send Contract', type: 'document', auto: false },
        { id: 4, title: 'Kickoff Call', type: 'task', auto: false },
      ])]
    );

    res.status(201).json({ token: signToken(user.id, user.plan), user });
  } catch (err) {
    next(err);
  }
});

// POST /v1/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await queryOne<{ id: string; email: string; name: string; plan: string; password_hash: string; trial_ends_at: string }>(
      'SELECT id, email, name, plan, password_hash, trial_ends_at FROM users WHERE email = $1',
      [body.email]
    );
    if (!user) throw new AppError(401, 'unauthorized', 'Invalid credentials');

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) throw new AppError(401, 'unauthorized', 'Invalid credentials');

    const { password_hash: _, ...safeUser } = user;
    res.json({ token: signToken(user.id, user.plan), user: safeUser });
  } catch (err) {
    next(err);
  }
});

// GET /v1/auth/me
authRouter.get('/me', async (req: any, res, next) => {
  try {
    const user = await queryOne(
      'SELECT id, email, name, plan, trial_ends_at, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (!user) throw new AppError(404, 'not_found', 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});
