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
import { query } from '@anthropic-ai/claude-agent-sdk';
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
const SEMINAR_DIR = path.join(path.dirname(DATA_DIR), 'seminars');

const activeRequests = new Map();
const pendingInteractions = new Map();
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
mkdirSync(SEMINAR_DIR, { recursive: true });

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

function readWorkspaceProfile() {
  if (!PERSONA_PROFILE_PATH || !existsSync(PERSONA_PROFILE_PATH)) {
    return { facilitatorId: '', userAvatar: '' };
  }
  const markdown = readFileSync(PERSONA_PROFILE_PATH, 'utf8');
  return {
    facilitatorId: (
      markdown.match(/研讨会主持人[：:]\s*`([^`]+)`/i)?.[1] || ''
    ).toLowerCase(),
    userAvatar:
      markdown.match(/用户头像[：:]\s*`([^`]+)`/i)?.[1] || '',
  };
}

function halfPortraitPath(avatarPath, displayName = '') {
  if (!avatarPath) return '';
  const normalized = path.normalize(avatarPath);
  if (
    path.isAbsolute(normalized) ||
    normalized.split(path.sep).includes('..')
  ) {
    return '';
  }
  const portraitDirectory = path.join(path.dirname(normalized), 'half');
  const extension = path.extname(normalized);
  const safeDisplayName = (
    displayName &&
    path.basename(displayName) === displayName
  ) ? displayName : '';
  const candidates = [
    safeDisplayName
      ? path.join(portraitDirectory, `${safeDisplayName}${extension}`)
      : '',
    path.join(
      portraitDirectory,
      path.basename(normalized),
    ),
  ].filter(Boolean);
  const existing = candidates.find((candidate) => (
    PERSONA_HOME &&
    existsSync(path.resolve(PERSONA_HOME, candidate))
  ));
  return existing || path.join(
    path.dirname(normalized),
    'half',
    path.basename(normalized),
  );
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
  const workspaceProfile = readWorkspaceProfile();
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
    halfPortrait: halfPortraitPath(
      profile.avatar || meta.avatar || '',
      meta.name || normalizedId,
    ),
    isFacilitator: normalizedId === workspaceProfile.facilitatorId,
  };
}

function readAllPersonas() {
  return [...personaFiles().keys()].sort().map(readPersona);
}

function publicPersona(persona) {
  const { avatar, halfPortrait, ...metadata } = persona;
  return {
    ...metadata,
    hasAvatar: Boolean(avatar),
    hasHalfPortrait: Boolean(halfPortrait && existsSync(
      path.resolve(PERSONA_HOME, halfPortrait),
    )),
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

function assertSeminarId(value) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)
  ) {
    const error = new Error('无效的研讨会 ID');
    error.statusCode = 400;
    throw error;
  }
}

function seminarPath(seminarId) {
  assertSeminarId(seminarId);
  return path.join(SEMINAR_DIR, `${seminarId}.json`);
}

function createSeminar(participantIds, facilitatorId) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    sessionId: randomUUID(),
    participantIds,
    facilitatorId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function loadSeminar(seminarId) {
  const file = seminarPath(seminarId);
  if (!existsSync(file)) {
    const error = new Error('研讨会不存在');
    error.statusCode = 404;
    throw error;
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

function saveSeminar(seminar) {
  seminar.updatedAt = new Date().toISOString();
  const file = seminarPath(seminar.id);
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(seminar, null, 2), 'utf8');
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

function sseWrite(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function toolInteractionDetails(toolName, input) {
  if (toolName === 'Bash') {
    return {
      command: String(input.command || ''),
      description: String(input.description || ''),
    };
  }
  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'Read') {
    return {
      filePath: String(input.file_path || ''),
    };
  }
  return {};
}

function normalizedQuestions(input) {
  if (!Array.isArray(input.questions)) return [];
  return input.questions.slice(0, 4).map((question) => ({
    question: String(question.question || '').slice(0, 2_000),
    header: String(question.header || 'SELECT').slice(0, 24),
    multiSelect: Boolean(question.multiSelect),
    options: Array.isArray(question.options)
      ? question.options.slice(0, 4).map((option) => ({
          label: String(option.label || '').slice(0, 200),
          description: String(option.description || '').slice(0, 1_000),
        }))
      : [],
  })).filter((question) => question.question && question.options.length);
}

function cancelPendingInteractions(requestKey, reason = '请求已取消') {
  for (const interaction of pendingInteractions.values()) {
    if (interaction.requestKey !== requestKey) continue;
    interaction.finish({
      behavior: 'deny',
      message: reason,
      interrupt: true,
    });
  }
}

function waitForInteraction({
  requestKey,
  persona,
  toolName,
  input,
  options,
  res,
}) {
  const id = randomUUID();
  const kind = toolName === 'AskUserQuestion' ? 'question' : 'permission';
  const questions = kind === 'question' ? normalizedQuestions(input) : [];
  const title = kind === 'question'
    ? (questions[0]?.question || '需要你的选择')
    : String(
        options.title ||
        options.displayName ||
        `${persona.name} 请求使用 ${toolName}`,
      );

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      options.signal.removeEventListener('abort', onAbort);
      pendingInteractions.delete(id);
      resolve(result);
    };
    const onAbort = () => finish({
      behavior: 'deny',
      message: '请求已取消',
      interrupt: true,
    });

    if (options.signal.aborted) {
      onAbort();
      return;
    }

    options.signal.addEventListener('abort', onAbort, { once: true });
    pendingInteractions.set(id, {
      id,
      requestKey,
      personaId: persona.id,
      kind,
      toolName,
      input,
      questions,
      suggestions: options.suggestions || [],
      res,
      finish,
    });

    sseWrite(res, 'interaction', {
      id,
      kind,
      personaId: persona.id,
      toolName,
      title,
      description: String(
        options.description ||
        options.decisionReason ||
        '',
      ),
      details: toolInteractionDetails(toolName, input),
      questions,
      choices: kind === 'permission'
        ? [
            {
              value: 'allow',
              label: 'YES',
              description: '允许执行这一次操作',
            },
            {
              value: 'deny',
              label: 'NO',
              description: '拒绝执行并让对方调整方案',
            },
          ]
        : [],
    });
  });
}

