import "./header.css";

interface HeaderProps {
  isAuthenticated: boolean;
  userLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onAuthAction: () => void;
  onLogoClick: () => void;
}

function Header({
  isAuthenticated,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onAuthAction,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__container">
        <button type="button" className="header__brand" onClick={onLogoClick}>
          <span className="header__eyebrow">Cinema online</span>
          <strong className="header__logo">CineReact</strong>
          <span className="header__location">Cascavel - PR</span>
        </button>

        <form
          className="header__search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <input
            className="header__search-input"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar filmes"
            aria-label="Buscar filmes"
          />
          <button type="submit" className="header__search-button">
            Buscar
          </button>
        </form>

        <div className="header__actions">
          <button type="button" className="header__action header__action--highlight" onClick={onAuthAction}>
            {isAuthenticated ? "Minha conta" : "Entrar"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
