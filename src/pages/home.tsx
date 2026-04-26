import { useEffect, useState } from "react";
import Header from "../components/header";
import Menu from "../components/menu";
import HeroBanner from "../components/HeroBanner";
import MoviesSection from "./MoviesSection";
import {
  buildDefaultStore,
  buildFinanceRows,
  buildQrSvgDataUri,
  buildSeedUsers,
  buildTicketPrice,
  canRemoveMovie,
  canRemoveSession,
  CLASSIFICATION_OPTIONS,
  createId,
  DEFAULT_MOVIES,
  downloadCsv,
  filterByPeriod,
  formatCpf,
  formatCurrency,
  formatDuration,
  formatPaymentMethod,
  formatPhone,
  formatUserType,
  getAvailableSessionsForClient,
  getGreetingByRole,
  getMoviePurchaseAvailability,
  getOrderNextStatus,
  getPaymentBadge,
  getPeriodLabel,
  getRoomAvailabilitySummary,
  getSeatVisualStatus,
  getSessionOccupancy,
  getSessionSummary,
  getTicketMultiplier,
  getUserPrefix,
  hashPassword,
  hasSessionConflict,
  hasSessionStarted,
  isCpfDuplicate,
  isEmailDuplicate,
  isStrongPassword,
  isValidDate,
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidTime,
  MOVIE_GENRES,
  PAYMENT_METHODS,
  PRODUCT_TYPES,
  ROOM_STATUS_OPTIONS,
  ROOM_TYPES,
  sanitizeDigits,
  SESSION_LANGUAGES,
  STORAGE_KEY,
  summarizeRevenueByDay,
  summarizeRevenueByMovie,
  summarizeTicketSales,
  TICKET_TYPES,
  validateCpf,
} from "../lib/cinema";
import type {
  Booking,
  CinemaSession,
  CinemaStore,
  Movie,
  PaymentMethod,
  Product,
  Room,
  SeatStatus,
  SnackOrder,
  TicketType,
  User,
} from "../types";
import "./home.css";

type Screen =
  | "home"
  | "movie"
  | "auth"
  | "session"
  | "snack"
  | "backoffice"
  | "checkout"
  | "success";
type AuthMode = "login" | "register";
type AlertTone = "success" | "error" | "info";
type Period = "diario" | "semanal" | "mensal" | "anual";

interface AlertState {
  tone: AlertTone;
  text: string;
}

interface LoginFormState {
  email: string;
  password: string;
}

interface RegisterFormState {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  confirmPassword: string;
}

interface MovieFormState {
  id: string | null;
  name: string;
  genre: string;
  classification: Movie["classification"];
  durationMinutes: string;
  synopsis: string;
  director: string;
  cast: string;
  premiereDate: string;
  status: Movie["status"];
  image: string;
  featured: boolean;
}

interface RoomFormState {
  id: string | null;
  number: string;
  type: Room["type"];
  status: Room["status"];
  capacity: string;
}

interface SessionFormState {
  id: string | null;
  movieId: string;
  roomId: string;
  date: string;
  time: string;
  language: CinemaSession["language"];
  price: string;
}

interface ProductFormState {
  id: string | null;
  name: string;
  type: Product["type"];
  price: string;
  stock: string;
}

const defaultLoginForm: LoginFormState = {
  email: "",
  password: "",
};

const defaultRegisterForm: RegisterFormState = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  password: "",
  confirmPassword: "",
};

const defaultMovieForm: MovieFormState = {
  id: null,
  name: "",
  genre: MOVIE_GENRES[0],
  classification: "12",
  durationMinutes: "",
  synopsis: "",
  director: "",
  cast: "",
  premiereDate: "",
  status: "Em Cartaz",
  image: "",
  featured: false,
};

const defaultRoomForm: RoomFormState = {
  id: null,
  number: "",
  type: "2D",
  status: "Ativa",
  capacity: "",
};

const defaultSessionForm: SessionFormState = {
  id: null,
  movieId: DEFAULT_MOVIES[0]?.id ?? "",
  roomId: "",
  date: "",
  time: "",
  language: "Dublado",
  price: "",
};

const defaultProductForm: ProductFormState = {
  id: null,
  name: "",
  type: "Pipoca",
  price: "",
  stock: "",
};