function answerInteraction(interaction, body) {
  if (interaction.kind === 'permission') {
    const decision = String(body.decision || '').toLowerCase();
    if (decision === 'allow') {
      return {
        behavior: 'allow',
        updatedInput: interaction.input,
      };
    }
    if (decision === 'deny') {
      return {
        behavior: 'deny',
        message: String(body.message || '用户拒绝了这项操作').slice(0, 1_000),
      };
    }
    const error = new Error('请选择允许或拒绝');
    error.statusCode = 400;
    throw error;
  }

  const submittedAnswers = (
    body.answers &&
    typeof body.answers === 'object' &&
    !Array.isArray(body.answers)
  ) ? body.answers : {};
  const answers = {};

  for (const question of interaction.questions) {
    const submitted = submittedAnswers[question.question];
    const allowedLabels = new Set(
      question.options.map((option) => option.label),
    );
    if (question.multiSelect) {
      const values = Array.isArray(submitted) ? submitted : [submitted];
      const selected = values
        .map((value) => String(value || ''))
        .filter((value) => allowedLabels.has(value));
      if (!selected.length) {
        const error = new Error(`请选择：${question.question}`);
        error.statusCode = 400;
        throw error;
      }
      answers[question.question] = selected;
    } else {
      const selected = String(submitted || '');
      if (!allowedLabels.has(selected)) {
        const error = new Error(`请选择：${question.question}`);
        error.statusCode = 400;
        throw error;
      }
      answers[question.question] = selected;
    }
  }

  return {
    behavior: 'allow',
    updatedInput: {
      ...interaction.input,
      questions: interaction.input.questions || [],
      answers,
    },
  };
}

function parseSDKMessage(message, state, res) {
  if (message.type === 'stream_event') {
    const delta = message.event?.delta;
    if (delta?.type === 'text_delta' && delta.text) {
      state.fullText += delta.text;
      state.receivedDeltas = true;
      sseWrite(res, 'chunk', { text: delta.text });
    }
    return;
  }

  if (message.type === 'assistant' && !state.receivedDeltas) {
    const text = Array.isArray(message.message?.content)
      ? message.message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
      : '';
    if (text) state.assistantText = text;
    if (message.session_id) state.sessionId = message.session_id;
    return;
  }

  if (message.type === 'result') {
    state.resultText = typeof message.result === 'string' ? message.result : '';
    if (message.session_id) state.sessionId = message.session_id;
    if (message.is_error || message.subtype?.includes('error')) {
      state.resultError = state.resultText || 'Claude Code 返回错误';
    }
  }
}

