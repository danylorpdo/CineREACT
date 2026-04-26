CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('cliente', 'funcionario', 'administrador');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movie_status') THEN
    CREATE TYPE movie_status AS ENUM ('Em Cartaz', 'Em Breve', 'Encerrado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_type') THEN
    CREATE TYPE room_type AS ENUM ('2D', '3D', 'IMAX', 'VIP');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('Ativa', 'Inativa', 'Manutencao');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_type') THEN
    CREATE TYPE seat_type AS ENUM ('Comum', 'Preferencial', 'VIP');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_status') THEN
    CREATE TYPE seat_status AS ENUM ('Disponivel', 'Ocupado', 'Manutencao');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_language') THEN
    CREATE TYPE session_language AS ENUM ('Dublado', 'Legendado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_type') THEN
    CREATE TYPE ticket_type AS ENUM ('Inteira', 'Meia', 'Promocional');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('Cartao de Credito', 'PIX', 'Debito');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('Pendente', 'Pago', 'Cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
    CREATE TYPE product_type AS ENUM ('Pipoca', 'Refrigerante', 'Agua', 'Combo', 'Doce');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('Preparando', 'Pronto', 'Entregue');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(11),
  cpf VARCHAR(11) UNIQUE,
  password_hash TEXT NOT NULL,
  job_title VARCHAR(120),
  shift VARCHAR(40),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_client_email_unique
  ON users (LOWER(email))
  WHERE role = 'cliente';

CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  genre VARCHAR(80) NOT NULL,
  classification VARCHAR(10) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  synopsis TEXT NOT NULL,
  director VARCHAR(120) NOT NULL,
  cast_members TEXT NOT NULL,
  premiere_date DATE NOT NULL,
  status movie_status NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL UNIQUE,
  type room_type NOT NULL,
  status room_status NOT NULL DEFAULT 'Ativa',
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  seat_row VARCHAR(8) NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_type seat_type NOT NULL,
  status seat_status NOT NULL DEFAULT 'Disponivel',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, seat_row, seat_number)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  language session_language NOT NULL,
  ticket_price NUMERIC(10,2) NOT NULL CHECK (ticket_price > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id),
  status purchase_status NOT NULL DEFAULT 'Pendente',
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, seat_id)
);

CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  payment_method payment_method NOT NULL,
  status purchase_status NOT NULL DEFAULT 'Pendente',
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES ticket_purchases(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id),
  ticket_type ticket_type NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  qr_code TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  type product_type NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snack_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  payment_method payment_method NOT NULL,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status order_status NOT NULL DEFAULT 'Preparando',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snack_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES snack_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);
