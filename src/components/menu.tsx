import "./menu.css";

interface MenuProps {
  activeKey: string;
  isAuthenticated: boolean;
  isAdminVisible: boolean;
  onNavigate: (target: string) => void;
}

function Menu({ activeKey, isAuthenticated, isAdminVisible, onNavigate }: MenuProps) {
  const items = [
    { key: "home", label: "Inicio" },
    { key: "movie", label: "Filmes" },
    { key: "session", label: "Minha Conta" },
    { key: "snack", label: "Bomboniere" },
  ];

  if (isAdminVisible) {
    items.push({ key: "backoffice", label: "Area ADM" });
  }

  return (
    <nav className="menu">
      <div className="menu__container">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`menu__item ${activeKey === item.key ? "menu__item--active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}

        {!isAuthenticated ? (
          <span className="menu__hint">Entre para comprar ingressos e acompanhar seus pedidos.</span>
        ) : (
          <span className="menu__hint">Seu acesso esta pronto para compras e historico.</span>
        )}
      </div>
    </nav>
  );
}

export default Menu;