async function callClaude({
  persona,
  transcript,
  message,
  res,
  requestKey = persona.id,
}) {
  const abortController = new AbortController();
  const state = {
    fullText: '',
    assistantText: '',
    resultText: '',
    resultError: '',
    receivedDeltas: false,
    sessionId: transcript.sessionId,
  };
  const abort = () => {
    abortController.abort();
    cancelPendingInteractions(requestKey);
  };
  const onResponseClose = () => {
    if (!res.writableEnded) abort();
  };
  activeRequests.set(requestKey, { abort });
  res.on('close', onResponseClose);

  const hasExistingConversation = transcript.messages.some(
    (item) => item.sender === 'ai',
  );
  const effort = ['low', 'medium', 'high', 'max'].includes(
    process.env.CLAUDE_CODE_EFFORT_LEVEL,
  )
    ? process.env.CLAUDE_CODE_EFFORT_LEVEL
    : 'max';

  try {
    const agentQuery = query({
      prompt: `${persona.trigger} ${message}`,
      options: {
        abortController,
        cwd: PERSONA_HOME,
        pathToClaudeCodeExecutable: claudeExecutable(),
        env: {
          ...process.env,
          CLAUDE_AGENT_SDK_CLIENT_APP: 'ship-of-theseus',
        },
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        settingSources: ['project'],
        tools: [
          'Read',
          'Write',
          'Edit',
          'Glob',
          'Grep',
          'Bash',
          'AskUserQuestion',
        ],
        allowedTools: ['Read', 'Glob', 'Grep'],
        disallowedTools: ['WebFetch', 'WebSearch'],
        permissionMode: 'acceptEdits',
        includePartialMessages: true,
        effort,
        hooks: {
          PreToolUse: [{
            matcher: 'Bash',
            hooks: [async () => ({
              hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'ask',
                permissionDecisionReason:
                  'Shell commands require explicit user confirmation in Theseus.',
              },
            })],
          }],
        },
        canUseTool: (toolName, input, options) => waitForInteraction({
          requestKey,
          persona,
          toolName,
          input,
          options,
          res,
        }),
        ...(hasExistingConversation
          ? { resume: transcript.sessionId }
          : { sessionId: transcript.sessionId }),
      },
    });

    for await (const sdkMessage of agentQuery) {
      parseSDKMessage(sdkMessage, state, res);
    }

    const finalText =
      state.fullText ||
      state.resultText ||
      state.assistantText;
    if (state.resultError) {
      return {
        error: `Claude Code 调用失败：${state.resultError}`,
        partialText: finalText,
      };
    }
    if (!finalText) {
      return { error: 'Claude Code 未返回任何回复' };
    }
    if (!state.receivedDeltas) sseWrite(res, 'chunk', { text: finalText });
    return { text: finalText, sessionId: state.sessionId };
  } catch (error) {
    const finalText = state.fullText || state.assistantText;
    if (abortController.signal.aborted) {
      return {
        error: 'Claude Code 请求已中断',
        partialText: finalText,
      };
    }
    return {
      error: `Claude Code 调用失败：${error.message}`,
      partialText: finalText,
    };
  } finally {
    res.off('close', onResponseClose);
    cancelPendingInteractions(requestKey, '请求已结束');
    activeRequests.delete(requestKey);
  }
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

