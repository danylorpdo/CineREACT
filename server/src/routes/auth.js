import { Router } from "express";
import { query } from "../db.js";
import {
  comparePassword,
  digitsOnly,
  hashPassword,
  sendError,
  signToken,
  validateCpf,
  validateEmail,
  validateName,
  validatePhone,
  validateStrongPassword,
} from "../utils.js";

const router = Router();

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!validateEmail(email) || !password) {
    return sendError(res, 400, "Informe e-mail e senha validos.");
  }

  const found = await query(
    `SELECT id, role, name, email, phone, cpf, password_hash, created_at
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [String(email).trim().toLowerCase()]
  );

  if (!found.rowCount) {
    return sendError(res, 401, "Credenciais invalidas.");
  }

  const user = found.rows[0];
  const matches = await comparePassword(password, user.password_hash);
  if (!matches) {
    return sendError(res, 401, "Credenciais invalidas.");
  }

  return res.json({
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cpf: user.cpf,
      created_at: user.created_at,
    },
    token: signToken(user),
  });
}

router.post("/register/client", async (req, res) => {
  const { name, email, phone, cpf, password, confirmPassword } = req.body || {};

  if (!validateName(name)) {
    return sendError(res, 400, "Nome invalido.");
  }
  if (!validateEmail(email)) {
    return sendError(res, 400, "E-mail invalido.");
  }
  if (!validatePhone(phone)) {
    return sendError(res, 400, "Telefone invalido.");
  }
  if (!validateCpf(cpf)) {
    return sendError(res, 400, "CPF invalido.");
  }
  if (!validateStrongPassword(password)) {
    return sendError(res, 400, "Senha fraca.");
  }
  if (password !== confirmPassword) {
    return sendError(res, 400, "A confirmacao da senha nao confere.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCpf = digitsOnly(cpf);
  const normalizedPhone = digitsOnly(phone);

  const duplicate = await query(
    "SELECT id FROM users WHERE lower(email) = $1 OR cpf = $2 LIMIT 1",
    [normalizedEmail, normalizedCpf]
  );

  if (duplicate.rowCount) {
    return sendError(res, 409, "Ja existe cadastro com esse e-mail ou CPF.");
  }

  const passwordHash = await hashPassword(password);
  const created = await query(
    `INSERT INTO users (role, name, email, phone, cpf, password_hash)
     VALUES ('cliente', $1, $2, $3, $4, $5)
     RETURNING id, role, name, email, phone, cpf, created_at`,
    [String(name).trim(), normalizedEmail, normalizedPhone, normalizedCpf, passwordHash]
  );

  const user = created.rows[0];
  return res.status(201).json({
    user,
    token: signToken(user),
  });
});

router.post("/login", login);

export default router;
