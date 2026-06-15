import { Router } from 'express';
import { queryOne } from '../db/pool';

export const dashboardRouter = Router();

// GET /v1/dashboard/stats
dashboardRouter.get('/stats', async (req: any, res, next) => {
  try {
    const stats = await queryOne<{
      total_clients: string;
      active_runs: string;
      completed_this_month: string;
      pending_documents: string;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM clients WHERE user_id = $1 AND status != 'archived') as total_clients,
        (SELECT COUNT(*) FROM onboarding_runs WHERE user_id = $1 AND status = 'in_progress') as active_runs,
        (SELECT COUNT(*) FROM onboarding_runs
         WHERE user_id = $1 AND status = 'completed'
         AND completed_at >= date_trunc('month', now())) as completed_this_month,
        (SELECT COUNT(*) FROM documents d
         JOIN onboarding_runs r ON r.id = d.onboarding_run_id
         WHERE r.user_id = $1 AND d.status = 'pending') as pending_documents`,
      [req.userId]
    );

    // Avg completion days
    const avgResult = await queryOne<{ avg_days: string }>(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 86400), 1) as avg_days
       FROM onboarding_runs
       WHERE user_id = $1 AND status = 'completed' AND completed_at IS NOT NULL`,
      [req.userId]
    );

    // Completion rate
    const rateResult = await queryOne<{ total: string; completed: string }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM onboarding_runs WHERE user_id = $1`,
      [req.userId]
    );

    const total = parseInt(rateResult?.total ?? '0');
    const completed = parseInt(rateResult?.completed ?? '0');

    res.json({
      total_clients: parseInt(stats?.total_clients ?? '0'),
      active_runs: parseInt(stats?.active_runs ?? '0'),
      completed_this_month: parseInt(stats?.completed_this_month ?? '0'),
      pending_documents: parseInt(stats?.pending_documents ?? '0'),
      avg_completion_days: parseFloat(avgResult?.avg_days ?? '0') || 0,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (err) { next(err); }
});
