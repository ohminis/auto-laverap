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
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Inicializar comments.json si no existe
if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

function readComments() {
  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error leyendo comments.json:', err);
    return [];
  }
}

function writeComments(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error escribiendo comments.json:', err);
    return false;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
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
    return;
  }

  // API: Configuración
  if (pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jiraBoardUrl: process.env.JIRA_BOARD_URL || null,
      projectHubUrl: process.env.PROJECT_HUB_URL || null
    }));
    return;
  }

  // API: Comments (CRUD)
  if (pathname === '/api/comments') {
    // GET: Obtener comentarios
    if (req.method === 'GET') {
      const sprintFilter = parsedUrl.searchParams.get('sprint');
      let comments = readComments();
      if (sprintFilter) {
        comments = comments.filter(c => c.sprintId === sprintFilter);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(comments));
      return;
    }

    // POST: Crear comentario
    if (req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        if (!payload.author || !payload.text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Autor y texto son campos requeridos' }));
          return;
        }

        const newComment = {
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          sprintId: payload.sprintId || '2026-09-09',
          slideIndex: typeof payload.slideIndex === 'number' ? payload.slideIndex : 0,
          slideTitle: payload.slideTitle || 'Diapositiva',
          author: payload.author.trim(),
          role: (payload.role || 'Squad Member').trim(),
          tag: payload.tag || 'general', // 'change' | 'question' | 'idea' | 'general'
          text: payload.text.trim(),
          createdAt: new Date().toISOString(),
          resolved: false
        };

        const comments = readComments();
        comments.unshift(newComment);
        writeComments(comments);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newComment));
        return;
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Formato JSON inválido' }));
        return;
      }
    }

    // PATCH: Toggle resolved / actualizar
    if (req.method === 'PATCH') {
      try {
        const payload = await parseJsonBody(req);
        const { id, resolved } = payload;
        if (!id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ID de comentario requerido' }));
          return;
        }

        const comments = readComments();
        const index = comments.findIndex(c => c.id === id);
        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Comentario no encontrado' }));
          return;
        }

        if (typeof resolved === 'boolean') {
          comments[index].resolved = resolved;
        }
        writeComments(comments);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(comments[index]));
        return;
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Formato JSON inválido' }));
        return;
      }
    }

    // DELETE: Eliminar comentario
    if (req.method === 'DELETE') {
      try {
        const id = parsedUrl.searchParams.get('id');
        if (!id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ID de comentario requerido' }));
          return;
        }

        let comments = readComments();
        const initialLen = comments.length;
        comments = comments.filter(c => c.id !== id);
        if (comments.length === initialLen) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Comentario no encontrado' }));
          return;
        }

        writeComments(comments);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id }));
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error del servidor' }));
        return;
      }
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Ruta no encontrada');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Sprint Review · Lavandería de Barrio`);
  console.log(`📡 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`💬 API de comentarios lista en: http://localhost:${PORT}/api/comments`);
  console.log(`👉 Modo Diapositivas: http://localhost:${PORT}/?view=diapositivas`);
  console.log(`👉 Modo Resumen:      http://localhost:${PORT}/?view=resumen`);
  console.log(`\nPresiona Ctrl + C para detener el servidor.\n`);
});
