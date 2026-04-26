import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export function sendError(res, status, message, details) {
  res.status(status).json({
    error: message,
    details: details || null,
  });
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function validateName(value) {
  return /^[A-Za-zÀ-ÿ\s]{4,}$/.test(String(value || "").trim());
}

export function validatePhone(value) {
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 11;
}

export function validateStrongPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(String(value || ""));
}

export function validateCpf(value) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  return remainder === Number(cpf[10]);
}
