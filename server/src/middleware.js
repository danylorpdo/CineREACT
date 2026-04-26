import { verifyToken, sendError } from "./utils.js";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return sendError(res, 401, "Token de acesso nao informado.");
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return sendError(res, 401, "Token invalido ou expirado.");
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "administrador") {
    return sendError(res, 403, "Acesso restrito ao administrador.");
  }
  return next();
}
