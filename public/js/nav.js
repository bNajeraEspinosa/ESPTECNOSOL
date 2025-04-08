function insertarNavbar() {
  // Estilos CSS embebidos
  const style = document.createElement('style');
  style.textContent = `
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

.navbar {
  background-color: #333;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar ul {
  list-style: none;
  display: flex;
  gap: 30px;
  padding: 0;
  margin: 0;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  padding: 6px 10px;
  border-radius: 5px;
}

.navbar a.activo {
  background-color: #00BFFF;
}

.nav-logo {
  height: 36px;
  width: auto;
  border-radius: 4px;
}
  `;
  document.head.appendChild(style);

  // Navbar HTML
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <ul>
      <li><a href="/" id="nav-home">🏠 Inicio</a></li>
      <li><a href="/historico" id="nav-historico">📚 Histórico</a></li>
    </ul>
    <img src="/img/logo.png" class="nav-logo" alt="Logo">

  `;
  document.body.insertBefore(nav, document.body.firstChild);

  // Activar link según ruta
  const path = window.location.pathname;
  if (path === '/') {
    document.getElementById('nav-home').classList.add('activo');
  } else if (path.startsWith('/historico')) {
    document.getElementById('nav-historico').classList.add('activo');
  }
}

document.addEventListener('DOMContentLoaded', insertarNavbar);
