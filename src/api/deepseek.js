/**
 * ⚡ DeepSeek API 原生流式 Fetch 控流器
 * 忒修斯之船 (Ship of Theseus) — 利用 ReadableStream 实现毫秒级流式响应
 */

import { API_CONFIG } from '../config/constants';

/**
 * 向 DeepSeek API 发起流式聊天请求
 *
 * @param {Object} options
 * @param {string} options.apiKey - DeepSeek API Key
 * @param {Array<{role: string, content: string}>} options.messages - 消息数组
 * @param {(chunkText: string) => void} options.onChunk - 每收到一个文本块时回调
 * @param {(fullText: string) => void} options.onDone - 流结束时回调
 * @param {(error: Error) => void} options.onError - 出错时回调
 * @param {AbortSignal} [options.signal] - 可选的 AbortSignal 用于取消请求
 * @returns {Promise<void>}
 */
export async function streamDeepSeek({
  apiKey,
  messages,
  onChunk,
  onDone,
  onError,
  signal,
}) {
  let fullText = '';

  try {
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        messages,
        stream: true,
        temperature: API_CONFIG.TEMPERATURE,
        max_tokens: API_CONFIG.MAX_TOKENS,
      }),
      signal,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '无法读取错误响应';
      }
      const statusCode = response.status;

      if (statusCode === 401) {
        throw new Error('API Key 无效，请检查后重试');
      } else if (statusCode === 429) {
        throw new Error('请求过于频繁，请稍后重试');
      } else if (statusCode === 402) {
        throw new Error('API 余额不足，请充值后重试');
      } else {
        throw new Error(`API 请求失败 (${statusCode}): ${errorBody}`);
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // 最后一行可能不完整，保留到下次处理
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // 忽略无法解析的行（可能是注释或格式异常）
        }
      }
    }

    onDone(fullText);
  } catch (error) {
    if (error.name === 'AbortError') {
      onError(new Error('请求已取消'));
    } else {
      onError(error);
    }
  }
}

/**
 * 非流式版本：单次请求获取完整回复（用于简单场景）
 */
export async function chatDeepSeek({ apiKey, messages, signal }) {
  const response = await fetch(API_CONFIG.BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: API_CONFIG.MODEL,
      messages,
      stream: false,
      temperature: API_CONFIG.TEMPERATURE,
      max_tokens: API_CONFIG.MAX_TOKENS,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
