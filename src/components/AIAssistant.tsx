import { useMemo, useState } from "react";
import {
  formatCurrency,
  formatDuration,
  getMovieVisibleStatus,
} from "../lib/cinema";
import type {
  CinemaSession,
  Movie,
  PaymentMethod,
  Product,
  Room,
  User,
} from "../types";
import "./AIAssistant.css";

type MessageAuthor = "assistant" | "user";

interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  movieIds?: string[];
}

interface AssistantContext {
  currentUser: User | null;
  movies: Movie[];
  paymentMethods: readonly PaymentMethod[];
  products: Product[];
  rooms: Room[];
  sessions: CinemaSession[];
}

interface AIAssistantProps extends AssistantContext {
  onBuyMovie: (movieId: string) => void;
  onOpenMovie: (movieId: string) => void;
}

const FAMILY_CLASSIFICATIONS: Movie["classification"][] = ["Livre", "10", "12"];

function createMessageId(author: MessageAuthor) {
  return `${author}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function isGreeting(text: string) {
  const cleanText = text.replace(/[!?.,]/g, " ").replace(/\s+/g, " ").trim();
  const greetingPhrases = ["oi", "ola", "opa", "eai", "e ai", "salve", "bom dia", "boa tarde", "boa noite"];
  const casualGreetingPhrases = ["oi tudo bem", "ola tudo bem", "opa tudo bem", "e ai tudo bem"];

  return greetingPhrases.includes(cleanText) || casualGreetingPhrases.includes(cleanText);
}

function getSessionsForMovie(movieId: string, sessions: CinemaSession[]) {
  return sessions
    .filter((session) => session.movieId === movieId)
    .slice()
    .sort((first, second) =>
      `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`)
    );
}

function getLowestSessionPrice(movieId: string, sessions: CinemaSession[]) {
  const prices = getSessionsForMovie(movieId, sessions).map((session) => session.price);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function getSessionRoomLabel(session: CinemaSession | undefined, rooms: Room[]) {
  if (!session) {
    return "sessao a confirmar";
  }

  const room = rooms.find((candidate) => candidate.id === session.roomId);
  if (!room) {
    return `${session.date} as ${session.time}`;
  }

  return `${session.date} as ${session.time}, Sala ${room.number} ${room.type}`;
}

function scoreMovie(
  movie: Movie,
  question: string,
  sessions: CinemaSession[],
  rooms: Room[]
) {
  const normalizedQuestion = normalizeText(question);
  const normalizedGenre = normalizeText(movie.genre);
  const normalizedTitle = normalizeText(movie.name);
  const movieSessions = getSessionsForMovie(movie.id, sessions);
  let score = movie.status === "Em Cartaz" ? 8 : 0;

  if (movie.featured) {
    score += 2;
  }

  if (movieSessions.length > 0) {
    score += 2 + Math.min(movieSessions.length, 3);
  }

  if (normalizedQuestion.includes(normalizedGenre)) {
    score += 6;
  }

  normalizedTitle
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .forEach((word) => {
      if (normalizedQuestion.includes(word)) {
        score += 3;
      }
    });

  if (
    includesAny(normalizedQuestion, ["crianca", "infantil", "familia", "leve"]) &&
    FAMILY_CLASSIFICATIONS.includes(movie.classification)
  ) {
    score += 5;
  }

  if (includesAny(normalizedQuestion, ["curto", "rapido"]) && movie.durationMinutes <= 110) {
    score += 3;
  }

  if (includesAny(normalizedQuestion, ["longo", "epico"]) && movie.durationMinutes >= 120) {
    score += 3;
  }

  if (
    includesAny(normalizedQuestion, ["dublado", "legendado"]) &&
    movieSessions.some((session) => normalizedQuestion.includes(normalizeText(session.language)))
  ) {
    score += 3;
  }

  if (includesAny(normalizedQuestion, ["imax", "vip", "3d", "2d"])) {
    const hasRequestedRoom = movieSessions.some((session) => {
      const room = rooms.find((candidate) => candidate.id === session.roomId);
      return room ? normalizedQuestion.includes(normalizeText(room.type)) : false;
    });

    if (hasRequestedRoom) {
      score += 4;
    }
  }

  if (includesAny(normalizedQuestion, ["barato", "economico", "preco"])) {
    const lowestPrice = getLowestSessionPrice(movie.id, sessions);
    if (lowestPrice !== null && lowestPrice <= 35) {
      score += 3;
    }
  }

  return score;
}

function buildMovieLine(movie: Movie, sessions: CinemaSession[], rooms: Room[]) {
  const movieSessions = getSessionsForMovie(movie.id, sessions);
  const firstSession = movieSessions[0];
  const lowestPrice = getLowestSessionPrice(movie.id, sessions);
  const priceLabel = lowestPrice !== null ? ` a partir de ${formatCurrency(lowestPrice)}` : "";
  const sessionLabel =
    movieSessions.length > 0
      ? ` - ${getSessionRoomLabel(firstSession, rooms)}`
      : " - sem sessoes cadastradas";

  return `${movie.name} (${movie.genre}, ${formatDuration(
    movie.durationMinutes
  )}, ${getMovieVisibleStatus(movie)})${priceLabel}${sessionLabel}`;
}

function buildRecommendationReason(
  movie: Movie,
  question: string,
  sessions: CinemaSession[],
  rooms: Room[]
) {
  const normalizedQuestion = normalizeText(question);
  const reasons: string[] = [];
  const movieSessions = getSessionsForMovie(movie.id, sessions);
  const firstSession = movieSessions[0];

  if (normalizeText(question).includes(normalizeText(movie.genre))) {
    reasons.push(`combina com o genero ${movie.genre}`);
  }

  if (
    includesAny(normalizedQuestion, ["crianca", "infantil", "familia", "leve"]) &&
    FAMILY_CLASSIFICATIONS.includes(movie.classification)
  ) {
    reasons.push(`tem classificacao ${movie.classification}`);
  }

  if (includesAny(normalizedQuestion, ["curto", "rapido"]) && movie.durationMinutes <= 110) {
    reasons.push("e uma sessao mais curta");
  }

  if (movieSessions.length > 0) {
    reasons.push(`tem ${getSessionRoomLabel(firstSession, rooms)}`);
  }

  if (reasons.length === 0) {
    reasons.push("esta em cartaz e tem boa combinacao para uma escolha rapida");
  }

  return reasons.join(", ");
}

function rankRecommendedMovies(
  question: string,
  movies: Movie[],
  sessions: CinemaSession[],
  rooms: Room[]
) {
  return movies
    .filter((movie) => movie.status === "Em Cartaz")
    .map((movie) => ({
      movie,
      score: scoreMovie(movie, question, sessions, rooms),
    }))
    .sort((first, second) => second.score - first.score)
    .map((item) => item.movie);
}

function buildWelcomeMessage(context: AssistantContext) {
  const recommendations = rankRecommendedMovies(
    "recomendacao",
    context.movies,
    context.sessions,
    context.rooms
  ).slice(0, 2);

  if (recommendations.length === 0) {
    return "Oi, eu sou a CineIA. Posso recomendar filmes e tirar duvidas rapidas sobre o CineReact.";
  }

  return `Oi, eu sou a CineIA. Posso te ajudar a escolher um filme. Hoje eu olharia ${recommendations
    .map((movie) => movie.name)
    .join(" ou ")}.`;
}

function buildAssistantReply(
  question: string,
  context: AssistantContext
): Omit<ChatMessage, "id" | "author"> {
  const normalizedQuestion = normalizeText(question);
  const moviesInTheaters = context.movies.filter((movie) => movie.status === "Em Cartaz");
  const recommendedMovies = rankRecommendedMovies(
    question,
    context.movies,
    context.sessions,
    context.rooms
  ).slice(0, 3);

  if (isGreeting(normalizedQuestion)) {
    return {
      text:
        "Ola! Como posso te ajudar hoje? Posso recomendar um filme, explicar como comprar ingresso, mostrar onde ficam suas compras ou tirar duvidas sobre cadastro e pagamento.",
    };
  }

  if (includesAny(normalizedQuestion, ["obrigado", "obrigada", "valeu", "vlw"])) {
    return {
      text: "De nada! Se precisar, posso ajudar com filmes, ingressos, cadastro, pagamento ou bomboniere.",
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "ajuda",
      "duvida",
      "duvidas",
      "o que voce faz",
      "o que vc faz",
      "como voce ajuda",
      "como vc ajuda",
    ])
  ) {
    return {
      text:
        "Eu ajudo com o basico do CineReact: recomendo filmes em cartaz, explico como comprar ingressos, onde ver compras, como criar conta, formas de pagamento, bomboniere e acesso da area administrativa.",
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "meus ingressos",
      "meu ingresso",
      "ingressos comprados",
      "filmes comprados",
      "filme comprado",
      "minhas compras",
      "historico",
      "qr code",
      "qrcode",
      "meus pedidos",
      "minha conta",
    ])
  ) {
    const accountHint = context.currentUser
      ? "Voce ja esta logado, entao pode abrir Minha Conta pelo menu."
      : "Primeiro entre com uma conta de cliente pelo botao Entrar.";

    return {
      text: `${accountHint} Em Minha Conta ficam seus ingressos comprados, QR Code, historico de compras, notificacoes e pedidos da bomboniere.`,
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "navegar",
      "navegacao",
      "onde fica",
      "onde encontro",
      "onde vejo",
      "menu",
      "plataforma",
      "como uso",
      "como acessar",
    ])
  ) {
    return {
      text:
        "Pelo menu superior voce navega pela plataforma: Inicio mostra os destaques, Filmes abre o catalogo, Minha Conta mostra compras e QR Codes, Bomboniere permite pedir produtos, e Area ADM aparece para administradores.",
    };
  }

  if (includesAny(normalizedQuestion, ["pagamento", "pagar", "pix", "credito", "debito", "cartao"])) {
    return {
      text: `As formas de pagamento aceitas sao ${context.paymentMethods
        .map((method) => method)
        .join(", ")}. No checkout voce escolhe o metodo, confirma os assentos e finaliza a compra.`,
    };
  }

  if (includesAny(normalizedQuestion, ["horario", "horarios", "sessoes", "proxima sessao", "sessao disponivel"])) {
    const moviesWithSessions = moviesInTheaters
      .map((movie) => ({
        movie,
        firstSession: getSessionsForMovie(movie.id, context.sessions)[0],
      }))
      .filter((item) => item.firstSession)
      .slice(0, 4);

    if (moviesWithSessions.length === 0) {
      return {
        text: "Nao encontrei sessoes cadastradas agora. Voce ainda pode ver os filmes em cartaz no catalogo.",
        movieIds: moviesInTheaters.slice(0, 3).map((movie) => movie.id),
      };
    }

    return {
      text: `Estas sao algumas sessoes disponiveis:\n${moviesWithSessions
        .map(({ movie, firstSession }) => `- ${movie.name}: ${getSessionRoomLabel(firstSession, context.rooms)}`)
        .join("\n")}`,
      movieIds: moviesWithSessions.map(({ movie }) => movie.id),
    };
  }

  if (includesAny(normalizedQuestion, ["comprar", "ingresso", "assento", "checkout", "sessao"])) {
    return {
      text:
        "Para comprar: escolha um filme em cartaz, clique em Comprar, entre com uma conta de cliente, selecione a sessao, marque os assentos e finalize no checkout. Assentos disponiveis aparecem em azul, ocupados em vermelho e manutencao em cinza.",
      movieIds: recommendedMovies.slice(0, 2).map((movie) => movie.id),
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "cadastro",
      "cadastrar",
      "criar conta",
      "registrar",
      "login",
      "entrar",
      "conta",
      "senha",
    ])
  ) {
    const accountHint = context.currentUser
      ? `Voce ja esta conectado como ${context.currentUser.name}.`
      : "Clique em Entrar no topo da pagina e depois em Criar conta.";

    return {
      text: `${accountHint} No cadastro voce informa nome, e-mail, telefone, CPF e senha. Depois disso, a conta de cliente libera compra de ingressos, historico, notificacoes e pedidos da bomboniere.`,
    };
  }

  if (includesAny(normalizedQuestion, ["bomboniere", "pipoca", "refrigerante", "combo", "lanche", "produto"])) {
    const productList = context.products
      .slice(0, 4)
      .map((product) => `${product.name} (${formatCurrency(product.price)})`)
      .join(", ");

    return {
      text: `Na bomboniere voce monta o pedido e acompanha o status: Preparando, Pronto e Entregue. Produtos em destaque: ${
        productList || "nenhum produto cadastrado ainda"
      }.`,
    };
  }

  if (includesAny(normalizedQuestion, ["cancelar", "cancelamento", "reembolso", "trocar"])) {
    return {
      text:
        "Nesta versao, compras pagas ficam registradas no historico da conta. Para troca, cancelamento ou reembolso, o ideal e procurar o atendimento do cinema com o numero do pedido exibido em Minha Conta.",
    };
  }

  if (includesAny(normalizedQuestion, ["admin", "administrador", "funcionario", "gerenciar"])) {
    return {
      text:
        "A Area ADM aparece para usuarios administradores. Por la da para gerenciar filmes, salas, sessoes, produtos e relatorios financeiros.",
    };
  }

  if (includesAny(normalizedQuestion, ["cartaz", "catalogo", "filmes", "disponivel", "disponiveis"])) {
    if (moviesInTheaters.length === 0) {
      return {
        text: "Nao encontrei filmes em cartaz cadastrados agora. A area administrativa pode cadastrar ou ativar novos filmes.",
      };
    }

    return {
      text: `Em cartaz no sistema:\n${moviesInTheaters
        .slice(0, 5)
        .map((movie) => `- ${buildMovieLine(movie, context.sessions, context.rooms)}`)
        .join("\n")}`,
      movieIds: moviesInTheaters.slice(0, 3).map((movie) => movie.id),
    };
  }

  if (recommendedMovies.length === 0) {
    return {
      text:
        "Nao encontrei uma recomendacao com os filmes atuais. Posso ajudar com pagamento, cadastro, bomboniere ou compra de ingressos.",
    };
  }

  const [bestMovie, ...otherMovies] = recommendedMovies;
  const otherNames = otherMovies.map((movie) => movie.name).join(", ");
  return {
    text: `Minha recomendacao e ${bestMovie.name}: ${buildRecommendationReason(
      bestMovie,
      question,
      context.sessions,
      context.rooms
    )}. ${otherNames ? `Outras boas opcoes: ${otherNames}.` : ""}`,
    movieIds: recommendedMovies.map((movie) => movie.id),
  };
}

function AIAssistant({
  currentUser,
  movies,
  onBuyMovie,
  onOpenMovie,
  paymentMethods,
  products,
  rooms,
  sessions,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const context = useMemo<AssistantContext>(
    () => ({ currentUser, movies, paymentMethods, products, rooms, sessions }),
    [currentUser, movies, paymentMethods, products, rooms, sessions]
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "assistant-welcome",
      author: "assistant",
      text: buildWelcomeMessage(context),
    },
  ]);

  function sendQuestion(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const reply = buildAssistantReply(trimmedQuestion, context);
    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      author: "user",
      text: trimmedQuestion,
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId("assistant"),
      author: "assistant",
      ...reply,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInputValue("");
    setIsOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendQuestion(inputValue);
  }

  function handleMovieAction(movieId: string, action: "buy" | "details") {
    setIsOpen(false);
    if (action === "buy") {
      onBuyMovie(movieId);
      return;
    }
    onOpenMovie(movieId);
  }

  return (
    <aside className={`ai-assistant ${isOpen ? "ai-assistant--open" : ""}`}>
      {isOpen ? (
        <section className="ai-assistant__panel" aria-label="Assistente IA CineReact">
          <div className="ai-assistant__header">
            <div>
              <h2>CineIA</h2>
              <span className="ai-assistant__eyebrow">Online agora</span>
            </div>
            <button
              type="button"
              className="ai-assistant__close"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar assistente"
            >
              X
            </button>
          </div>

          <div className="ai-assistant__messages" aria-live="polite">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`ai-assistant__message ai-assistant__message--${message.author}`}
              >
                <strong>{message.author === "assistant" ? "CineIA" : "Voce"}</strong>
                {message.text.split("\n").map((line) => (
                  <p key={`${message.id}-${line}`}>{line}</p>
                ))}

                {message.movieIds?.length ? (
                  <div className="ai-assistant__movies">
                    {message.movieIds.map((movieId) => {
                      const movie = movies.find((candidate) => candidate.id === movieId);
                      if (!movie) {
                        return null;
                      }

                      const firstSession = getSessionsForMovie(movie.id, sessions)[0];
                      return (
                        <div key={movie.id} className="ai-assistant__movie">
                          <div>
                            <strong>{movie.name}</strong>
                            <span>
                              {movie.genre} - {formatDuration(movie.durationMinutes)}
                            </span>
                            <span>{getSessionRoomLabel(firstSession, rooms)}</span>
                          </div>
                          <div className="ai-assistant__movie-actions">
                            <button type="button" onClick={() => handleMovieAction(movie.id, "details")}>
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovieAction(movie.id, "buy")}
                              disabled={movie.status !== "Em Cartaz"}
                            >
                              Comprar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <form className="ai-assistant__form" onSubmit={handleSubmit}>
            <label className="ai-assistant__label" htmlFor="cineia-question">
              Pergunte para a CineIA
            </label>
            <div>
              <input
                id="cineia-question"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Mensagem..."
              />
              <button type="submit">Enviar</button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ai-assistant__launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Abrir assistente IA"
      >
        <span>IA</span>
      </button>
    </aside>
  );
}

export default AIAssistant;
