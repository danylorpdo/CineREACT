import spiderman3 from "../assets/spiderman3.png";
import type {
  Booking,
  CinemaSession,
  Movie,
  PaymentMethod,
  Product,
  Room,
  Seat,
  SeatStatus,
  SnackOrder,
  TicketType,
  User,
  UserType,
} from "../types";

export const STORAGE_KEY = "cinereact-store-v3";

export const MOVIE_GENRES = [
  "Acao",
  "Aventura",
  "Animacao",
  "Comedia",
  "Drama",
  "Ficcao Cientifica",
  "Romance",
  "Suspense",
  "Terror",
];

export const CLASSIFICATION_OPTIONS = ["Livre", "10", "12", "14", "16", "18"] as const;

export const ROOM_TYPES = ["2D", "3D", "IMAX", "VIP"] as const;

export const ROOM_STATUS_OPTIONS = ["Ativa", "Inativa", "Manutencao"] as const;

export const SESSION_LANGUAGES = ["Dublado", "Legendado"] as const;

export const TICKET_TYPES = ["Inteira", "Meia", "Promocional"] as const;

export const PAYMENT_METHODS = ["Cartao de Credito", "PIX", "Debito"] as const;

export const PRODUCT_TYPES = ["Pipoca", "Refrigerante", "Agua", "Combo", "Doce"] as const;

export const ORDER_STATUS_FLOW = ["Preparando", "Pronto", "Entregue"] as const;

export const USER_TYPES = ["cliente", "funcionario", "administrador"] as const;

export const SHIFT_OPTIONS = ["Manha", "Tarde", "Noite", "Integral"];

export const DEFAULT_MOVIES: Movie[] = [
  {
    id: "FILM-001",
    name: "Devoradores de Estrelas",
    genre: "Ficcao Cientifica",
    classification: "14",
    durationMinutes: 132,
    synopsis:
      "Uma tripulacao precisa atravessar o vazio cosmico para impedir que uma tempestade de materia escura apague as ultimas colonias humanas.",
    director: "Nora Valen",
    cast: "Maya Torres, Kenji Sato, Lina Sorel",
    premiereDate: "2026-04-04",
    status: "Em Cartaz",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "FILM-002",
    name: "Homem Aranha 3",
    genre: "Acao",
    classification: "16",
    durationMinutes: 118,
    synopsis:
      "Uma negociadora da policia enfrenta uma rede de sabotagem enquanto a cidade inteira entra em colapso durante uma madrugada sem energia.",
    director: "Leo Furtado",
    cast: "Bianca Marins, Davi Cruz, Hugo Leme",
    premiereDate: "2026-03-21",
    status: "Em Cartaz",
    image: spiderman3,
  },
  {
    id: "FILM-003",
    name: "Ultima Fronteira",
    genre: "Aventura",
    classification: "12",
    durationMinutes: 124,
    synopsis:
      "Dois irmaos encaram uma expedicao perigosa pelos Andes para recuperar um artefato perdido e salvar o legado da familia.",
    director: "Icaro Mendes",
    cast: "Taina Luz, Raul Nunes, Clara Prado",
    premiereDate: "2026-04-11",
    status: "Em Cartaz",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "FILM-004",
    name: "Cidade Fantasma",
    genre: "Suspense",
    classification: "18",
    durationMinutes: 109,
    synopsis:
      "Uma jornalista descobre mensagens escondidas em fitas antigas e vai parar em uma cidade onde todos parecem ter desaparecido na mesma noite.",
    director: "Helena Voss",
    cast: "Rafael Silveira, Giulia Dantas, Iris Melo",
    premiereDate: "2026-05-09",
    status: "Em Breve",
    image:
      "https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "FILM-005",
    name: "Jardins de Inverno",
    genre: "Drama",
    classification: "10",
    durationMinutes: 96,
    synopsis:
      "Uma pianista volta para sua cidade natal e redescobre lacos familiares enquanto tenta reconstruir a carreira.",
    director: "Sara Veloso",
    cast: "Elisa Prado, Tomas Vieira",
    premiereDate: "2025-12-18",
    status: "Encerrado",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  },
];

