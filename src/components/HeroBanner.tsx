import type { Movie } from "../types";
import { formatDuration, getMovieVisibleStatus } from "../lib/cinema";
import "./HeroBanner.css";

interface HeroBannerProps {
  movie: Movie;
  onBuy: () => void;
  onDetails: () => void;
  searchValue: string;
  resultCount: number;
}

function HeroBanner({
  movie,
  onBuy,
  onDetails,
  searchValue,
  resultCount,
}: HeroBannerProps) {
  return (
    <section className="hero">
      <div
        className="hero__container"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 8, 18, 0.95) 0%, rgba(5, 8, 18, 0.72) 44%, rgba(5, 8, 18, 0.2) 100%), url(${movie.image})`,
        }}
      >
        <div className="hero__content">
          <div className="hero__meta">
            <span className="hero__badge">{movie.classification}</span>
            <span className="hero__status">{getMovieVisibleStatus(movie)}</span>
          </div>

          <p className="hero__subtitle">Catalogo principal</p>
          <h2 className="hero__title">{movie.name}</h2>
          <p className="hero__description">{movie.synopsis}</p>

          <div className="hero__facts">
            <span>{movie.genre}</span>
            <span>{formatDuration(movie.durationMinutes)}</span>
            <span>Direcao: {movie.director}</span>
          </div>

          <div className="hero__buttons">
            <button type="button" className="hero__primary" onClick={onBuy}>
              Comprar ingresso
            </button>
            <button type="button" className="hero__secondary" onClick={onDetails}>
              Ver detalhes
            </button>
          </div>

          <div className="hero__search-state">
            {searchValue ? (
              <span>
                Busca ativa por <strong>{searchValue}</strong> · {resultCount} resultado(s)
              </span>
            ) : (
              <span>Pesquise e compre em poucos cliques.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
