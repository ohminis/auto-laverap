const http = require('http');
const fs = require('fs');
const path = require('path');

// Cargar variables de .env si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        process.env[key] = value;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.toLowerCase();

  // Rutas que sirven la aplicación frontend
  const validAppRoutes = [
    '/',
    '/index.html',
    '/sprint-review',
    '/slides',
    '/diapositivas',
    '/resumen',
    '/doc'
  ];

  if (validAppRoutes.includes(pathname)) {
    fs.readFile(HTML_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error al cargar la presentación del Sprint Review.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jiraBoardUrl: process.env.JIRA_BOARD_URL || null,
      projectHubUrl: process.env.PROJECT_HUB_URL || null
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ruta no encontrada');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Sprint Review · Lavandería de Barrio`);
  console.log(`📡 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`👉 Modo Diapositivas: http://localhost:${PORT}/?view=diapositivas`);
  console.log(`👉 Modo Resumen:      http://localhost:${PORT}/?view=resumen`);
  console.log(`\nPresiona Ctrl + C para detener el servidor.\n`);
});