function sendWorkspaceAsset(res, relativePath) {
  if (!relativePath || !PERSONA_HOME) {
    sendJson(res, 404, { error: '本地资源未配置' });
    return;
  }

  const workspaceRoot = path.resolve(PERSONA_HOME);
  const assetPath = path.resolve(workspaceRoot, relativePath);
  if (
    assetPath !== workspaceRoot &&
    !assetPath.startsWith(`${workspaceRoot}${path.sep}`)
  ) {
    const error = new Error('资源路径超出 Persona 工作区');
    error.statusCode = 403;
    throw error;
  }
  if (!existsSync(assetPath)) {
    sendJson(res, 404, { error: '本地资源不存在' });
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
    const error = new Error('不支持的本地资源格式');
    error.statusCode = 415;
    throw error;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(readFileSync(assetPath));
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

  if (req.method === 'GET' && url.pathname === '/profile') {
    const profile = readWorkspaceProfile();
    const userHalfPortrait = halfPortraitPath(profile.userAvatar);
    sendJson(res, 200, {
      facilitatorId: profile.facilitatorId,
      hasUserAvatar: Boolean(profile.userAvatar),
      hasUserHalfPortrait: Boolean(
        userHalfPortrait &&
        existsSync(path.resolve(PERSONA_HOME, userHalfPortrait)),
      ),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/user-avatar') {
    sendWorkspaceAsset(res, readWorkspaceProfile().userAvatar);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/user-half') {
    sendWorkspaceAsset(
      res,
      halfPortraitPath(readWorkspaceProfile().userAvatar),
    );
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

    sendWorkspaceAsset(res, persona.avatar);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/persona-half') {
    const personaId = (url.searchParams.get('personaId') || '').toLowerCase();
    const persona = readPersona(personaId);
    if (!persona.halfPortrait) {
      sendJson(res, 404, { error: '该角色未配置半身立绘' });
      return;
    }

    sendWorkspaceAsset(res, persona.halfPortrait);
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
    if (running) running.abort();
    const transcript = emptyTranscript(personaId);
    saveTranscript(transcript);
    sendJson(res, 200, {
      messages: publicMessages(transcript, persona),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/interaction/respond') {
    const body = await readJsonBody(req);
    const interactionId = String(body.interactionId || '');
    const interaction = pendingInteractions.get(interactionId);
    if (!interaction) {
      const error = new Error('该交互请求已结束或不存在');
      error.statusCode = 404;
      throw error;
    }

    const result = answerInteraction(interaction, body);
    sseWrite(interaction.res, 'interaction-resolved', {
      id: interaction.id,
    });
    interaction.finish(result);
    sendJson(res, 200, { accepted: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/seminar') {
    const seminarId = url.searchParams.get('seminarId') || '';
    const seminar = loadSeminar(seminarId);
    sendJson(res, 200, {
      seminar: {
        id: seminar.id,
        participantIds: seminar.participantIds,
        facilitatorId: seminar.facilitatorId,
      },
      messages: seminar.messages,
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/seminar/start') {
    const body = await readJsonBody(req);
    const workspaceProfile = readWorkspaceProfile();
    const facilitatorId = workspaceProfile.facilitatorId;
    assertPersonaId(facilitatorId);

    const requestedIds = Array.isArray(body.participantIds)
      ? body.participantIds.map((id) => String(id).toLowerCase())
      : [];
    const participantIds = [...new Set([facilitatorId, ...requestedIds])];
    participantIds.forEach(assertPersonaId);
    if (participantIds.length < 2) {
      const error = new Error('研讨会至少需要主持人和一位参会角色');
      error.statusCode = 400;
      throw error;
    }

    const seminar = createSeminar(participantIds, facilitatorId);
    saveSeminar(seminar);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    sseWrite(res, 'connected', {
      seminarId: seminar.id,
      participantIds,
      facilitatorId,
    });

    const facilitator = readPersona(facilitatorId);
    const participantNames = participantIds
      .map((id) => readPersona(id).name)
      .join('、');
    const openingMessage =
      `现在开会，简述目前状态、参会人员：${participantNames}`;
    const requestKey = `seminar:${seminar.id}`;
    const result = await callClaude({
      persona: facilitator,
      transcript: seminar,
      message: openingMessage,
      res,
      requestKey,
    });

    if (result.error) {
      sseWrite(res, 'error', { message: result.error });
      res.end();
      return;
    }

    seminar.sessionId = result.sessionId || seminar.sessionId;
    seminar.messages.push({
      id: randomUUID(),
      sender: 'ai',
      personaId: facilitatorId,
      text: result.text,
      createdAt: new Date().toISOString(),
    });
    saveSeminar(seminar);
    sseWrite(res, 'done', {
      fullText: result.text,
      personaId: facilitatorId,
      seminarId: seminar.id,
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/seminar/chat') {
    const body = await readJsonBody(req);
    const seminarId = String(body.seminarId || '');
    const personaId = String(body.personaId || '').toLowerCase();
    const message = String(body.message || '').trim();
    const seminar = loadSeminar(seminarId);

    assertPersonaId(personaId);
    if (!seminar.participantIds.includes(personaId)) {
      const error = new Error('该角色不是本次研讨会参会人员');
      error.statusCode = 403;
      throw error;
    }
    if (!message) {
      const error = new Error('消息不能为空');
      error.statusCode = 400;
      throw error;
    }
    if (message.length > 20_000) {
      const error = new Error('消息不能超过 20000 个字符');
      error.statusCode = 400;
      throw error;
    }
    const requestKey = `seminar:${seminar.id}`;
    if (activeRequests.has(requestKey)) {
      const error = new Error('研讨会正在发言，请稍候');
      error.statusCode = 409;
      throw error;
    }

    seminar.messages.push({
      id: randomUUID(),
      sender: 'user',
      targetPersonaId: personaId,
      text: message,
      createdAt: new Date().toISOString(),
    });
    saveSeminar(seminar);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    sseWrite(res, 'connected', {
      seminarId: seminar.id,
      personaId,
    });

    const persona = readPersona(personaId);
    const result = await callClaude({
      persona,
      transcript: seminar,
      message,
      res,
      requestKey,
    });
    if (result.error) {
      sseWrite(res, 'error', { message: result.error });
      res.end();
      return;
    }

    seminar.sessionId = result.sessionId || seminar.sessionId;
    seminar.messages.push({
      id: randomUUID(),
      sender: 'ai',
      personaId,
      text: result.text,
      createdAt: new Date().toISOString(),
    });
    saveSeminar(seminar);
    sseWrite(res, 'done', {
      fullText: result.text,
      personaId,
      seminarId: seminar.id,
    });
    res.end();
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
