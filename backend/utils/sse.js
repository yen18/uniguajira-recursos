// Conjunto de clientes SSE conectados
const clients = new Set();

// Límite máximo de clientes (evita fuga masiva de conexiones)
const MAX_CLIENTS = parseInt(process.env.SSE_MAX_CLIENTS || '200', 10);

function register(res) {
  if (clients.size >= MAX_CLIENTS) {
    // Rechazar nueva conexión si excede el límite
    res.write('event: sse:limit\n');
    res.write('data: {"error":"max_clients_exceeded"}\n\n');
    try { res.end(); } catch {}
    return;
  }

  const client = { res, heartbeat: null };
  clients.add(client);
  // Limpiar automáticamente al cerrar la respuesta
  const cleanup = () => unregister(client);
  res.on?.('close', cleanup);
  res.on?.('finish', cleanup);
  res.on?.('error', cleanup);
  // Heartbeat cada 45s (menos frecuencia reduce escritura y consumo CPU)
  client.heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch (_) {
      unregister(client);
    }
  }, 45000);
}

function unregister(client) {
  try { clearInterval(client.heartbeat); } catch {}
  clients.delete(client);
}

function broadcast(event, data) {
  const payload = `event: ${event}\n` +
                  `data: ${JSON.stringify(data)}\n\n`;
  for (const client of Array.from(clients)) {
    try {
      client.res.write(payload);
    } catch (_) {
      unregister(client);
    }
  }
}

function getClientCount() {
  return clients.size;
}

function shutdownAll() {
  for (const client of Array.from(clients)) {
    try { client.res.write('event: server:shutdown\ndata: {"message":"Servidor cerrando"}\n\n'); } catch {}
    try { client.res.end(); } catch {}
    unregister(client);
  }
}

function canAccept() {
  return clients.size < MAX_CLIENTS;
}

function closeAll() {
  shutdownAll();
}

module.exports = { register, unregister, broadcast, getClientCount, shutdownAll, canAccept, closeAll };
