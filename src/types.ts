export type UserType = "cliente" | "funcionario" | "administrador";

export type MovieStatus = "Em Cartaz" | "Em Breve" | "Encerrado";

export type RoomType = "2D" | "3D" | "IMAX" | "VIP";

export type RoomStatus = "Ativa" | "Inativa" | "Manutencao";

export type SeatType = "Comum" | "Preferencial" | "VIP";

export type SeatStatus = "Disponivel" | "Ocupado" | "Manutencao";

export type SessionLanguage = "Dublado" | "Legendado";

export type TicketType = "Inteira" | "Meia" | "Promocional";

export type PaymentMethod = "Cartao de Credito" | "PIX" | "Debito";

export type PurchaseStatus = "Pendente" | "Pago" | "Cancelado";

export type ProductType = "Pipoca" | "Refrigerante" | "Agua" | "Combo" | "Doce";

export type OrderStatus = "Preparando" | "Pronto" | "Entregue";

export interface User {
  id: string;
  type: UserType;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  passwordHash: string;
  roleTitle?: string;
  shift?: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  name: string;
  genre: string;
  classification: "Livre" | "10" | "12" | "14" | "16" | "18";
  durationMinutes: number;
  synopsis: string;
  director: string;
  cast: string;
  premiereDate: string;
  status: MovieStatus;
  image: string;
  featured?: boolean;
}

export interface Seat {
  id: string;
  roomId: string;
  row: string;
  number: number;
  label: string;
  type: SeatType;
  status: SeatStatus;
}

export interface Room {
  id: string;
  number: number;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  seats: Seat[];
}

export interface CinemaSession {
  id: string;
  movieId: string;
  roomId: string;
  date: string;
  time: string;
  language: SessionLanguage;
  price: number;
  occupiedSeatIds: string[];
}

export interface Ticket {
  id: string;
  seatId: string;
  seatLabel: string;
  ticketType: TicketType;
  unitPrice: number;
  qrCode: string;
}

export interface Booking {
  id: string;
  userId: string;
  movieId: string;
  sessionId: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  total: number;
  tickets: Ticket[];
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  stock: number;
}

export interface SnackOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SnackOrder {
  id: string;
  clientId: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  items: SnackOrderItem[];
  total: number;
  status: OrderStatus;
}

export interface CinemaStore {
  users: User[];
  movies: Movie[];
  rooms: Room[];
  sessions: CinemaSession[];
  products: Product[];
  bookings: Booking[];
  snackOrders: SnackOrder[];
  currentUserId: string | null;
}