export function buildSeats(roomId: string, capacity: number): Seat[] {
  const seatsPerRow = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(capacity))));
  const rows = Math.ceil(capacity / seatsPerRow);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seats: Seat[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = alphabet[rowIndex];
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber += 1) {
      if (seats.length >= capacity) {
        break;
      }

      let type: Seat["type"] = "Comum";
      if (rowIndex === 0) {
        type = "Preferencial";
      }
      if (rowIndex >= rows - 1) {
        type = "VIP";
      }

      seats.push({
        id: `${roomId}-${row}${seatNumber}`,
        roomId,
        row,
        number: seatNumber,
        label: `${row}${seatNumber}`,
        type,
        status: "Disponivel",
      });
    }
  }

  return seats;
}

export const DEFAULT_ROOMS: Room[] = [
  {
    id: "ROOM-001",
    number: 1,
    type: "IMAX",
    status: "Ativa",
    capacity: 32,
    seats: buildSeats("ROOM-001", 32),
  },
  {
    id: "ROOM-002",
    number: 2,
    type: "3D",
    status: "Ativa",
    capacity: 28,
    seats: buildSeats("ROOM-002", 28).map((seat, index) =>
      index === 3 || index === 17
        ? {
            ...seat,
            status: "Manutencao",
          }
        : seat
    ),
  },
  {
    id: "ROOM-003",
    number: 3,
    type: "VIP",
    status: "Ativa",
    capacity: 24,
    seats: buildSeats("ROOM-003", 24),
  },
];

export const DEFAULT_SESSIONS: CinemaSession[] = [
  {
    id: "SESS-001",
    movieId: "FILM-001",
    roomId: "ROOM-001",
    date: "2026-04-18",
    time: "19:30",
    language: "Legendado",
    price: 39.9,
    occupiedSeatIds: ["ROOM-001-A1", "ROOM-001-B3", "ROOM-001-D4"],
  },
  {
    id: "SESS-002",
    movieId: "FILM-001",
    roomId: "ROOM-003",
    date: "2026-04-18",
    time: "21:40",
    language: "Dublado",
    price: 47.5,
    occupiedSeatIds: ["ROOM-003-A2"],
  },
  {
    id: "SESS-003",
    movieId: "FILM-002",
    roomId: "ROOM-002",
    date: "2026-04-18",
    time: "18:15",
    language: "Dublado",
    price: 31.5,
    occupiedSeatIds: ["ROOM-002-C5", "ROOM-002-B4"],
  },
  {
    id: "SESS-004",
    movieId: "FILM-003",
    roomId: "ROOM-001",
    date: "2026-04-19",
    time: "16:10",
    language: "Legendado",
    price: 34.9,
    occupiedSeatIds: [],
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "PROD-001", name: "Pipoca G", type: "Pipoca", price: 24.9, stock: 55 },
  { id: "PROD-002", name: "Refrigerante 700ml", type: "Refrigerante", price: 12.5, stock: 80 },
  { id: "PROD-003", name: "Agua Mineral", type: "Agua", price: 7.5, stock: 90 },
  { id: "PROD-004", name: "Combo Casal", type: "Combo", price: 39.9, stock: 22 },
  { id: "PROD-005", name: "Chocolate", type: "Doce", price: 9.9, stock: 60 },
];

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const digits = sanitizeDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatPhone(value: string): string {
  const digits = sanitizeDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").trim();
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").trim();
}

export function isValidName(value: string): boolean {
  return /^[A-Za-zÀ-ÿ\s]{4,}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = sanitizeDigits(value);
  return digits.length >= 10 && digits.length <= 11;
}

