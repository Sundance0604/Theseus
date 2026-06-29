/**
 * ⚓ 忒修斯之船 — Claude 桥接客户端
 *
 * 职责：通过 HTTP POST + SSE (Server-Sent Events) 与本地桥接服务器通信，
 * 将用户消息转发给 Claude CLI 并流式回传结果。
 *
 * 前端不需要任何 API Key，所有 AI 能力由本地 Claude Code 处理。
 */

/** 本地 AI 服务地址。可在 .env.local 中用 VITE_LOCAL_AI_URL 覆盖。 */
const BRIDGE_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://127.0.0.1:3099';

async function readErrorResponse(response) {
  try {
    const text = await response.text();
    try {
      const body = JSON.parse(text);
      return body.error || text;
    } catch {
      return text;
    }
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function getLocalPersonas() {
  const response = await fetch(`${BRIDGE_URL}/personas`);
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const body = await response.json();
  return (body.personas || []).map((persona) => ({
    ...persona,
    avatarUrl: persona.hasAvatar
      ? `${BRIDGE_URL}/persona-asset?personaId=${encodeURIComponent(persona.id)}`
      : '',
    halfPortraitUrl: persona.hasHalfPortrait
      ? `${BRIDGE_URL}/persona-half?personaId=${encodeURIComponent(persona.id)}`
      : '',
  }));
}

export async function getLocalHistory(personaId) {
  const response = await fetch(
    `${BRIDGE_URL}/history?personaId=${encodeURIComponent(personaId)}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}

export async function getLocalProfile() {
  const response = await fetch(`${BRIDGE_URL}/profile`);
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const profile = await response.json();
  return {
    ...profile,
    avatarUrl: profile.hasUserAvatar ? `${BRIDGE_URL}/user-avatar` : '',
    halfPortraitUrl: profile.hasUserHalfPortrait
      ? `${BRIDGE_URL}/user-half`
      : '',
  };
}

export async function clearLocalHistory(personaId) {
  const response = await fetch(
    `${BRIDGE_URL}/history?personaId=${encodeURIComponent(personaId)}`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}

/**
 * 向 Claude 发送消息并流式接收回复
 *
 * @param {Object} options
 * @param {string} options.personaId - 本地角色 ID
 * @param {string} options.message - 用户发送的消息文本
 * @param {(chunkText: string) => void} options.onChunk - 每收到一个文本块时回调
 * @param {(fullText: string) => void} options.onDone - 流结束时回调
 * @param {(error: Error) => void} options.onError - 出错时回调
 * @param {AbortSignal} [options.signal] - 可选的 AbortSignal 用于取消请求
 * @returns {Promise<void>}
 */
async function streamRequest({
  requestPath,
  requestBody,
  onChunk,
  onDone,
  onError,
  onConnected,
  onInteraction,
  onInteractionResolved,
  signal,
}) {
  let fullText = '';
  let aborted = false;

  // 监听取消信号
  if (signal) {
    signal.addEventListener('abort', () => {
      aborted = true;
    });
  }

  try {
    const response = await fetch(`${BRIDGE_URL}${requestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorBody = await readErrorResponse(response);
      throw new Error(`本地 AI 服务返回错误 (${response.status}): ${errorBody}`);
    }

    // 读取 SSE 流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (aborted) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 事件按双换行分隔
      const events = buffer.split('\n\n');
      // 保留最后一个可能不完整的事件
      buffer = events.pop() || '';

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue;

        const lines = eventBlock.split('\n');
        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim();
          }
        }

        if (!eventType || !eventData) continue;

        try {
          const parsed = JSON.parse(eventData);

          switch (eventType) {
            case 'connected':
              onConnected?.(parsed);
              break;

            case 'chunk':
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
              }
              break;

            case 'interaction':
              onInteraction?.(parsed);
              break;

            case 'interaction-resolved':
              onInteractionResolved?.(parsed);
              break;

            case 'done':
              // 流正常结束
              onDone(parsed.fullText || fullText);
              return;

            case 'error':
              // 桥接服务器返回错误
              const errMsg = parsed.message || '未知桥接错误';
              // 如果已经有部分文本，完成并附带错误
              if (fullText) {
                onDone(fullText + '\n\n[⚠️ ' + errMsg + ']');
              } else {
                onError(new Error(errMsg));
              }
              return;
          }
        } catch {
          // 忽略无法解析的事件
        }
      }
    }

    // 如果流意外结束但有部分内容
    if (fullText) {
      onDone(fullText);
    } else {
      onError(new Error('Claude 未返回任何回复'));
    }
  } catch (error) {
    if (aborted || error.name === 'AbortError') {
      // 用户取消，不计为错误
      if (fullText) {
        onDone(fullText + ' [已中断]');
      }
      return;
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      onError(new Error(
        '本地 AI 运行层尚未就绪。请确认 npm run dev 正在运行，然后重试。'
      ));
    } else {
      onError(error);
    }
  }
}

export async function respondToLocalInteraction({
  interactionId,
  decision,
  answers,
  message,
}) {
  const response = await fetch(`${BRIDGE_URL}/interaction/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      interactionId,
      decision,
      answers,
      message,
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}

export function streamClaude({ personaId, message, ...callbacks }) {
  return streamRequest({
    requestPath: '/chat',
    requestBody: {
      personaId: personaId || null,
      message,
    },
    ...callbacks,
  });
}

export function startLocalSeminar({ participantIds, ...callbacks }) {
  return streamRequest({
    requestPath: '/seminar/start',
    requestBody: { participantIds },
    ...callbacks,
  });
}

export function streamLocalSeminarMessage({
  seminarId,
  personaId,
  message,
  ...callbacks
}) {
  return streamRequest({
    requestPath: '/seminar/chat',
    requestBody: { seminarId, personaId, message },
    ...callbacks,
  });
}

/**
 * 检查桥接服务器是否在线
 * @returns {Promise<boolean>}
 */
export async function checkBridgeHealth() {
  try {
    const response = await fetch(`${BRIDGE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * 获取引擎室统计数据
 * @returns {Promise<{startups: number, projectSessions: Object, projectMessages: Object, totalUserMessages: number}>}
 */
export async function getEngineRoomStats() {
  const response = await fetch(`${BRIDGE_URL}/api/engine-room/stats`);
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  return response.json();
}
