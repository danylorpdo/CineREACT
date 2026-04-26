import { Router } from "express";
import { query } from "../db.js";
import { requireAdmin, requireAuth } from "../middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", async (_req, res) => {
  const [movies, sessions, users, sales, products] = await Promise.all([
    query("SELECT COUNT(*)::int AS total FROM movies"),
    query("SELECT COUNT(*)::int AS total FROM sessions"),
    query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'cliente'"),
    query("SELECT COALESCE(SUM(total), 0)::numeric AS total FROM ticket_purchases WHERE status = 'Pago'"),
    query("SELECT COUNT(*)::int AS total FROM products"),
  ]);

  res.json({
    movies: movies.rows[0].total,
    sessions: sessions.rows[0].total,
    clients: users.rows[0].total,
    ticketRevenue: Number(sales.rows[0].total),
    products: products.rows[0].total,
  });
});

export default router;
