import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend_fastapi');

const pythonCandidates = [
  process.env.BACKEND_PYTHON,
  process.env.PYTHON_BACKEND,
  path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
  'C:\\Users\\haris\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
  'py',
].filter(Boolean);

const backendPython = pythonCandidates.find((candidate) => {
  if (!candidate) return false;
  if (candidate.includes('\\') || candidate.includes('/') || candidate.includes(':')) {
    return fs.existsSync(candidate);
  }
  return true;
});

if (!backendPython) {
  console.error('[dev:full] Could not find a Python executable. Set BACKEND_PYTHON to your python.exe path.');
  process.exit(1);
}

const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
const isWindows = process.platform === 'win32';
const backendHost = '127.0.0.1';
const backendPort = Number(process.env.BACKEND_PORT || 8000);
const apiBaseUrl = process.env.VITE_API_BASE_URL || `http://${backendHost}:${backendPort}/api/v1`;

const isPortInUse = (host, port) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    const done = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once('timeout', done);
    socket.once('error', done);
    socket.connect(port, host);
  });

const backendArgs = backendPython.toLowerCase().endsWith('py.exe') || backendPython === 'py'
  ? ['-3.11', '-m', 'uvicorn', 'app.main:app', '--host', backendHost, '--port', String(backendPort)]
  : ['-m', 'uvicorn', 'app.main:app', '--host', backendHost, '--port', String(backendPort)];

const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const spawnWithFallback = (name, attempts) => {
  let lastError = null;
  for (const attempt of attempts) {
    try {
      const child = spawn(attempt.command, attempt.args, attempt.options);
      return child;
    } catch (error) {
      lastError = error;
    }
  }
  console.error(`[dev:full] Failed to start ${name}.`);
  if (lastError) {
    console.error(lastError);
  }
  process.exit(1);
};

const backendAttempts = isWindows
  ? [
      {
        command: backendPython,
        args: backendArgs,
        options: { cwd: backendDir, stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ]
  : [
      {
        command: backendPython,
        args: backendArgs,
        options: { cwd: backendDir, stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ];

const frontendAttempts = isWindows
  ? [
      {
        command: process.execPath,
        args: [viteBin],
        options: { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ]
  : [
      {
        command: process.execPath,
        args: [viteBin],
        options: { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ];

const backendAlreadyRunning = await isPortInUse(backendHost, backendPort);
let backend = null;
if (backendAlreadyRunning) {
  console.log(`[dev:full] FastAPI already running on ${backendHost}:${backendPort}, reusing it.`);
} else {
  backend = spawnWithFallback('FastAPI', backendAttempts);
}

for (const attempt of frontendAttempts) {
  attempt.options = {
    ...attempt.options,
    env: {
      ...process.env,
      VITE_API_BASE_URL: apiBaseUrl,
    },
  };
}
const frontend = spawnWithFallback('Vite', frontendAttempts);

const forward = (stream, prefix, target) => {
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.length > 0) {
        target.write(`${prefix} ${line}\n`);
      }
    }
  });
};

if (backend) {
  forward(backend.stdout, '[fastapi]', process.stdout);
  forward(backend.stderr, '[fastapi]', process.stderr);
}
forward(frontend.stdout, '[vite]', process.stdout);
forward(frontend.stderr, '[vite]', process.stderr);

let shuttingDown = false;
const stopAll = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (backend) backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  setTimeout(() => {
    if (backend) backend.kill('SIGKILL');
    frontend.kill('SIGKILL');
  }, 1500);
};

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

if (backend) {
  backend.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`[dev:full] FastAPI exited with code ${code ?? 'unknown'}. Stopping frontend...`);
      stopAll();
    }
  });
  backend.on('error', (error) => {
    if (!shuttingDown) {
      console.error('[dev:full] FastAPI process error:', error);
      stopAll();
    }
  });
}

frontend.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[dev:full] Vite exited with code ${code ?? 'unknown'}. Stopping backend...`);
    stopAll();
  }
});
frontend.on('error', (error) => {
  if (!shuttingDown) {
    console.error('[dev:full] Vite process error:', error);
    stopAll();
  }
});
