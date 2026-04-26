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
  userLabel,
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
          <span className="header__eyebrow">Seu cinema online</span>
          <strong className="header__logo">CINEREACT</strong>
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
            type="search"
            placeholder="Buscar filme, genero, diretor ou elenco"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button type="submit" className="header__search-button">
            Buscar
          </button>
        </form>

        <div className="header__actions">
          <span className="header__status">{userLabel}</span>
          <button
            type="button"
            className="header__action header__action--highlight"
            onClick={onAuthAction}
          >
            {isAuthenticated ? "Minha conta" : "Entrar / Cadastrar"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
