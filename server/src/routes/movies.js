import { Router } from "express";
import { query } from "../db.js";
import { sendError } from "../utils.js";

const router = Router();

router.get("/", async (_req, res) => {
  const result = await query(
    `SELECT
      m.id,
      m.name,
      m.genre,
      m.classification,
      m.duration_minutes,
      m.synopsis,
      m.director,
      m.cast_members,
      m.premiere_date,
      m.status,
      m.image_url,
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'date', s.session_date,
            'time', s.session_time,
            'language', s.language,
            'ticketPrice', s.ticket_price,
            'roomId', s.room_id
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      ) AS sessions
    FROM movies m
    LEFT JOIN sessions s ON s.movie_id = m.id
    GROUP BY m.id
    ORDER BY m.premiere_date DESC, m.name`
  );
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  const result = await query(
    `SELECT
      m.*,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', s.id,
            'date', s.session_date,
            'time', s.session_time,
            'language', s.language,
            'ticketPrice', s.ticket_price,
            'roomId', s.room_id,
            'roomNumber', r.room_number,
            'roomType', r.type
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      ) AS sessions
    FROM movies m
    LEFT JOIN sessions s ON s.movie_id = m.id
    LEFT JOIN rooms r ON r.id = s.room_id
    WHERE m.id = $1
    GROUP BY m.id`,
    [req.params.id]
  );

  if (!result.rowCount) {
    return sendError(res, 404, "Filme nao encontrado.");
  }

  return res.json(result.rows[0]);
});

export default router;