function Home() {
  const [store, setStore] = useState<CinemaStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [searchValue, setSearchValue] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketTypesBySeat, setTicketTypesBySeat] = useState<Record<string, TicketType>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [snackQuantities, setSnackQuantities] = useState<Record<string, number>>({});
  const [loginForm, setLoginForm] = useState<LoginFormState>(defaultLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(defaultRegisterForm);
  const [movieForm, setMovieForm] = useState<MovieFormState>(defaultMovieForm);
  const [roomForm, setRoomForm] = useState<RoomFormState>(defaultRoomForm);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(defaultSessionForm);
  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [pendingMovieId, setPendingMovieId] = useState<string | null>(null);
  const [highlightBookingId, setHighlightBookingId] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<Period>("mensal");

  useEffect(() => {
    let active = true;

    async function loadStore() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CinemaStore;
        if (!active) {
          return;
        }
        setStore(parsed);
        setSelectedMovieId(parsed.movies.find((movie) => movie.featured)?.id ?? parsed.movies[0]?.id ?? "");
        setSelectedSessionId(parsed.sessions[0]?.id ?? "");
        setSessionForm((current) => ({
          ...current,
          movieId: parsed.movies.find((movie) => movie.status === "Em Cartaz")?.id ?? parsed.movies[0]?.id ?? "",
          roomId: parsed.rooms.find((room) => room.status === "Ativa")?.id ?? "",
        }));
        setIsLoading(false);
        return;
      }

      const users = await buildSeedUsers();
      if (!active) {
        return;
      }
      const seededStore = buildDefaultStore(users);
      setStore(seededStore);
      setSelectedMovieId(seededStore.movies.find((movie) => movie.featured)?.id ?? seededStore.movies[0]?.id ?? "");
      setSelectedSessionId(seededStore.sessions[0]?.id ?? "");
      setSessionForm((current) => ({
        ...current,
        movieId: seededStore.movies.find((movie) => movie.status === "Em Cartaz")?.id ?? seededStore.movies[0]?.id ?? "",
        roomId: seededStore.rooms.find((room) => room.status === "Ativa")?.id ?? "",
      }));
      setIsLoading(false);
    }

    loadStore();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!store) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (!alert) {
      return;
    }
    const timeout = window.setTimeout(() => setAlert(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  if (isLoading || !store) {
    return (
      <div className="home home--loading">
        <div className="loading-card">
          <strong>Preparando ambiente do cinema...</strong>
          <span>Carregando usuarios, filmes, salas, sessoes e operacoes.</span>
        </div>
      </div>
    );
  }

  const cinemaStore = store;
  const currentUser = cinemaStore.users.find((user) => user.id === cinemaStore.currentUserId) ?? null;
  const isAdminVisible = currentUser?.type === "administrador";
  const activeMenuKey =
    screen === "checkout" || screen === "success"
      ? "session"
      : screen;
  const visibleMovies = cinemaStore.movies.filter((movie) => {
    if (!searchValue.trim()) {
      return movie.status !== "Encerrado" || currentUser?.type === "administrador";
    }

    const haystack = [movie.name, movie.genre, movie.director, movie.cast, movie.synopsis]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchValue.toLowerCase());
  });

  const featuredMovie =
    cinemaStore.movies.find((movie) => movie.id === selectedMovieId) ??
    visibleMovies[0] ??
    cinemaStore.movies.find((movie) => movie.featured) ??
    cinemaStore.movies[0];

  const clientSessions = getAvailableSessionsForClient(
    cinemaStore.sessions,
    cinemaStore.movies,
    cinemaStore.rooms
  );
  const featuredSessions = clientSessions.filter((session) => session.movieId === featuredMovie?.id);
  const selectedSession =
    cinemaStore.sessions.find((session) => session.id === selectedSessionId) ??
    featuredSessions[0] ??
    clientSessions[0] ??
    null;
  const selectedRoom = cinemaStore.rooms.find((room) => room.id === selectedSession?.roomId) ?? null;
  const selectedMovie =
    cinemaStore.movies.find((movie) => movie.id === (selectedSession?.movieId ?? selectedMovieId)) ??
    featuredMovie;
  const checkoutTotal = selectedSeatIds.reduce((accumulator, seatId) => {
    if (!selectedSession) {
      return accumulator;
    }
    const ticketType = ticketTypesBySeat[seatId] ?? "Inteira";
    return accumulator + buildTicketPrice(selectedSession.price, ticketType);
  }, 0);
  const userBookings = currentUser
    ? cinemaStore.bookings.filter((booking) => booking.userId === currentUser.id)
    : [];
  const userSnackOrders = currentUser
    ? cinemaStore.snackOrders.filter((order) => order.clientId === currentUser.id)
    : [];
  const readyNotifications = userSnackOrders.filter((order) => order.status === "Pronto");
  const salesByMovie = summarizeTicketSales(cinemaStore.bookings);
  const revenueByDay = summarizeRevenueByDay(cinemaStore.bookings, cinemaStore.snackOrders);
  const revenueByMovie = summarizeRevenueByMovie(cinemaStore.bookings);
  const periodTicketRevenue = cinemaStore.bookings
    .filter((booking) => booking.status === "Pago" && filterByPeriod(booking.createdAt, reportPeriod))
    .reduce((total, booking) => total + booking.total, 0);
  const periodSnackRevenue = cinemaStore.snackOrders
    .filter((order) => filterByPeriod(order.createdAt, reportPeriod))
    .reduce((total, order) => total + order.total, 0);

  function updateStore(updater: (current: CinemaStore) => CinemaStore) {
    setStore((current) => {
      if (!current) {
        return current;
      }
      return updater(current);
    });
  }

  function showAlert(tone: AlertTone, text: string) {
    setAlert({ tone, text });
  }

  function resetCheckout() {
    setSelectedSeatIds([]);
    setTicketTypesBySeat({});
    setPaymentMethod("PIX");
  }

  function openMovie(movieId: string) {
    const movie = cinemaStore.movies.find((item) => item.id === movieId);
    if (!movie) {
      return;
    }
    setSelectedMovieId(movieId);
    const nextSession = clientSessions.find((session) => session.movieId === movieId);
    if (nextSession) {
      setSelectedSessionId(nextSession.id);
    }
    setScreen("movie");
  }

  function navigate(target: string) {
    if (target === "backoffice" && !isAdminVisible) {
      setScreen("auth");
      showAlert("info", "Entre com sua conta. Se ela for administrativa, o acesso sera liberado.");
      return;
    }
    if (target === "movie") {
      setScreen(selectedMovie ? "movie" : "home");
      return;
    }
    if (target === "session" && !currentUser) {
      setAuthMode("login");
      setScreen("auth");
      showAlert("info", "Entre para visualizar suas compras, notificacoes e historico.");
      return;
    }
    setScreen(target as Screen);
  }

  function beginCheckout(movieId: string) {
    const movie = cinemaStore.movies.find((item) => item.id === movieId);
    if (!movie || !getMoviePurchaseAvailability(movie)) {
      showAlert("error", "Esse filme nao esta disponivel para compra agora.");
      return;
    }

    const availableSession = clientSessions.find((session) => session.movieId === movieId);
    if (!availableSession) {
      showAlert("error", "Nao ha sessoes disponiveis para este filme.");
      return;
    }

    setSelectedMovieId(movieId);
    setSelectedSessionId(availableSession.id);
    resetCheckout();

    if (!currentUser || currentUser.type !== "cliente") {
      setPendingMovieId(movieId);
      setAuthMode("login");
      setScreen("auth");
      showAlert("info", "Para comprar ingressos, entre com um perfil de cliente.");
      return;
    }

    setScreen("checkout");
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const passwordHash = await hashPassword(loginForm.password);
    const user = cinemaStore.users.find(
      (candidate) =>
        candidate.email.toLowerCase() === email &&
        candidate.passwordHash === passwordHash
    );

    if (!user) {
      showAlert("error", "Credenciais invalidas. Revise e-mail e senha.");
      return;
    }

    updateStore((current) => ({
      ...current,
      currentUserId: user.id,
    }));
    setLoginForm(defaultLoginForm);
    showAlert("success", `Acesso liberado para ${user.name}.`);

    if (pendingMovieId && user.type === "cliente") {
      setPendingMovieId(null);
      beginCheckout(pendingMovieId);
      return;
    }

    if (user.type === "cliente") {
      setScreen("session");
    } else {
      setScreen("backoffice");
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidName(registerForm.name)) {
      showAlert("error", "Nome invalido. Use apenas letras e no minimo 4 caracteres.");
      return;
    }

    if (!isValidEmail(registerForm.email)) {
      showAlert("error", "Informe um e-mail valido.");
      return;
    }

    if (isEmailDuplicate(cinemaStore.users, registerForm.email, "cliente")) {
      showAlert("error", "Ja existe um usuario com esse e-mail dentro da regra permitida.");
      return;
    }

    if (!isValidPhone(registerForm.phone)) {
      showAlert("error", "Telefone invalido. Use 10 ou 11 digitos com DDD.");
      return;
    }

    if (!validateCpf(registerForm.cpf)) {
      showAlert("error", "CPF invalido. Revise os digitos informados.");
      return;
    }

    if (isCpfDuplicate(cinemaStore.users, registerForm.cpf)) {
      showAlert("error", "CPF ja cadastrado no sistema.");
      return;
    }

    if (!isStrongPassword(registerForm.password)) {
      showAlert("error", "Senha fraca. Use no minimo 8 caracteres com letra, numero e simbolo.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showAlert("error", "A confirmacao da senha nao confere.");
      return;
    }

    const passwordHash = await hashPassword(registerForm.password);
    const typePrefix = getUserPrefix("cliente");
    const userId = createId(typePrefix);
    const newUser: User = {
      id: userId,
      type: "cliente",
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      phone: sanitizeDigits(registerForm.phone),
      cpf: sanitizeDigits(registerForm.cpf),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    updateStore((current) => ({
      ...current,
      users: [...current.users, newUser],
      currentUserId: newUser.id,
    }));

    setRegisterForm(defaultRegisterForm);
    showAlert("success", `${formatUserType(newUser.type)} cadastrado com sucesso.`);

    if (pendingMovieId && newUser.type === "cliente") {
      setPendingMovieId(null);
      beginCheckout(pendingMovieId);
      return;
    }

    setScreen("session");
  }

  function logout() {
    updateStore((current) => ({
      ...current,
      currentUserId: null,
    }));
    setScreen("home");
    setPendingMovieId(null);
    resetCheckout();
    showAlert("info", "Sessao encerrada.");
  }

  function selectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    resetCheckout();
  }

  function toggleSeat(seatId: string) {
    if (!selectedSession || !selectedRoom) {
      return;
    }
    const seat = selectedRoom.seats.find((item) => item.id === seatId);
    if (!seat) {
      return;
    }
    const visualStatus = getSeatVisualStatus(seat, selectedSession, selectedSeatIds);
    if (visualStatus !== "Disponivel" && !selectedSeatIds.includes(seatId)) {
      return;
    }

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds((current) => current.filter((currentSeatId) => currentSeatId !== seatId));
      setTicketTypesBySeat((current) => {
        const next = { ...current };
        delete next[seatId];
        return next;
      });
      return;
    }

    setSelectedSeatIds((current) => [...current, seatId]);
    setTicketTypesBySeat((current) => ({
      ...current,
      [seatId]: current[seatId] ?? "Inteira",
    }));
  }

  function updateTicketType(seatId: string, ticketType: TicketType) {
    setTicketTypesBySeat((current) => ({
      ...current,
      [seatId]: ticketType,
    }));
  }

  function confirmPurchase() {
    if (!currentUser || currentUser.type !== "cliente") {
      showAlert("error", "Somente clientes podem concluir compras.");
      return;
    }

    if (!selectedSession || !selectedRoom || !selectedMovie) {
      showAlert("error", "Selecione um filme e uma sessao valida.");
      return;
    }

    if (selectedSeatIds.length === 0) {
      showAlert("error", "Escolha ao menos um assento.");
      return;
    }

    const invalidSeat = selectedSeatIds.some((seatId) => {
      const seat = selectedRoom.seats.find((item) => item.id === seatId);
      return !seat || getSeatVisualStatus(seat, selectedSession, []) !== "Disponivel";
    });

    if (invalidSeat) {
      showAlert("error", "Um ou mais assentos nao estao mais disponiveis.");
      return;
    }

    const tickets = selectedSeatIds.map((seatId) => {
      const seat = selectedRoom.seats.find((item) => item.id === seatId);
      const ticketType = ticketTypesBySeat[seatId] ?? "Inteira";
      const qrPayload = `${selectedSession.id}-${seatId}-${currentUser.id}-${Date.now()}`;
      return {
        id: createId("TKT"),
        seatId,
        seatLabel: seat?.label ?? seatId,
        ticketType,
        unitPrice: buildTicketPrice(selectedSession.price, ticketType),
        qrCode: buildQrSvgDataUri(qrPayload),
      };
    });

    const bookingId = createId("BOOK");
    const booking: Booking = {
      id: bookingId,
      userId: currentUser.id,
      movieId: selectedMovie.id,
      sessionId: selectedSession.id,
      createdAt: new Date().toISOString(),
      paymentMethod,
      status: "Pendente",
      total: tickets.reduce((total, ticket) => total + ticket.unitPrice, 0),
      tickets,
    };

    updateStore((current) => ({
      ...current,
      bookings: [...current.bookings, booking],
    }));

    setHighlightBookingId(bookingId);
    setScreen("success");
    showAlert("info", "Pagamento em processamento. Confirmando gateway...");

    window.setTimeout(() => {
      updateStore((current) => ({
        ...current,
        bookings: current.bookings.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                status: "Pago",
              }
            : item
        ),
        sessions: current.sessions.map((session) =>
          session.id === selectedSession.id
            ? {
                ...session,
                occupiedSeatIds: [...new Set([...session.occupiedSeatIds, ...selectedSeatIds])],
              }
            : session
        ),
      }));
      showAlert("success", "Pagamento aprovado. Ingressos emitidos com QR Code.");
      resetCheckout();
    }, 900);
  }

  function updateSnackQuantity(productId: string, quantity: number) {
    setSnackQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, quantity),
    }));
  }

  function placeSnackOrder() {
    if (!currentUser || currentUser.type !== "cliente") {
      setAuthMode("login");
      setScreen("auth");
      showAlert("info", "Entre com um cliente para pedir itens da bomboniere.");
      return;
    }

    const items = Object.entries(snackQuantities)
      .map(([productId, quantity]) => {
        const product = cinemaStore.products.find((candidate) => candidate.id === productId);
        if (!product || quantity <= 0) {
          return null;
        }
        return {
          productId,
          quantity,
          unitPrice: product.price,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (items.length === 0) {
      showAlert("error", "Escolha ao menos um produto da bomboniere.");
      return;
    }

    const insufficient = items.find((item) => {
      const product = cinemaStore.products.find((candidate) => candidate.id === item.productId);
      return !product || product.stock < item.quantity;
    });

    if (insufficient) {
      showAlert("error", "Um dos itens nao possui estoque suficiente.");
      return;
    }

    const order: SnackOrder = {
      id: createId("PED"),
      clientId: currentUser.id,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod,
      items,
      total: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
      status: "Preparando",
    };

    updateStore((current) => ({
      ...current,
      snackOrders: [...current.snackOrders, order],
      products: current.products.map((product) => {
        const orderedItem = items.find((item) => item.productId === product.id);
        if (!orderedItem) {
          return product;
        }
        return {
          ...product,
          stock: product.stock - orderedItem.quantity,
        };
      }),
    }));

    setSnackQuantities({});
    showAlert("success", "Pedido enviado para a bomboniere.");
    setScreen("session");
  }

  function advanceOrderStatus(orderId: string) {
    updateStore((current) => ({
      ...current,
      snackOrders: current.snackOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: getOrderNextStatus(order.status),
            }
          : order
      ),
    }));
    showAlert("success", "Status do pedido atualizado.");
  }

  function saveMovie(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (movieForm.name.trim().length < 2) {
      showAlert("error", "Nome do filme invalido.");
      return;
    }
    if (!movieForm.synopsis.trim() || !movieForm.director.trim() || !movieForm.cast.trim()) {
      showAlert("error", "Preencha sinopse, diretor e elenco.");
      return;
    }
    if (!Number(movieForm.durationMinutes) || Number(movieForm.durationMinutes) <= 0) {
      showAlert("error", "Duracao invalida.");
      return;
    }
    if (!isValidDate(movieForm.premiereDate)) {
      showAlert("error", "Data de estreia invalida.");
      return;
    }
    if (movieForm.status === "Em Breve" && !movieForm.premiereDate) {
      showAlert("error", "Filmes em breve precisam de data de estreia.");
      return;
    }

    const nextMovie: Movie = {
      id: movieForm.id ?? createId("FILM"),
      name: movieForm.name.trim(),
      genre: movieForm.genre,
      classification: movieForm.classification,
      durationMinutes: Number(movieForm.durationMinutes),
      synopsis: movieForm.synopsis.trim(),
      director: movieForm.director.trim(),
      cast: movieForm.cast.trim(),
      premiereDate: movieForm.premiereDate,
      status: movieForm.status,
      image:
        movieForm.image.trim() ||
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      featured: movieForm.featured,
    };

    updateStore((current) => ({
      ...current,
      movies: movieForm.id
        ? current.movies.map((movie) =>
            movie.id === movieForm.id
              ? nextMovie
              : movieForm.featured
                ? { ...movie, featured: false }
                : movie
          )
        : [
            ...current.movies.map((movie) => (movieForm.featured ? { ...movie, featured: false } : movie)),
            nextMovie,
          ],
    }));

    setMovieForm(defaultMovieForm);
    showAlert("success", `Filme ${movieForm.id ? "atualizado" : "cadastrado"} com sucesso.`);
  }

  function editMovie(movie: Movie) {
    setMovieForm({
      id: movie.id,
      name: movie.name,
      genre: movie.genre,
      classification: movie.classification,
      durationMinutes: String(movie.durationMinutes),
      synopsis: movie.synopsis,
      director: movie.director,
      cast: movie.cast,
      premiereDate: movie.premiereDate,
      status: movie.status,
      image: movie.image,
      featured: Boolean(movie.featured),
    });
    setScreen("backoffice");
  }

  function removeMovie(movieId: string) {
    if (!canRemoveMovie(movieId, cinemaStore.sessions)) {
      showAlert("error", "Filmes com sessoes cadastradas nao podem ser removidos.");
      return;
    }
    updateStore((current) => ({
      ...current,
      movies: current.movies.filter((movie) => movie.id !== movieId),
    }));
    showAlert("success", "Filme removido.");
  }

  function saveRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = Number(roomForm.number);
    const capacity = Number(roomForm.capacity);

    if (!number || number <= 0 || !capacity || capacity <= 0) {
      showAlert("error", "Numero da sala e capacidade devem ser maiores que zero.");
      return;
    }

    const duplicateRoom = cinemaStore.rooms.find(
      (room) => room.number === number && room.id !== roomForm.id
    );
    if (duplicateRoom) {
      showAlert("error", "Ja existe uma sala com esse numero.");
      return;
    }

    const roomId = roomForm.id ?? createId("ROOM");
    const seats = Array.from({ length: capacity }, (_, index) => index);
    const nextRoom: Room = {
      id: roomId,
      number,
      type: roomForm.type,
      status: roomForm.status,
      capacity,
      seats: seats.map((_, index) => {
        const row = String.fromCharCode(65 + Math.floor(index / 8));
        const numberInRow = (index % 8) + 1;
        const previousSeat = cinemaStore.rooms
          .find((room) => room.id === roomId)
          ?.seats.find((seat) => seat.label === `${row}${numberInRow}`);
        return {
          id: `${roomId}-${row}${numberInRow}`,
          roomId,
          row,
          number: numberInRow,
          label: `${row}${numberInRow}`,
          type:
            row === "A" ? "Preferencial" : index >= capacity - Math.min(8, capacity) ? "VIP" : "Comum",
          status: previousSeat?.status ?? "Disponivel",
        };
      }),
    };

    updateStore((current) => ({
      ...current,
      rooms: roomForm.id
        ? current.rooms.map((room) => (room.id === roomForm.id ? nextRoom : room))
        : [...current.rooms, nextRoom],
      sessions: current.sessions.map((session) =>
        session.roomId !== roomId
          ? session
          : {
              ...session,
              occupiedSeatIds: session.occupiedSeatIds.filter((seatId) =>
                nextRoom.seats.some((seat) => seat.id === seatId)
              ),
            }
      ),
    }));

    setRoomForm(defaultRoomForm);
    showAlert("success", `Sala ${roomForm.id ? "atualizada" : "cadastrada"} com sucesso.`);
  }

  function editRoom(room: Room) {
    setRoomForm({
      id: room.id,
      number: String(room.number),
      type: room.type,
      status: room.status,
      capacity: String(room.capacity),
    });
  }

  function updateSeatStatus(roomId: string, seatId: string, status: SeatStatus) {
    updateStore((current) => ({
      ...current,
      rooms: current.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              seats: room.seats.map((seat) => (seat.id === seatId ? { ...seat, status } : seat)),
            }
      ),
    }));
    showAlert("success", "Status do assento atualizado.");
  }

  function saveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sessionForm.movieId || !sessionForm.roomId) {
      showAlert("error", "Selecione filme e sala.");
      return;
    }

    const movie = cinemaStore.movies.find((item) => item.id === sessionForm.movieId);
    const room = cinemaStore.rooms.find((item) => item.id === sessionForm.roomId);

    if (!movie || movie.status !== "Em Cartaz") {
      showAlert("error", "Somente filmes em cartaz podem receber sessoes.");
      return;
    }

    if (!room || room.status !== "Ativa") {
      showAlert("error", "Escolha uma sala ativa para a sessao.");
      return;
    }

    if (!isValidDate(sessionForm.date) || !isValidTime(sessionForm.time)) {
      showAlert("error", "Data ou horario invalidos.");
      return;
    }

    if (!Number(sessionForm.price) || Number(sessionForm.price) <= 0) {
      showAlert("error", "Preco do ingresso invalido.");
      return;
    }

    if (
      hasSessionConflict(
        {
          movieId: sessionForm.movieId,
          roomId: sessionForm.roomId,
          date: sessionForm.date,
          time: sessionForm.time,
          language: sessionForm.language,
          price: Number(sessionForm.price),
        },
        cinemaStore.sessions,
        cinemaStore.movies,
        sessionForm.id ?? undefined
      )
    ) {
      showAlert(
        "error",
        "Conflito de horario detectado. Considere a duracao do filme e 30 minutos de limpeza."
      );
      return;
    }

    const currentSession = cinemaStore.sessions.find((session) => session.id === sessionForm.id);
    if (currentSession && hasSessionStarted(currentSession)) {
      showAlert("error", "Sessoes ja iniciadas nao podem ser alteradas.");
      return;
    }

    const nextSession: CinemaSession = {
      id: sessionForm.id ?? createId("SESS"),
      movieId: sessionForm.movieId,
      roomId: sessionForm.roomId,
      date: sessionForm.date,
      time: sessionForm.time,
      language: sessionForm.language,
      price: Number(sessionForm.price),
      occupiedSeatIds: currentSession?.occupiedSeatIds ?? [],
    };

    updateStore((current) => ({
      ...current,
      sessions: sessionForm.id
        ? current.sessions.map((session) => (session.id === sessionForm.id ? nextSession : session))
        : [...current.sessions, nextSession],
    }));

    setSessionForm({
      ...defaultSessionForm,
      movieId: cinemaStore.movies.find((item) => item.status === "Em Cartaz")?.id ?? "",
      roomId: cinemaStore.rooms.find((item) => item.status === "Ativa")?.id ?? "",
    });
    showAlert("success", `Sessao ${sessionForm.id ? "atualizada" : "criada"} com sucesso.`);
  }

  function editSession(session: CinemaSession) {
    setSessionForm({
      id: session.id,
      movieId: session.movieId,
      roomId: session.roomId,
      date: session.date,
      time: session.time,
      language: session.language,
      price: String(session.price),
    });
  }

  function removeSession(session: CinemaSession) {
    if (hasSessionStarted(session)) {
      showAlert("error", "Sessoes ja iniciadas nao podem ser removidas.");
      return;
    }
    if (!canRemoveSession(session.id, cinemaStore.bookings)) {
      showAlert("error", "Sessao com ingressos vendidos nao pode ser removida sem cancelamento.");
      return;
    }
    updateStore((current) => ({
      ...current,
      sessions: current.sessions.filter((item) => item.id !== session.id),
    }));
    showAlert("success", "Sessao removida.");
  }

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productForm.name.trim()) {
      showAlert("error", "Nome do produto obrigatorio.");
      return;
    }
    if (!Number(productForm.price) || Number(productForm.price) <= 0) {
      showAlert("error", "Preco invalido.");
      return;
    }
    if (Number(productForm.stock) < 0) {
      showAlert("error", "Estoque nao pode ser negativo.");
      return;
    }

    const nextProduct: Product = {
      id: productForm.id ?? createId("PROD"),
      name: productForm.name.trim(),
      type: productForm.type,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };

    updateStore((current) => ({
      ...current,
      products: productForm.id
        ? current.products.map((product) => (product.id === productForm.id ? nextProduct : product))
        : [...current.products, nextProduct],
    }));
    setProductForm(defaultProductForm);
    showAlert("success", `Produto ${productForm.id ? "atualizado" : "cadastrado"} com sucesso.`);
  }

  function editProduct(product: Product) {
    setProductForm({
      id: product.id,
      name: product.name,
      type: product.type,
      price: String(product.price),
      stock: String(product.stock),
    });
  }

  function exportFinanceReport() {
    downloadCsv(
      "financeiro-cinereact.csv",
      buildFinanceRows(
        cinemaStore.bookings,
        cinemaStore.snackOrders,
        cinemaStore.movies,
        cinemaStore.products
      )
    );
    showAlert("success", "Relatorio financeiro exportado em CSV.");
  }

  return (
    <div className="home">
      <Header
        isAuthenticated={Boolean(currentUser)}
        userLabel={getGreetingByRole(currentUser)}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={() => {
          setScreen("home");
          if (visibleMovies.length === 0) {
            showAlert("info", "Nenhum filme encontrado com a busca atual.");
          }
        }}
        onAuthAction={() => {
          setAuthMode("login");
          setScreen("auth");
        }}
        onLogoClick={() => setScreen("home")}
      />

      <Menu
        activeKey={activeMenuKey}
        isAuthenticated={Boolean(currentUser)}
        isAdminVisible={isAdminVisible}
        onNavigate={navigate}
      />

      {alert ? <div className={`alert alert--${alert.tone}`}>{alert.text}</div> : null}

      {screen === "home" ? (
        <>
          {featuredMovie ? (
            <HeroBanner
              movie={featuredMovie}
              onBuy={() => beginCheckout(featuredMovie.id)}
              onDetails={() => openMovie(featuredMovie.id)}
              searchValue={searchValue}
              resultCount={visibleMovies.length}
            />
          ) : null}

          <section className="dashboard-grid">
            <article className="panel panel--detail">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Filme selecionado</p>
                  <h3 className="panel__title">{selectedMovie?.name ?? "Sem filme selecionado"}</h3>
                </div>
                {selectedMovie ? <span className="pill">{selectedMovie.status}</span> : null}
              </div>

              {selectedMovie ? (
                <div className="detail-grid">
                  <div>
                    <p className="detail-copy">{selectedMovie.synopsis}</p>
                    <div className="facts-list">
                      <span>Genero: {selectedMovie.genre}</span>
                      <span>Classificacao: {selectedMovie.classification}</span>
                      <span>Duracao: {formatDuration(selectedMovie.durationMinutes)}</span>
                      <span>Direcao: {selectedMovie.director}</span>
                      <span>Elenco: {selectedMovie.cast}</span>
                      <span>Estreia: {selectedMovie.premiereDate}</span>
                    </div>
                  </div>

                  <div className="session-stack">
                    <strong>Sessoes disponiveis</strong>
                    {featuredSessions.length > 0 ? (
                      featuredSessions.map((session) => {
                        const summary = getSessionSummary(session, cinemaStore.rooms, cinemaStore.movies);
                        return (
                          <button
                            key={session.id}
                            type="button"
                            className={`session-card ${selectedSessionId === session.id ? "session-card--active" : ""}`}
                            onClick={() => selectSession(session.id)}
                          >
                            <span>{session.date}</span>
                            <strong>{session.time}</strong>
                            <span>{summary.roomLabel}</span>
                            <span>{session.language}</span>
                            <span>{formatCurrency(session.price)}</span>
                          </button>
                        );
                      })
                    ) : (
                      <span className="muted-text">Nenhuma sessao aberta para compra.</span>
                    )}
                  </div>
                </div>
              ) : null}
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Resumo rapido</p>
                  <h3 className="panel__title">Operacao do dia</h3>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <strong>{cinemaStore.movies.filter((movie) => movie.status === "Em Cartaz").length}</strong>
                  <span>Filmes em cartaz</span>
                </div>
                <div className="stat-card">
                  <strong>{clientSessions.length}</strong>
                  <span>Sessoes abertas</span>
                </div>
                <div className="stat-card">
                  <strong>{formatCurrency(periodTicketRevenue + periodSnackRevenue)}</strong>
                  <span>Receita {getPeriodLabel(reportPeriod).toLowerCase()}</span>
                </div>
                <div className="stat-card">
                  <strong>{cinemaStore.snackOrders.filter((order) => order.status === "Pronto").length}</strong>
                  <span>Pedidos prontos</span>
                </div>
              </div>
            </article>
          </section>

          <MoviesSection
            movies={visibleMovies}
            selectedMovieId={selectedMovieId}
            onSelectMovie={openMovie}
            onBuy={beginCheckout}
          />
        </>
      ) : null}

      {screen === "movie" ? (
        <section className="page-shell">
          <div className="page-grid">
            <article className="panel panel--wide">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Detalhes do filme</p>
                  <h3 className="panel__title">{selectedMovie?.name ?? "Filme nao encontrado"}</h3>
                </div>
                {selectedMovie ? <span className="pill">{selectedMovie.status}</span> : null}
              </div>

              {selectedMovie ? (
                <div className="detail-grid">
                  <div className="movie-detail">
                    <div
                      className="movie-detail__poster"
                      style={{ backgroundImage: `url(${selectedMovie.image})` }}
                    />
                    <div className="movie-detail__content">
                      <p className="detail-copy">{selectedMovie.synopsis}</p>
                      <div className="facts-list">
                        <span>Genero: {selectedMovie.genre}</span>
                        <span>Classificacao: {selectedMovie.classification}</span>
                        <span>Duracao: {formatDuration(selectedMovie.durationMinutes)}</span>
                        <span>Diretor: {selectedMovie.director}</span>
                        <span>Elenco: {selectedMovie.cast}</span>
                        <span>Estreia: {selectedMovie.premiereDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="session-stack">
                    <strong>Sessoes desse filme</strong>
                    {clientSessions
                      .filter((session) => session.movieId === selectedMovie.id)
                      .map((session) => {
                        const summary = getSessionSummary(session, cinemaStore.rooms, cinemaStore.movies);
                        return (
                          <button
                            key={session.id}
                            type="button"
                            className={`session-card ${selectedSessionId === session.id ? "session-card--active" : ""}`}
                            onClick={() => {
                              selectSession(session.id);
                              beginCheckout(selectedMovie.id);
                            }}
                          >
                            <span>{session.date}</span>
                            <strong>{session.time}</strong>
                            <span>{summary.roomLabel}</span>
                            <span>{session.language}</span>
                            <span>{formatCurrency(session.price)}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Acoes</p>
                  <h3 className="panel__title">Proximo passo</h3>
                </div>
              </div>
              <div className="stack-list">
                <button type="button" className="primary-button" onClick={() => selectedMovie && beginCheckout(selectedMovie.id)}>
                  Comprar ingresso
                </button>
                <button type="button" className="secondary-button" onClick={() => setScreen("home")}>
                  Voltar para catalogo
                </button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "auth" ? (
        <section className="page-shell">
          <div className="auth-layout">
            <article className="panel auth-panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Acesso</p>
                  <h3 className="panel__title">Entrar</h3>
                </div>
                <button type="button" className="secondary-button" onClick={() => setAuthMode("login")}>
                  Login
                </button>
              </div>

              <form className="form-grid" onSubmit={handleLogin}>
                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>

                <button type="submit" className="primary-button">
                  Entrar
                </button>

                <div className="hint-card">
                  <strong>Perfis de teste</strong>
                  <span>Cliente: cliente@cinereact.com / Cliente@123</span>
                  <span>Administrador: admin@cinereact.com / Admin@123</span>
                  <span>O sistema identifica automaticamente se a conta e de cliente ou ADM.</span>
                </div>
              </form>
            </article>

            <article className="panel auth-panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Cadastro do cliente</p>
                  <h3 className="panel__title">
                    {authMode === "register" ? "Criar conta" : "Novo cadastro"}
                  </h3>
                </div>
                <button type="button" className="secondary-button" onClick={() => setAuthMode("register")}>
                  Criar conta
                </button>
              </div>

              <form className="form-grid" onSubmit={handleRegister}>
                <label className="field">
                  <span>Nome</span>
                  <input
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Telefone</span>
                  <input
                    value={formatPhone(registerForm.phone)}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        phone: sanitizeDigits(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>CPF</span>
                  <input
                    value={formatCpf(registerForm.cpf)}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        cpf: sanitizeDigits(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Confirmar senha</span>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="hint-card field--full">
                  <strong>Regra de acesso</strong>
                  <span>Essa tela publica cria apenas clientes.</span>
                  <span>Se a conta for administrativa, o login direciona para a gestao automaticamente.</span>
                </div>

                <button type="submit" className="primary-button">
                  Cadastrar cliente
                </button>
              </form>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "session" ? (
        <section className="page-shell">
          <div className="page-grid">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Perfil</p>
                  <h3 className="panel__title">
                    {currentUser ? `${currentUser.name}` : "Sessao do usuario"}
                  </h3>
                </div>
                {currentUser ? <span className="pill">{formatUserType(currentUser.type)}</span> : null}
              </div>

              {currentUser ? (
                <div className="profile-list">
                  <span>ID: {currentUser.id}</span>
                  <span>E-mail: {currentUser.email}</span>
                  {currentUser.phone ? <span>Telefone: {formatPhone(currentUser.phone)}</span> : null}
                  {currentUser.cpf ? <span>CPF: {formatCpf(currentUser.cpf)}</span> : null}
                  {currentUser.roleTitle ? <span>Cargo: {currentUser.roleTitle}</span> : null}
                  {currentUser.shift ? <span>Turno: {currentUser.shift}</span> : null}
                </div>
              ) : (
                <p className="muted-text">Entre para acompanhar seu historico e operacoes.</p>
              )}

              <div className="button-row">
                {!currentUser ? (
                  <button type="button" className="primary-button" onClick={() => setScreen("auth")}>
                    Entrar agora
                  </button>
                ) : (
                  <button type="button" className="secondary-button" onClick={logout}>
                    Sair da conta
                  </button>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Historico</p>
                  <h3 className="panel__title">Compras de ingressos</h3>
                </div>
              </div>

              <div className="stack-list">
                {userBookings.length > 0 ? (
                  userBookings
                    .slice()
                    .reverse()
                    .map((booking) => {
                      const movie = cinemaStore.movies.find((item) => item.id === booking.movieId);
                      const session = cinemaStore.sessions.find((item) => item.id === booking.sessionId);
                      return (
                        <div
                          key={booking.id}
                          className={`ticket-card ${highlightBookingId === booking.id ? "ticket-card--highlight" : ""}`}
                        >
                          <div className="ticket-card__header">
                            <strong>{movie?.name ?? booking.movieId}</strong>
                            <span className={`pill pill--${booking.status.toLowerCase()}`}>
                              {getPaymentBadge(booking.status)}
                            </span>
                          </div>
                          <span>
                            Sessao: {session?.date} · {session?.time}
                          </span>
                          <span>Pagamento: {formatPaymentMethod(booking.paymentMethod)}</span>
                          <span>Total: {formatCurrency(booking.total)}</span>
                          <span>
                            Assentos: {booking.tickets.map((ticket) => ticket.seatLabel).join(", ")}
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <span className="muted-text">Nenhuma compra encontrada.</span>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Notificacoes</p>
                  <h3 className="panel__title">Bomboniere e avisos</h3>
                </div>
              </div>

              <div className="stack-list">
                {readyNotifications.length > 0 ? (
                  readyNotifications.map((order) => (
                    <div key={order.id} className="notification-card">
                      <strong>Pedido {order.id}</strong>
                      <span>Seu pedido esta pronto para retirada.</span>
                    </div>
                  ))
                ) : (
                  <span className="muted-text">Nenhum aviso no momento.</span>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Pedidos</p>
                  <h3 className="panel__title">Bomboniere</h3>
                </div>
              </div>

              <div className="stack-list">
                {userSnackOrders.length > 0 ? (
                  userSnackOrders
                    .slice()
                    .reverse()
                    .map((order) => (
                      <div key={order.id} className="ticket-card">
                        <div className="ticket-card__header">
                          <strong>{order.id}</strong>
                          <span className={`pill pill--${order.status.toLowerCase()}`}>{order.status}</span>
                        </div>
                        <span>
                          {order.items
                            .map((item) => {
                              const product = cinemaStore.products.find(
                                (productItem) => productItem.id === item.productId
                              );
                              return `${product?.name ?? item.productId} x${item.quantity}`;
                            })
                            .join(" · ")}
                        </span>
                        <span>Total: {formatCurrency(order.total)}</span>
                      </div>
                    ))
                ) : (
                  <span className="muted-text">Nenhum pedido realizado.</span>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "snack" ? (
        <section className="page-shell">
          <div className="page-grid page-grid--snack">
            <article className="panel panel--wide">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Bomboniere</p>
                  <h3 className="panel__title">Produtos e pedidos</h3>
                </div>
              </div>

              <div className="product-grid">
                {cinemaStore.products.map((product) => (
                  <div key={product.id} className="product-card">
                    <strong>{product.name}</strong>
                    <span>{product.type}</span>
                    <span>{formatCurrency(product.price)}</span>
                    <span>Estoque: {product.stock}</span>
                    <div className="quantity-row">
                      <button
                        type="button"
                        onClick={() => updateSnackQuantity(product.id, (snackQuantities[product.id] ?? 0) - 1)}
                      >
                        -
                      </button>
                      <strong>{snackQuantities[product.id] ?? 0}</strong>
                      <button
                        type="button"
                        onClick={() => updateSnackQuantity(product.id, (snackQuantities[product.id] ?? 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Resumo</p>
                  <h3 className="panel__title">Fechar pedido</h3>
                </div>
              </div>

              <div className="stack-list">
                {Object.entries(snackQuantities)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([productId, quantity]) => {
                    const product = cinemaStore.products.find((item) => item.id === productId);
                    if (!product) {
                      return null;
                    }
                    return (
                      <div key={productId} className="mini-row">
                        <span>
                          {product.name} x{quantity}
                        </span>
                        <strong>{formatCurrency(product.price * quantity)}</strong>
                      </div>
                    );
                  })}
              </div>

              <label className="field">
                <span>Pagamento</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="primary-button" onClick={placeSnackOrder}>
                Enviar pedido
              </button>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "checkout" ? (
        <section className="page-shell">
          <div className="page-grid">
            <article className="panel panel--wide">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Checkout</p>
                  <h3 className="panel__title">{selectedMovie?.name}</h3>
                </div>
                <span className="pill">{selectedSession?.language}</span>
              </div>

              <div className="checkout-grid">
                <div className="checkout-column">
                  <strong>1. Selecao da sessao</strong>
                  <div className="stack-list">
                    {clientSessions
                      .filter((session) => session.movieId === selectedMovie?.id)
                      .map((session) => {
                        const summary = getSessionSummary(session, cinemaStore.rooms, cinemaStore.movies);
                        return (
                          <button
                            key={session.id}
                            type="button"
                            className={`session-card ${selectedSessionId === session.id ? "session-card--active" : ""}`}
                            onClick={() => selectSession(session.id)}
                          >
                            <span>{session.date}</span>
                            <strong>{session.time}</strong>
                            <span>{summary.roomLabel}</span>
                            <span>{session.language}</span>
                            <span>{formatCurrency(session.price)}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="checkout-column">
                  <strong>2. Selecao de assentos</strong>
                  <div className="screen-indicator">TELA</div>
                  <div className="seat-map">
                    {selectedRoom?.seats.map((seat) => {
                      const visualStatus = selectedSession
                        ? getSeatVisualStatus(seat, selectedSession, selectedSeatIds)
                        : seat.status;
                      const isSelected = selectedSeatIds.includes(seat.id);
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          className={`seat seat--${visualStatus.toLowerCase()} ${isSelected ? "seat--selected" : ""}`}
                          onClick={() => toggleSeat(seat.id)}
                          disabled={visualStatus !== "Disponivel" && !isSelected}
                          title={`${seat.label} · ${seat.type}`}
                        >
                          {seat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Pagamento</p>
                  <h3 className="panel__title">Finalizacao</h3>
                </div>
              </div>

              <div className="stack-list">
                {selectedSeatIds.map((seatId) => (
                  <div key={seatId} className="ticket-type-card">
                    <span>Assento {selectedRoom?.seats.find((seat) => seat.id === seatId)?.label}</span>
                    <select
                      value={ticketTypesBySeat[seatId] ?? "Inteira"}
                      onChange={(event) => updateTicketType(seatId, event.target.value as TicketType)}
                    >
                      {TICKET_TYPES.map((ticketType) => (
                        <option key={ticketType} value={ticketType}>
                          {ticketType} ·
                          {" "}
                          {selectedSession ? formatCurrency(selectedSession.price * getTicketMultiplier(ticketType)) : ""}
                        </option>
                      ))}
                    </select>
                    {(ticketTypesBySeat[seatId] ?? "Inteira") === "Meia" ? (
                      <span className="muted-text">Comprovacao sera exigida na entrada.</span>
                    ) : null}
                  </div>
                ))}
              </div>

              <label className="field">
                <span>Forma de pagamento</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <div className="summary-box">
                <span>Ingressos: {selectedSeatIds.length}</span>
                <strong>Total: {formatCurrency(checkoutTotal)}</strong>
              </div>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={() => setScreen("home")}>
                  Cancelar
                </button>
                <button type="button" className="primary-button" onClick={confirmPurchase}>
                  Confirmar pagamento
                </button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "success" ? (
        <section className="page-shell">
          <div className="page-grid">
            <article className="panel panel--wide">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Pos-compra</p>
                  <h3 className="panel__title">Ingressos emitidos</h3>
                </div>
              </div>

              <div className="ticket-grid">
                {cinemaStore.bookings
                  .filter((booking) => booking.id === highlightBookingId)
                  .flatMap((booking) => booking.tickets)
                  .map((ticket) => (
                    <div key={ticket.id} className="qr-card">
                      <img src={ticket.qrCode} alt={`QR Code ${ticket.seatLabel}`} />
                      <strong>{ticket.seatLabel}</strong>
                      <span>{ticket.ticketType}</span>
                      <span>{formatCurrency(ticket.unitPrice)}</span>
                    </div>
                  ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Status</p>
                  <h3 className="panel__title">Compra em andamento</h3>
                </div>
              </div>

              {cinemaStore.bookings
                .filter((booking) => booking.id === highlightBookingId)
                .map((booking) => (
                  <div key={booking.id} className="stack-list">
                    <span>ID da compra: {booking.id}</span>
                    <span>Status: {booking.status}</span>
                    <span>Total: {formatCurrency(booking.total)}</span>
                    <span>Pagamento: {booking.paymentMethod}</span>
                  </div>
                ))}

              <div className="button-row">
                <button type="button" className="primary-button" onClick={() => setScreen("session")}>
                  Ir para Sua Sessao
                </button>
                <button type="button" className="secondary-button" onClick={() => setScreen("home")}>
                  Voltar ao inicio
                </button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {screen === "backoffice" ? (
        <section className="page-shell">
          {currentUser?.type === "funcionario" ? (
            <div className="page-grid">
              <article className="panel panel--wide">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">Operacao</p>
                    <h3 className="panel__title">Pedidos da bomboniere</h3>
                  </div>
                </div>

                <div className="stack-list">
                  {cinemaStore.snackOrders.length > 0 ? (
                    cinemaStore.snackOrders
                      .slice()
                      .reverse()
                      .map((order) => {
                        const client = cinemaStore.users.find((user) => user.id === order.clientId);
                        return (
                          <div key={order.id} className="operator-card">
                            <div>
                              <strong>{order.id}</strong>
                              <span>{client?.name ?? order.clientId}</span>
                              <span>
                                {order.items
                                  .map((item) => {
                                    const product = cinemaStore.products.find(
                                      (product) => product.id === item.productId
                                    );
                                    return `${product?.name ?? item.productId} x${item.quantity}`;
                                  })
                                  .join(" · ")}
                              </span>
                            </div>
                            <div className="button-row">
                              <span className={`pill pill--${order.status.toLowerCase()}`}>{order.status}</span>
                              {order.status !== "Entregue" ? (
                                <button
                                  type="button"
                                  className="primary-button"
                                  onClick={() => advanceOrderStatus(order.id)}
                                >
                                  Avancar status
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <span className="muted-text">Nenhum pedido recebido ainda.</span>
                  )}
                </div>
              </article>

              <article className="panel">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">Fluxo atual</p>
                    <h3 className="panel__title">Resumo da operacao</h3>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <strong>{cinemaStore.snackOrders.filter((order) => order.status === "Preparando").length}</strong>
                    <span>Preparando</span>
                  </div>
                  <div className="stat-card">
                    <strong>{cinemaStore.snackOrders.filter((order) => order.status === "Pronto").length}</strong>
                    <span>Prontos</span>
                  </div>
                  <div className="stat-card">
                    <strong>{cinemaStore.snackOrders.filter((order) => order.status === "Entregue").length}</strong>
                    <span>Entregues</span>
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <div className="backoffice-layout">
              <article className="panel panel--wide">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">Usuarios</p>
                    <h3 className="panel__title">Cadastros por perfil</h3>
                  </div>
                </div>

                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>E-mail</th>
                        <th>CPF</th>
                        <th>Telefone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cinemaStore.users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{formatUserType(user.type)}</td>
                          <td>{user.email}</td>
                          <td>{user.cpf ? formatCpf(user.cpf) : "-"}</td>
                          <td>{user.phone ? formatPhone(user.phone) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <div className="page-grid">
                <article className="panel">
                  <div className="panel__header">
                    <div>
                      <p className="panel__eyebrow">Filmes</p>
                      <h3 className="panel__title">Cadastro e edicao</h3>
                    </div>
                  </div>

                  <form className="form-grid" onSubmit={saveMovie}>
                    <label className="field">
                      <span>Nome do filme</span>
                      <input
                        value={movieForm.name}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Genero</span>
                      <select
                        value={movieForm.genre}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, genre: event.target.value }))
                        }
                      >
                        {MOVIE_GENRES.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Classificacao</span>
                      <select
                        value={movieForm.classification}
                        onChange={(event) =>
                          setMovieForm((current) => ({
                            ...current,
                            classification: event.target.value as Movie["classification"],
                          }))
                        }
                      >
                        {CLASSIFICATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Duracao (min)</span>
                      <input
                        type="number"
                        value={movieForm.durationMinutes}
                        onChange={(event) =>
                          setMovieForm((current) => ({
                            ...current,
                            durationMinutes: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Diretor</span>
                      <input
                        value={movieForm.director}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, director: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Elenco</span>
                      <input
                        value={movieForm.cast}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, cast: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Data de estreia</span>
                      <input
                        type="date"
                        value={movieForm.premiereDate}
                        onChange={(event) =>
                          setMovieForm((current) => ({
                            ...current,
                            premiereDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <select
                        value={movieForm.status}
                        onChange={(event) =>
                          setMovieForm((current) => ({
                            ...current,
                            status: event.target.value as Movie["status"],
                          }))
                        }
                      >
                        <option value="Em Cartaz">Em Cartaz</option>
                        <option value="Em Breve">Em Breve</option>
                        <option value="Encerrado">Encerrado</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Imagem (URL)</span>
                      <input
                        value={movieForm.image}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, image: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field field--full">
                      <span>Sinopse</span>
                      <textarea
                        value={movieForm.synopsis}
                        onChange={(event) =>
                          setMovieForm((current) => ({ ...current, synopsis: event.target.value }))
                        }
                      />
                    </label>
                    <label className="toggle-field field--full">
                      <input
                        type="checkbox"
                        checked={movieForm.featured}
                        onChange={(event) =>
                          setMovieForm((current) => ({
                            ...current,
                            featured: event.target.checked,
                          }))
                        }
                      />
                      <span>Destacar na home</span>
                    </label>
                    <div className="button-row field--full">
                      <button type="submit" className="primary-button">
                        {movieForm.id ? "Salvar filme" : "Cadastrar filme"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setMovieForm(defaultMovieForm)}
                      >
                        Limpar
                      </button>
                    </div>
                  </form>

                  <div className="stack-list">
                    {cinemaStore.movies.map((movie) => (
                      <div key={movie.id} className="operator-card">
                        <div>
                          <strong>{movie.name}</strong>
                          <span>{movie.status}</span>
                          <span>{movie.genre}</span>
                        </div>
                        <div className="button-row">
                          <button type="button" className="secondary-button" onClick={() => editMovie(movie)}>
                            Editar
                          </button>
                          <button type="button" className="secondary-button" onClick={() => removeMovie(movie.id)}>
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel__header">
                    <div>
                      <p className="panel__eyebrow">Salas</p>
                      <h3 className="panel__title">Mapa de assentos</h3>
                    </div>
                  </div>

                  <form className="form-grid" onSubmit={saveRoom}>
                    <label className="field">
                      <span>Numero da sala</span>
                      <input
                        type="number"
                        value={roomForm.number}
                        onChange={(event) =>
                          setRoomForm((current) => ({ ...current, number: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Tipo da sala</span>
                      <select
                        value={roomForm.type}
                        onChange={(event) =>
                          setRoomForm((current) => ({
                            ...current,
                            type: event.target.value as Room["type"],
                          }))
                        }
                      >
                        {ROOM_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <select
                        value={roomForm.status}
                        onChange={(event) =>
                          setRoomForm((current) => ({
                            ...current,
                            status: event.target.value as Room["status"],
                          }))
                        }
                      >
                        {ROOM_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Capacidade</span>
                      <input
                        type="number"
                        value={roomForm.capacity}
                        onChange={(event) =>
                          setRoomForm((current) => ({
                            ...current,
                            capacity: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="button-row field--full">
                      <button type="submit" className="primary-button">
                        {roomForm.id ? "Salvar sala" : "Cadastrar sala"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setRoomForm(defaultRoomForm)}
                      >
                        Limpar
                      </button>
                    </div>
                  </form>

                  <div className="stack-list">
                    {cinemaStore.rooms.map((room) => (
                      <div key={room.id} className="room-card">
                        <div className="ticket-card__header">
                          <strong>
                            Sala {room.number} · {room.type}
                          </strong>
                          <span className="pill">{room.status}</span>
                        </div>
                        <span>{getRoomAvailabilitySummary(room)}</span>
                        <div className="seat-preview">
                          {room.seats.slice(0, 16).map((seat) => (
                            <button
                              key={seat.id}
                              type="button"
                              className={`seat seat--${seat.status.toLowerCase()}`}
                              onClick={() =>
                                updateSeatStatus(
                                  room.id,
                                  seat.id,
                                  seat.status === "Manutencao" ? "Disponivel" : "Manutencao"
                                )
                              }
                            >
                              {seat.label}
                            </button>
                          ))}
                        </div>
                        <div className="button-row">
                          <button type="button" className="secondary-button" onClick={() => editRoom(room)}>
                            Editar sala
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel__header">
                    <div>
                      <p className="panel__eyebrow">Sessoes</p>
                      <h3 className="panel__title">Cronograma e conflitos</h3>
                    </div>
                  </div>

                  <form className="form-grid" onSubmit={saveSession}>
                    <label className="field">
                      <span>Filme</span>
                      <select
                        value={sessionForm.movieId}
                        onChange={(event) =>
                          setSessionForm((current) => ({
                            ...current,
                            movieId: event.target.value,
                          }))
                        }
                      >
                        {cinemaStore.movies
                          .filter((movie) => movie.status === "Em Cartaz")
                          .map((movie) => (
                            <option key={movie.id} value={movie.id}>
                              {movie.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Sala</span>
                      <select
                        value={sessionForm.roomId}
                        onChange={(event) =>
                          setSessionForm((current) => ({
                            ...current,
                            roomId: event.target.value,
                          }))
                        }
                      >
                        {cinemaStore.rooms
                          .filter((room) => room.status === "Ativa")
                          .map((room) => (
                            <option key={room.id} value={room.id}>
                              Sala {room.number} · {room.type}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Data</span>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(event) =>
                          setSessionForm((current) => ({ ...current, date: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Horario</span>
                      <input
                        type="time"
                        value={sessionForm.time}
                        onChange={(event) =>
                          setSessionForm((current) => ({ ...current, time: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Idioma</span>
                      <select
                        value={sessionForm.language}
                        onChange={(event) =>
                          setSessionForm((current) => ({
                            ...current,
                            language: event.target.value as CinemaSession["language"],
                          }))
                        }
                      >
                        {SESSION_LANGUAGES.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Preco</span>
                      <input
                        type="number"
                        step="0.01"
                        value={sessionForm.price}
                        onChange={(event) =>
                          setSessionForm((current) => ({ ...current, price: event.target.value }))
                        }
                      />
                    </label>
                    <div className="button-row field--full">
                      <button type="submit" className="primary-button">
                        {sessionForm.id ? "Salvar sessao" : "Cadastrar sessao"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setSessionForm({
                            ...defaultSessionForm,
                            movieId:
                              cinemaStore.movies.find((movie) => movie.status === "Em Cartaz")?.id ?? "",
                            roomId: cinemaStore.rooms.find((room) => room.status === "Ativa")?.id ?? "",
                          })
                        }
                      >
                        Limpar
                      </button>
                    </div>
                  </form>

                  <div className="stack-list">
                    {cinemaStore.sessions.map((session) => {
                      const summary = getSessionSummary(session, cinemaStore.rooms, cinemaStore.movies);
                      return (
                        <div key={session.id} className="operator-card">
                          <div>
                            <strong>{summary.movieName}</strong>
                            <span>
                              {session.date} · {session.time}
                            </span>
                            <span>{summary.roomLabel}</span>
                            <span>{session.language}</span>
                          </div>
                          <div className="button-row">
                            <button type="button" className="secondary-button" onClick={() => editSession(session)}>
                              Editar
                            </button>
                            <button type="button" className="secondary-button" onClick={() => removeSession(session)}>
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel__header">
                    <div>
                      <p className="panel__eyebrow">Produtos</p>
                      <h3 className="panel__title">Bomboniere</h3>
                    </div>
                  </div>

                  <form className="form-grid" onSubmit={saveProduct}>
                    <label className="field">
                      <span>Nome do produto</span>
                      <input
                        value={productForm.name}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Tipo</span>
                      <select
                        value={productForm.type}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            type: event.target.value as Product["type"],
                          }))
                        }
                      >
                        {PRODUCT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Preco</span>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, price: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Estoque</span>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, stock: event.target.value }))
                        }
                      />
                    </label>
                    <div className="button-row field--full">
                      <button type="submit" className="primary-button">
                        {productForm.id ? "Salvar produto" : "Cadastrar produto"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setProductForm(defaultProductForm)}
                      >
                        Limpar
                      </button>
                    </div>
                  </form>

                  <div className="stack-list">
                    {cinemaStore.products.map((product) => (
                      <div key={product.id} className="operator-card">
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.type}</span>
                          <span>{formatCurrency(product.price)}</span>
                          <span>Estoque: {product.stock}</span>
                        </div>
                        <div className="button-row">
                          <button type="button" className="secondary-button" onClick={() => editProduct(product)}>
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="panel panel--wide">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">Financeiro e relatorios</p>
                    <h3 className="panel__title">Analise consolidada</h3>
                  </div>
                  <div className="button-row">
                    <select
                      value={reportPeriod}
                      onChange={(event) => setReportPeriod(event.target.value as Period)}
                    >
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                    </select>
                    <button type="button" className="primary-button" onClick={exportFinanceReport}>
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <strong>{formatCurrency(periodTicketRevenue)}</strong>
                    <span>Ingressos no periodo</span>
                  </div>
                  <div className="stat-card">
                    <strong>{formatCurrency(periodSnackRevenue)}</strong>
                    <span>Bomboniere no periodo</span>
                  </div>
                  <div className="stat-card">
                    <strong>{formatCurrency(periodTicketRevenue + periodSnackRevenue)}</strong>
                    <span>Fluxo de caixa</span>
                  </div>
                </div>

                <div className="report-grid">
                  <div className="report-card">
                    <strong>Filmes mais assistidos</strong>
                    {cinemaStore.movies
                      .slice()
                      .sort((first, second) => (salesByMovie[second.id] ?? 0) - (salesByMovie[first.id] ?? 0))
                      .slice(0, 5)
                      .map((movie) => (
                        <div key={movie.id} className="mini-row">
                          <span>{movie.name}</span>
                          <strong>{salesByMovie[movie.id] ?? 0} ingresso(s)</strong>
                        </div>
                      ))}
                  </div>

                  <div className="report-card">
                    <strong>Sessoes mais lotadas</strong>
                    {cinemaStore.sessions
                      .slice()
                      .sort((first, second) => {
                        const firstRoom = cinemaStore.rooms.find((room) => room.id === first.roomId);
                        const secondRoom = cinemaStore.rooms.find((room) => room.id === second.roomId);
                        return (
                          getSessionOccupancy(second, secondRoom) - getSessionOccupancy(first, firstRoom)
                        );
                      })
                      .slice(0, 5)
                      .map((session) => {
                        const movie = cinemaStore.movies.find((movie) => movie.id === session.movieId);
                        const room = cinemaStore.rooms.find((room) => room.id === session.roomId);
                        return (
                          <div key={session.id} className="mini-row">
                            <span>
                              {movie?.name} · {session.date} {session.time}
                            </span>
                            <strong>{getSessionOccupancy(session, room)}%</strong>
                          </div>
                        );
                      })}
                  </div>

                  <div className="report-card">
                    <strong>Faturamento por dia</strong>
                    {Object.entries(revenueByDay)
                      .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
                      .slice(0, 5)
                      .map(([day, total]) => (
                        <div key={day} className="mini-row">
                          <span>{day}</span>
                          <strong>{formatCurrency(total)}</strong>
                        </div>
                      ))}
                  </div>

                  <div className="report-card">
                    <strong>Faturamento por filme</strong>
                    {cinemaStore.movies.map((movie) => (
                      <div key={movie.id} className="mini-row">
                        <span>{movie.name}</span>
                        <strong>{formatCurrency(revenueByMovie[movie.id] ?? 0)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default Home;