export function isStrongPassword(value: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

export function isValidDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function validateCpf(value: string): boolean {
  const cpf = sanitizeDigits(value);
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

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest.toString().padStart(2, "0")}min`;
}

export function getTicketMultiplier(type: TicketType): number {
  if (type === "Meia") {
    return 0.5;
  }
  if (type === "Promocional") {
    return 0.7;
  }
  return 1;
}

export function getSessionDateTime(session: CinemaSession): Date {
  return new Date(`${session.date}T${session.time}:00`);
}

export function hasSessionStarted(session: CinemaSession): boolean {
  return getSessionDateTime(session).getTime() <= Date.now();
}

export function hasSessionConflict(
  session: Omit<CinemaSession, "id" | "occupiedSeatIds">,
  existingSessions: CinemaSession[],
  movies: Movie[],
  currentSessionId?: string
): boolean {
  const candidateMovie = movies.find((movie) => movie.id === session.movieId);
  if (!candidateMovie) {
    return false;
  }

  const start = new Date(`${session.date}T${session.time}:00`).getTime();
  const end = start + (candidateMovie.durationMinutes + 30) * 60 * 1000;

  return existingSessions.some((existingSession) => {
    if (existingSession.id === currentSessionId) {
      return false;
    }
    if (existingSession.roomId !== session.roomId || existingSession.date !== session.date) {
      return false;
    }

    const movie = movies.find((item) => item.id === existingSession.movieId);
    if (!movie) {
      return false;
    }

    const existingStart = new Date(`${existingSession.date}T${existingSession.time}:00`).getTime();
    const existingEnd = existingStart + (movie.durationMinutes + 30) * 60 * 1000;

    return start < existingEnd && end > existingStart;
  });
}

export function getSeatVisualStatus(
  seat: Seat,
  session: CinemaSession,
  reservedSeatIds: string[]
): SeatStatus {
  if (seat.status === "Manutencao") {
    return "Manutencao";
  }
  if (session.occupiedSeatIds.includes(seat.id)) {
    return "Ocupado";
  }
  if (reservedSeatIds.includes(seat.id)) {
    return "Ocupado";
  }
  return "Disponivel";
}

export function buildQrSvgDataUri(value: string): string {
  const gridSize = 21;
  const cells: string[] = [];
  let seed = 0;
  for (const character of value) {
    seed = (seed * 31 + character.charCodeAt(0)) % 2147483647;
  }

  const getBit = (index: number) => {
    seed = (seed * 48271 + index) % 2147483647;
    return seed % 2;
  };

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const isFrame =
        (x < 7 && y < 7) ||
        (x > gridSize - 8 && y < 7) ||
        (x < 7 && y > gridSize - 8);

      const shouldFill = isFrame
        ? x === 0 ||
          y === 0 ||
          x === 6 ||
          y === 6 ||
          ((x >= 2 && x <= 4) && (y >= 2 && y <= 4))
        : getBit(x * gridSize + y) === 1;

      if (shouldFill) {
        cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#0a0a0a" />`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" shape-rendering="crispEdges"><rect width="${gridSize}" height="${gridSize}" fill="#ffffff" />${cells.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function summarizeTicketSales(bookings: Booking[]) {
  return bookings
    .filter((booking) => booking.status === "Pago")
    .reduce<Record<string, number>>((accumulator, booking) => {
      accumulator[booking.movieId] = (accumulator[booking.movieId] ?? 0) + booking.tickets.length;
      return accumulator;
    }, {});
}

export function summarizeRevenueByDay(bookings: Booking[], snackOrders: SnackOrder[]) {
  const result: Record<string, number> = {};

  bookings
    .filter((booking) => booking.status === "Pago")
    .forEach((booking) => {
      const day = booking.createdAt.slice(0, 10);
      result[day] = (result[day] ?? 0) + booking.total;
    });

  snackOrders.forEach((order) => {
    const day = order.createdAt.slice(0, 10);
    result[day] = (result[day] ?? 0) + order.total;
  });

  return result;
}

