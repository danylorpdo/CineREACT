import cors from "cors";
import express from "express";
import { config } from "./config.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import movieRoutes from "./routes/movies.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "CineReact API",
      version: "1.0.0",
      endpoints: [
        "/health",
        "/auth/login",
        "/auth/register/client",
        "/movies",
        "/admin/overview",
      ],
    });
  });

  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/movies", movieRoutes);
  app.use("/admin", adminRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: "Erro interno do servidor.",
    });
  });

  return app;
}
