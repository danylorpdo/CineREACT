import type { Movie } from "../types";
import { formatDuration, formatCurrency, getMovieVisibleStatus } from "../lib/cinema";
import "./MoviesSection.css";

interface MoviesSectionProps {
  movies: Movie[];
  selectedMovieId: string;
  onSelectMovie: (movieId: string) => void;
  onBuy: (movieId: string) => void;
}

function MoviesSection({
  movies,
  selectedMovieId,
  onSelectMovie,
  onBuy,
}: MoviesSectionProps) {
  return (
    <section className="movies">
      <div className="movies__container">
        <div className="movies__header">
          <div>
            <p className="movies__eyebrow">Filmes e disponibilidade</p>
            <h2 className="movies__title">Catalogo em exibicao</h2>
          </div>
          <span className="movies__count">{movies.length} filme(s) localizado(s)</span>
        </div>

        <div className="movies__grid">
          {movies.map((movie) => (
            <article
              key={movie.id}
              className={`movie-card ${selectedMovieId === movie.id ? "movie-card--selected" : ""}`}
            >
              <div
                className="movie-card__poster"
                style={{ backgroundImage: `url(${movie.image})` }}
              >
                <span className="movie-card__rating">{movie.classification}</span>
                <span className={`movie-card__status movie-card__status--${movie.status.replace(/\s+/g, "-").toLowerCase()}`}>
                  {getMovieVisibleStatus(movie)}
                </span>
              </div>

              <div className="movie-card__content">
                <h3 className="movie-card__title">{movie.name}</h3>
                <p className="movie-card__genre">
                  {movie.genre} · {formatDuration(movie.durationMinutes)}
                </p>
                <p className="movie-card__description">{movie.synopsis}</p>
                <p className="movie-card__price">{formatCurrency(24.9)} a partir</p>

                <div className="movie-card__actions">
                  <button
                    type="button"
                    className="movie-card__details"
                    onClick={() => onSelectMovie(movie.id)}
                  >
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    className="movie-card__buy"
                    onClick={() => onBuy(movie.id)}
                    disabled={movie.status !== "Em Cartaz"}
                  >
                    {movie.status === "Em Cartaz" ? "Comprar" : "Indisponivel"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {movies.length === 0 ? (
          <div className="movies__empty">
            Nenhum filme encontrado com os filtros atuais.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default MoviesSection;
