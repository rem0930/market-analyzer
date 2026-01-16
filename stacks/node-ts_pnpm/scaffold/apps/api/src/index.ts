import { createServer, IncomingMessage, ServerResponse } from 'node:http';

/**
 * Hello World API
 * This is a minimal example to verify the stack is working.
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

const PORT = process.env.PORT ?? 3000;

/**
 * Simple HTTP request handler
 */
function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // Health check endpoint
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Greeting endpoint
  if (url.pathname === '/greet') {
    const name = url.searchParams.get('name') ?? 'World';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: greet(name) }));
    return;
  }

  // Root endpoint
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: '@monorepo/api', version: '0.0.1' }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer(handleRequest);

  server.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Greet:  http://localhost:${PORT}/greet?name=YourName`);
  });
}
