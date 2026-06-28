/**
 * Ship of Theseus local AI service
 *
 * The browser is deliberately a presentation client. This process owns:
 * - persona metadata loaded from a user-selected local persona workspace
 * - one persistent Claude Code session per persona
 * - local conversation transcripts
 * - all model-provider credentials inherited from the terminal environment
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HOST = process.env.THESEUS_HOST || '127.0.0.1';
const PORT = Number(process.env.THESEUS_PORT || 3099);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCAL_CONFIG_PATH =
  process.env.THESEUS_CONFIG_FILE ||
  path.resolve(__dirname, '..', 'theseus.local.json');

function readLocalConfig() {
  if (!existsSync(LOCAL_CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(LOCAL_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error(`[local-ai] Invalid local config: ${error.message}`);
    return {};
  }
}

const localConfig = readLocalConfig();
const PERSONA_HOME =
  process.env.THESEUS_PERSONA_HOME ||
  process.env.AI_PERSONA_HOME ||
  localConfig.personaHome ||
  '';
const PERSONAS_DIR = PERSONA_HOME ? path.join(PERSONA_HOME, 'personas') : '';
const PERSONA_PROFILE_PATH = PERSONA_HOME
  ? path.resolve(
      PERSONA_HOME,
      localConfig.personaProfile || 'PERSONA_SETUP.private.md',
    )
  : '';
const DATA_DIR =
  process.env.THESEUS_DATA_DIR || path.join(__dirname, 'data', 'conversations');

const activeRequests = new Map();
const FALLBACK_COLORS = [
  '#FFB7C5',
  '#8B0000',
  '#4169E1',
  '#228B22',
  '#9932CC',
  '#98FB98',
  '#DAA520',
  '#708090',
];
const NAMED_COLORS = {
  粉色: '#FFB7C5',
  棕色: '#8B4513',
  绿色: '#2E8B57',
  黄色: '#F4D03F',
  蓝色: '#4169E1',
  紫色: '#9932CC',
  橙色: '#F39C12',
  灰色: '#708090',
};

mkdirSync(DATA_DIR, { recursive: true });

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const scalar = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!scalar) continue;
    let value = scalar[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[scalar[1]] = value;
  }
  return result;
}

function personaFiles() {
  if (!PERSONAS_DIR || !existsSync(PERSONAS_DIR)) return new Map();

  return new Map(
    readdirSync(PERSONAS_DIR, { withFileTypes: true })
      .filter((entry) => (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        !entry.name.startsWith('_')
      ))
      .map((entry) => [
        path.basename(entry.name, '.md').toLowerCase(),
        path.join(PERSONAS_DIR, entry.name),
      ]),
  );
}

function fallbackColor(personaId) {
  const hash = [...personaId].reduce(
    (total, character) => total + character.codePointAt(0),
    0,
  );
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function readPersonaProfile() {
  if (!PERSONA_PROFILE_PATH || !existsSync(PERSONA_PROFILE_PATH)) {
    return new Map();
  }

  const markdown = readFileSync(PERSONA_PROFILE_PATH, 'utf8');
  const sections = markdown.split(/^###\s+/m).slice(1);
  const overrides = new Map();

  for (const section of sections) {
    const id = section.match(/ID\s*\/\s*Markdown[：:]\s*`([^`]+)`/i)?.[1];
    if (!id) continue;

    const display = section.match(/展示[：:]\s*(\S+)\s*\/\s*`(#[0-9a-f]{6})`/i);
    const avatar = section.match(/头像[：:]\s*(?:\r?\n\s*)?`([^`]+)`/i)?.[1];
    const themeName = section.match(/主题色[：:]\s*([^\r\n]+)/i)?.[1]?.trim();
    const namedColor = themeName ? NAMED_COLORS[themeName] : null;

    overrides.set(id.toLowerCase(), {
      emoji: display?.[1],
      color: namedColor || display?.[2],
      avatar,
      themeName,
    });
  }
  return overrides;
}

function readPersona(personaId) {
  const files = personaFiles();
  const normalizedId = String(personaId || '').toLowerCase();
  const sourcePath = files.get(normalizedId);
  if (!sourcePath) {
    const error = new Error('未知角色');
    error.statusCode = 400;
    throw error;
  }
  const source = readFileSync(sourcePath, 'utf8');
  const meta = parseFrontmatter(source);
  const profile = readPersonaProfile().get(normalizedId) || {};
  const configuredColor = profile.color || meta.color || '';
  const color = /^#[0-9a-f]{6}$/i.test(configuredColor)
    ? configuredColor
    : fallbackColor(normalizedId);

  return {
    id: normalizedId,
    name: meta.name || normalizedId,
    domain: meta.role || '',
    gender: meta.gender || '',
    age: meta.age || '',
    style: meta.style || '',
    reference: meta.reference || '',
    trigger: meta.trigger || `@${meta.name || normalizedId}`,
    greeting: meta.greeting || `${meta.name || normalizedId} 已上线。`,
    emoji: profile.emoji || meta.emoji || '◆',
    color,
    themeName: profile.themeName || '',
    avatar: profile.avatar || meta.avatar || '',
  };
}

function readAllPersonas() {
  return [...personaFiles().keys()].sort().map(readPersona);
}

function publicPersona(persona) {
  const { avatar, ...metadata } = persona;
  return {
    ...metadata,
    hasAvatar: Boolean(avatar),
  };
}

function assertPersonaId(value) {
  if (
    typeof value !== 'string' ||
    !personaFiles().has(value.toLowerCase())
  ) {
    const error = new Error('未知角色');
    error.statusCode = 400;
    throw error;
  }
}

function transcriptPath(personaId) {
  assertPersonaId(personaId);
  return path.join(DATA_DIR, `${personaId}.json`);
}

function emptyTranscript(personaId) {
  return {
    personaId,
    sessionId: randomUUID(),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function loadTranscript(personaId) {
  const file = transcriptPath(personaId);
  if (!existsSync(file)) return emptyTranscript(personaId);

  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (
      parsed.personaId !== personaId ||
      typeof parsed.sessionId !== 'string' ||
      !Array.isArray(parsed.messages)
    ) {
      throw new Error('invalid transcript shape');
    }
    return parsed;
  } catch (error) {
    const backup = `${file}.corrupt-${Date.now()}`;
    renameSync(file, backup);
    console.error(`[local-ai] Corrupt transcript moved to ${backup}: ${error.message}`);
    return emptyTranscript(personaId);
  }
}

function saveTranscript(transcript) {
  transcript.updatedAt = new Date().toISOString();
  const file = transcriptPath(transcript.personaId);
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(transcript, null, 2), 'utf8');
  renameSync(temp, file);
}

function publicMessages(transcript, persona) {
  if (transcript.messages.length) return transcript.messages;
  return [{
    id: `welcome-${persona.id}`,
    sender: 'ai',
    text: persona.greeting,
    createdAt: transcript.createdAt,
    isWelcome: true,
  }];
}

function claudeExecutable() {
  if (process.env.CLAUDE_EXECUTABLE) return process.env.CLAUDE_EXECUTABLE;
  if (process.platform === 'win32' && process.env.APPDATA) {
    const executable = path.join(
      process.env.APPDATA,
      'npm',
      'node_modules',
      '@anthropic-ai',
      'claude-code',
      'bin',
      'claude.exe',
    );
    if (existsSync(executable)) return executable;
  }
  return 'claude';
}

function buildClaudeArgs({ transcript, persona, message }) {
  const prompt = `${persona.trigger} ${message}`;
  const hasExistingConversation = transcript.messages.some(
    (item) => item.sender === 'ai',
  );

  const args = [
    '--print',
    prompt,
    '--output-format', 'stream-json',
    '--include-partial-messages',
    '--verbose',
    '--permission-mode', 'acceptEdits',
    '--tools', 'Read,Write,Edit,Glob,Grep',
    '--allowedTools', 'Read,Write,Edit,Glob,Grep',
    '--disallowedTools', 'Bash,WebFetch,WebSearch',
    '--setting-sources', 'project',
    '--effort', process.env.CLAUDE_CODE_EFFORT_LEVEL || 'max',
  ];

  if (hasExistingConversation) {
    args.push('--resume', transcript.sessionId);
  } else {
    args.push('--session-id', transcript.sessionId);
  }
  return args;
}

function sseWrite(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseClaudeLine(line, state, res) {
  if (!line.trim()) return;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }

  if (event.type === 'stream_event') {
    const delta = event.event?.delta;
    if (delta?.type === 'text_delta' && delta.text) {
      state.fullText += delta.text;
      state.receivedDeltas = true;
      sseWrite(res, 'chunk', { text: delta.text });
    }
    return;
  }

  if (event.type === 'result') {
    state.resultText = typeof event.result === 'string' ? event.result : '';
    if (event.session_id) state.sessionId = event.session_id;
    if (event.is_error || event.subtype?.includes('error')) {
      state.resultError = state.resultText || 'Claude Code 返回错误';
    }
  }
}

function callClaude({ persona, transcript, message, res }) {
  return new Promise((resolve) => {
    const executable = claudeExecutable();
    const args = buildClaudeArgs({ transcript, persona, message });
    const child = spawn(executable, args, {
      cwd: PERSONA_HOME,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });

    activeRequests.set(persona.id, child);
    const state = {
      fullText: '',
      resultText: '',
      resultError: '',
      receivedDeltas: false,
      sessionId: transcript.sessionId,
      stdoutBuffer: '',
      stderr: '',
      settled: false,
    };

    const finish = (result) => {
      if (state.settled) return;
      state.settled = true;
      activeRequests.delete(persona.id);
      resolve(result);
    };

    child.stdout.on('data', (chunk) => {
      state.stdoutBuffer += chunk.toString('utf8');
      const lines = state.stdoutBuffer.split(/\r?\n/);
      state.stdoutBuffer = lines.pop() || '';
      for (const line of lines) parseClaudeLine(line, state, res);
    });

    child.stderr.on('data', (chunk) => {
      state.stderr = (state.stderr + chunk.toString('utf8')).slice(-4000);
    });

    child.on('error', (error) => {
      finish({ error: `无法启动 Claude Code：${error.message}` });
    });

    child.on('close', (code) => {
      if (state.stdoutBuffer) {
        parseClaudeLine(state.stdoutBuffer, state, res);
      }

      const finalText = state.fullText || state.resultText;
      if (code === 0 && !state.resultError && finalText) {
        if (!state.receivedDeltas) sseWrite(res, 'chunk', { text: finalText });
        finish({ text: finalText, sessionId: state.sessionId });
        return;
      }

      const detail = state.resultError || state.stderr.trim();
      finish({
        error: detail
          ? `Claude Code 调用失败：${detail}`
          : `Claude Code 异常退出（exit ${code}）`,
        partialText: finalText,
      });
    });

    res.on('close', () => {
      if (!res.writableEnded && child.exitCode === null) {
        child.kill();
      }
    });
  });
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (
    origin &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        const error = new Error('请求内容过大');
        error.statusCode = 413;
        reject(error);
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        const error = new Error('JSON 格式无效');
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'theseus-local-ai',
      personaHomeConfigured: Boolean(PERSONA_HOME),
      personaDocumentsAvailable: Boolean(
        PERSONAS_DIR && existsSync(PERSONAS_DIR),
      ),
      claudeExecutableAvailable:
        claudeExecutable() === 'claude' || existsSync(claudeExecutable()),
      providerConfigured: Boolean(
        process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      ),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/photo/')) {
    const photoName = path.basename(url.pathname);
    if (!photoName || photoName === 'photo') {
      sendJson(res, 400, { error: 'Missing photo filename' });
      return;
    }
    const photoPath = PERSONA_HOME
      ? path.join(PERSONA_HOME, 'photo', photoName)
      : null;
    if (!photoPath || !existsSync(photoPath)) {
      sendJson(res, 404, { error: 'Photo not found' });
      return;
    }
    const ext = path.extname(photoName).toLowerCase();
    const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const data = readFileSync(photoPath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/personas') {
    sendJson(res, 200, {
      personas: readAllPersonas().map(publicPersona),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/persona-asset') {
    const personaId = (url.searchParams.get('personaId') || '').toLowerCase();
    const persona = readPersona(personaId);
    if (!persona.avatar) {
      sendJson(res, 404, { error: '该角色未配置头像' });
      return;
    }

    const workspaceRoot = path.resolve(PERSONA_HOME);
    const assetPath = path.resolve(workspaceRoot, persona.avatar);
    if (
      assetPath !== workspaceRoot &&
      !assetPath.startsWith(`${workspaceRoot}${path.sep}`)
    ) {
      const error = new Error('头像路径超出 Persona 工作区');
      error.statusCode = 403;
      throw error;
    }
    if (!existsSync(assetPath)) {
      sendJson(res, 404, { error: '头像文件不存在' });
      return;
    }

    const contentTypes = {
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypes[path.extname(assetPath).toLowerCase()];
    if (!contentType) {
      const error = new Error('不支持的头像格式');
      error.statusCode = 415;
      throw error;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(readFileSync(assetPath));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/history') {
    const personaId = (url.searchParams.get('personaId') || '').toLowerCase();
    const persona = readPersona(personaId);
    const transcript = loadTranscript(personaId);
    sendJson(res, 200, {
      persona: publicPersona(persona),
      messages: publicMessages(transcript, persona),
    });
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/history') {
    const personaId = (url.searchParams.get('personaId') || '').toLowerCase();
    const persona = readPersona(personaId);
    const running = activeRequests.get(personaId);
    if (running) running.kill();
    const transcript = emptyTranscript(personaId);
    saveTranscript(transcript);
    sendJson(res, 200, {
      messages: publicMessages(transcript, persona),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/chat') {
    const body = await readJsonBody(req);
    const personaId = String(body.personaId || '').toLowerCase();
    const message = String(body.message || '').trim();
    const persona = readPersona(personaId);

    if (!message) {
      const error = new Error('消息不能为空');
      error.statusCode = 400;
      throw error;
    }
    if (message.length > 20_000) {
      const error = new Error('消息不能超过 20000 个字符');
      error.statusCode = 413;
      throw error;
    }
    if (activeRequests.has(personaId)) {
      const error = new Error(`${persona.name} 正在回复，请稍候`);
      error.statusCode = 409;
      throw error;
    }

    const transcript = loadTranscript(personaId);
    const userEntry = {
      id: randomUUID(),
      sender: 'user',
      text: message,
      createdAt: new Date().toISOString(),
    };
    transcript.messages.push(userEntry);
    saveTranscript(transcript);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    sseWrite(res, 'connected', { personaId });

    const result = await callClaude({ persona, transcript, message, res });
    if (result.error) {
      if (result.partialText) {
        transcript.messages.push({
          id: randomUUID(),
          sender: 'ai',
          text: result.partialText,
          createdAt: new Date().toISOString(),
          interrupted: true,
        });
        saveTranscript(transcript);
      }
      sseWrite(res, 'error', { message: result.error });
      res.end();
      return;
    }

    transcript.sessionId = result.sessionId || transcript.sessionId;
    transcript.messages.push({
      id: randomUUID(),
      sender: 'ai',
      text: result.text,
      createdAt: new Date().toISOString(),
    });
    saveTranscript(transcript);
    sseWrite(res, 'done', { fullText: result.text });
    res.end();
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('[local-ai]', error);
    if (!res.headersSent) {
      sendJson(res, error.statusCode || 500, { error: error.message });
    } else {
      sseWrite(res, 'error', { message: error.message });
      res.end();
    }
  });
});

function printStartupSummary(prefix) {
  const providerConfigured = Boolean(
    process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
  );
  console.log(`\n⚓ ${prefix}`);
  console.log(`   Persona workspace: ${PERSONA_HOME || 'NOT CONFIGURED'}`);
  console.log(`   Claude Code: ${claudeExecutable()}`);
  console.log(`   Provider credentials: ${providerConfigured ? 'loaded' : 'NOT LOADED'}`);
  if (!providerConfigured) {
    console.log('   Start this server from a terminal containing your model-provider environment variables.');
  }
}

if (process.env.THESEUS_SELF_TEST === '1') {
  const personas = readAllPersonas();
  printStartupSummary('Theseus local AI self-test');
  console.log(`   Persona documents: ${personas.length}`);
  if (personas.length) {
    const sample = personas[0];
    const transcript = loadTranscript(sample.id);
    console.log(`   Sample: ${sample.id} / metadata loaded`);
    console.log(`   Local transcript messages: ${transcript.messages.length}`);
  }
  console.log('   Self-test: PASS');
} else {
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(
        `\n⚓ Theseus local AI already available on http://${HOST}:${PORT}; reusing it.`,
      );
      return;
    }
    console.error('[local-ai] Server failed:', error);
  });
  server.listen(PORT, HOST, () => {
    printStartupSummary(`Theseus local AI: http://${HOST}:${PORT}`);
  });
}