export function summarizeRevenueByMovie(bookings: Booking[]) {
  return bookings
    .filter((booking) => booking.status === "Pago")
    .reduce<Record<string, number>>((accumulator, booking) => {
      accumulator[booking.movieId] = (accumulator[booking.movieId] ?? 0) + booking.total;
      return accumulator;
    }, {});
}

export function summarizeProductRevenue(orders: SnackOrder[]) {
  return orders.reduce<Record<string, number>>((accumulator, order) => {
    order.items.forEach((item) => {
      accumulator[item.productId] = (accumulator[item.productId] ?? 0) + item.unitPrice * item.quantity;
    });
    return accumulator;
  }, {});
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function buildSeedUsers(): Promise<User[]> {
  const [adminHash, employeeHash, clientHash] = await Promise.all([
    hashPassword("Admin@123"),
    hashPassword("Func@123"),
    hashPassword("Cliente@123"),
  ]);

  return [
    {
      id: "ADM-0001",
      type: "administrador",
      name: "Alice Mendes",
      email: "admin@cinereact.com",
      phone: "",
      cpf: "",
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: "FUN-0001",
      type: "funcionario",
      name: "Bruno Costa",
      email: "bomboniere@cinereact.com",
      phone: "45999998888",
      cpf: "52998224725",
      passwordHash: employeeHash,
      roleTitle: "Bomboniere",
      shift: "Noite",
      createdAt: new Date().toISOString(),
    },
    {
      id: "CLI-0001",
      type: "cliente",
      name: "Carla Nogueira",
      email: "cliente@cinereact.com",
      phone: "45991234567",
      cpf: "11144477735",
      passwordHash: clientHash,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function buildDefaultStore(users: User[]) {
  return {
    users,
    movies: DEFAULT_MOVIES,
    rooms: DEFAULT_ROOMS,
    sessions: DEFAULT_SESSIONS,
    products: DEFAULT_PRODUCTS,
    bookings: [] as Booking[],
    snackOrders: [] as SnackOrder[],
    currentUserId: null,
  };
}

export function getUserPrefix(type: UserType) {
  if (type === "cliente") {
    return "CLI";
  }
  if (type === "funcionario") {
    return "FUN";
  }
  return "ADM";
}

export function getMoviePurchaseAvailability(movie: Movie) {
  return movie.status === "Em Cartaz";
}

export function getSessionSummary(session: CinemaSession, rooms: Room[], movies: Movie[]) {
  const room = rooms.find((item) => item.id === session.roomId);
  const movie = movies.find((item) => item.id === session.movieId);

  return {
    roomLabel: room ? `Sala ${room.number} · ${room.type}` : "Sala nao encontrada",
    movieName: movie?.name ?? "Filme nao encontrado",
  };
}

export function buildFinanceRows(
  bookings: Booking[],
  snackOrders: SnackOrder[],
  movies: Movie[],
  products: Product[]
) {
  const ticketRows = bookings
    .filter((booking) => booking.status === "Pago")
    .map((booking) => {
      const movie = movies.find((item) => item.id === booking.movieId);
      return [
        "Ingresso",
        booking.createdAt.slice(0, 10),
        movie?.name ?? booking.movieId,
        booking.paymentMethod,
        booking.total.toFixed(2),
      ];
    });

  const snackRows = snackOrders.map((order) => [
    "Bomboniere",
    order.createdAt.slice(0, 10),
    order.items
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return `${product?.name ?? item.productId} x${item.quantity}`;
      })
      .join(" | "),
    order.paymentMethod,
    order.total.toFixed(2),
  ]);

  return [["Categoria", "Data", "Descricao", "Pagamento", "Valor"], ...ticketRows, ...snackRows];
}

export function getOrderNextStatus(current: SnackOrder["status"]): SnackOrder["status"] {
  if (current === "Preparando") {
    return "Pronto";
  }
  if (current === "Pronto") {
    return "Entregue";
  }
  return "Entregue";
}

export function getPeriodLabel(value: "diario" | "semanal" | "mensal" | "anual") {
  if (value === "diario") {
    return "Diario";
  }
  if (value === "semanal") {
    return "Semanal";
  }
  if (value === "mensal") {
    return "Mensal";
  }
  return "Anual";
}

export function filterByPeriod(dateIso: string, period: "diario" | "semanal" | "mensal" | "anual") {
  const target = new Date(dateIso);
  const now = new Date();

  if (period === "diario") {
    return target.toDateString() === now.toDateString();
  }

  if (period === "semanal") {
    const diff = Math.abs(now.getTime() - target.getTime());
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }

  if (period === "mensal") {
    return target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear();
  }

  return target.getFullYear() === now.getFullYear();
}

export function canRemoveMovie(movieId: string, sessions: CinemaSession[]) {
  return !sessions.some((session) => session.movieId === movieId);
}

export function canRemoveSession(sessionId: string, bookings: Booking[]) {
  return !bookings.some((booking) => booking.sessionId === sessionId && booking.status === "Pago");
}

export function getAvailableSessionsForClient(sessions: CinemaSession[], movies: Movie[], rooms: Room[]) {
  return sessions.filter((session) => {
    const movie = movies.find((item) => item.id === session.movieId);
    const room = rooms.find((item) => item.id === session.roomId);
    return movie?.status === "Em Cartaz" && room?.status === "Ativa";
  });
}

export function getMovieVisibleStatus(movie: Movie) {
  if (movie.status === "Em Breve") {
    return "Em breve";
  }
  if (movie.status === "Encerrado") {
    return "Encerrado";
  }
  return "Em cartaz";
}

export function getPaymentBadge(status: Booking["status"]) {
  if (status === "Pago") {
    return "Pago";
  }
  if (status === "Cancelado") {
    return "Cancelado";
  }
  return "Pendente";
}

export function buildTicketPrice(basePrice: number, ticketType: TicketType) {
  return Number((basePrice * getTicketMultiplier(ticketType)).toFixed(2));
}

export function isEmailDuplicate(users: User[], email: string, type: UserType, currentUserId?: string) {
  return users.some((user) => {
    if (user.id === currentUserId) {
      return false;
    }
    if (type === "cliente") {
      return user.type === "cliente" && user.email.toLowerCase() === email.toLowerCase();
    }
    return user.email.toLowerCase() === email.toLowerCase();
  });
}

export function isCpfDuplicate(users: User[], cpf: string, currentUserId?: string) {
  const cleanCpf = sanitizeDigits(cpf);
  return users.some((user) => user.id !== currentUserId && sanitizeDigits(user.cpf) === cleanCpf);
}

export function maskSecret(secret: string) {
  return secret ? "********" : "";
}

export function getGreetingByRole(user?: User | null) {
  if (!user) {
    return "Acesse sua conta";
  }
  if (user.type === "administrador") {
    return `Painel administrador · ${user.name}`;
  }
  if (user.type === "funcionario") {
    return `Operacao · ${user.name}`;
  }
  return `Minha sessao · ${user.name}`;
}

export function getRoomAvailabilitySummary(room: Room) {
  const maintenance = room.seats.filter((seat) => seat.status === "Manutencao").length;
  return `${room.capacity - maintenance}/${room.capacity} assentos utilizaveis`;
}

export function getSessionOccupancy(session: CinemaSession, room: Room | undefined) {
  if (!room) {
    return 0;
  }
  return Math.round((session.occupiedSeatIds.length / room.capacity) * 100);
}

export function formatUserType(value: UserType) {
  if (value === "cliente") {
    return "Cliente";
  }
  if (value === "funcionario") {
    return "Funcionario";
  }
  return "Administrador";
}

export function formatPaymentMethod(value: PaymentMethod) {
  return value;
}
