/**
 * ⚓ 忒修斯之船 — Claude 桥接客户端
 *
 * 职责：通过 HTTP POST + SSE (Server-Sent Events) 与本地桥接服务器通信，
 * 将用户消息转发给 Claude CLI 并流式回传结果。
 *
 * 前端不需要任何 API Key，所有 AI 能力由本地 Claude Code 处理。
 */

/** 桥接服务器地址 */
const BRIDGE_URL = 'http://localhost:3099';

/**
 * 向 Claude 发送消息并流式接收回复
 *
 * @param {Object} options
 * @param {string} options.personaId - 角色 ID（如 'valse', 'noodles'），可选
 * @param {string} options.message - 用户发送的消息文本
 * @param {(chunkText: string) => void} options.onChunk - 每收到一个文本块时回调
 * @param {(fullText: string) => void} options.onDone - 流结束时回调
 * @param {(error: Error) => void} options.onError - 出错时回调
 * @param {AbortSignal} [options.signal] - 可选的 AbortSignal 用于取消请求
 * @returns {Promise<void>}
 */
export async function streamClaude({
  personaId,
  message,
  onChunk,
  onDone,
  onError,
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
    const response = await fetch(`${BRIDGE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personaId: personaId || null,
        message,
      }),
      signal,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = `HTTP ${response.status}`;
      }
      throw new Error(`桥接服务器返回错误 (${response.status}): ${errorBody}`);
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
              // 连接确认，无需处理
              break;

            case 'chunk':
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
              }
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
        '无法连接到桥接服务器 (localhost:3099)。\n' +
        '请先在终端运行: node bridge-server/server.js'
      ));
    } else {
      onError(error);
    }
  }
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
    return response.ok;
  } catch {
    return false;
  }
}
