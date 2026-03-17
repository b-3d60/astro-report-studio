import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, 'db.json');
const PORT = 3001;

const defaultDb = { reports: [] };

async function ensureDbFile() {
  if (!existsSync(DB_PATH)) {
    await writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await readFile(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  // Backward compatibility: older db.json files stored reports as root array.
  if (Array.isArray(parsed)) {
    return { reports: parsed };
  }
  if (!Array.isArray(parsed.reports)) {
    return { reports: [] };
  }
  return parsed;
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not Found' });
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getReportId(pathname) {
  if (pathname.startsWith('/api/reports/')) {
    return decodeURIComponent(pathname.slice('/api/reports/'.length));
  }
  if (pathname.startsWith('/reports/')) {
    return decodeURIComponent(pathname.slice('/reports/'.length));
  }
  return null;
}

function parseBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error('Invalid JSON'));
      }
    });
    req.on('error', rejectBody);
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 200, {});
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = normalizePath(url.pathname);

    if (req.method === 'GET' && (path === '/' || path === '/health' || path === '/api/health')) {
      sendJson(res, 200, {
        name: 'astro-report-studio-data-server',
        status: 'ok',
        endpoints: ['/api/reports', '/reports']
      });
      return;
    }

    if (req.method === 'GET' && (path === '/api/reports' || path === '/reports')) {
      const db = await readDb();
      sendJson(res, 200, db.reports);
      return;
    }

    if (req.method === 'POST' && (path === '/api/reports' || path === '/reports')) {
      const report = await parseBody(req);
      if (!report || typeof report !== 'object' || !report.id) {
        sendJson(res, 400, { error: 'Report with id is required' });
        return;
      }

      const db = await readDb();
      const index = db.reports.findIndex((item) => item.id === report.id);
      if (index >= 0) {
        db.reports[index] = report;
      } else {
        db.reports.push(report);
      }
      await writeDb(db);
      sendJson(res, 201, report);
      return;
    }

    const reportId = getReportId(path);

    if (req.method === 'PUT' && reportId) {
      const id = reportId;
      const report = await parseBody(req);
      if (!report || typeof report !== 'object') {
        sendJson(res, 400, { error: 'Invalid report payload' });
        return;
      }

      const db = await readDb();
      const index = db.reports.findIndex((item) => item.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'Report not found' });
        return;
      }

      db.reports[index] = { ...report, id };
      await writeDb(db);
      sendJson(res, 200, db.reports[index]);
      return;
    }

    if (req.method === 'DELETE' && reportId) {
      const id = reportId;
      const db = await readDb();
      const nextReports = db.reports.filter((item) => item.id !== id);
      db.reports = nextReports;
      await writeDb(db);
      sendJson(res, 200, { ok: true });
      return;
    }

    notFound(res);
  } catch (error) {
    sendJson(res, 500, {
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

server.listen(PORT, () => {
  console.log(`[data-server] running on http://localhost:${PORT}`);
});
