# CineReact API

Backend em Node.js + Express preparado para PostgreSQL.

## Como usar

1. Copie `.env.example` para `.env`
2. Ajuste `DATABASE_URL`
3. Rode o schema em `sql/schema.sql`
4. Instale dependencias com `npm install`
5. Execute `npm run dev`

## Endpoints iniciais

- `GET /health`
- `POST /auth/register/client`
- `POST /auth/login`
- `GET /movies`
- `GET /movies/:id`
- `GET /admin/overview`

## Regra de perfis

- Cliente se cadastra sozinho
- O login e unico: o sistema identifica se a conta e cliente ou administradora
