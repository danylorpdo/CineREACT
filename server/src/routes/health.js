import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const result = await query("SELECT NOW() AS now");
  res.json({
    status: "ok",
    databaseTime: result.rows[0]?.now ?? null,
  });
});

export default router;
