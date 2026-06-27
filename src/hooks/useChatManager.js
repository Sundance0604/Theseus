import { useState, useEffect, useRef, useCallback } from 'react';
import { streamDeepSeek } from '../api/deepseek';
import { buildSystemPrompt, buildMessages, buildWelcomeMessage } from '../api/promptTemplates';
import { STORAGE_KEYS } from '../config/constants';

/**
 * 1v1 对话控制中心
 * 调度 DeepSeek API、管理流式响应、控制本地对话历史
 */
export const useChatManager = () => {
  const [partReplacement, setPartReplacement] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  });

  const [activePersonaId, setActivePersonaId] = useState(null);

  const abortControllerRef = useRef(null);
  const streamingTextRef = useRef('');

  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const welcome = buildWelcomeMessage(activePersonaId);
    setChatHistory([{ sender: 'ai', text: welcome }]);
  }, [activePersonaId]);

  const sendMessage = useCallback(
    (userText) => {
      if (!userText.trim() || isStreaming) return;
      if (!apiKey) {
        setError('请先设置 DeepSeek API Key');
        return;
      }

      clearError();

      const nextReplacement = Math.min(partReplacement + 10, 100);
      setPartReplacement(nextReplacement);

      setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);

      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: '', isStreaming: true },
      ]);
      setIsStreaming(true);
      streamingTextRef.current = '';

      const systemPrompt = buildSystemPrompt(activePersonaId);
      const apiMessages = buildMessages(
        [...chatHistory, { sender: 'user', text: userText }],
        systemPrompt
      );

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      streamDeepSeek({
        apiKey,
        messages: apiMessages,
        signal: abortController.signal,
        onChunk: (chunkText) => {
          streamingTextRef.current += chunkText;
          setChatHistory((prev) => {
            const updated = [...prev];
            const targetIndex = updated.length - 1;
            if (targetIndex >= 0 && updated[targetIndex].sender === 'ai') {
              updated[targetIndex] = {
                ...updated[targetIndex],
                text: streamingTextRef.current,
              };
            }
            return updated;
          });
        },
        onDone: (fullText) => {
          setChatHistory((prev) => {
            const updated = [...prev];
            const targetIndex = updated.length - 1;
            if (targetIndex >= 0 && updated[targetIndex].sender === 'ai') {
              updated[targetIndex] = {
                sender: 'ai',
                text: fullText || streamingTextRef.current,
                isStreaming: false,
              };
            }
            return updated;
          });
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          setError(err.message);
          setChatHistory((prev) => {
            const updated = [...prev];
            const targetIndex = updated.length - 1;
            if (
              targetIndex >= 0 &&
              updated[targetIndex].sender === 'ai' &&
              updated[targetIndex].isStreaming
            ) {
              updated[targetIndex] = {
                sender: 'ai',
                text: '通信故障: ' + err.message,
                isStreaming: false,
                isError: true,
              };
            }
            return updated;
          });
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
      });
    },
    [apiKey, chatHistory, isStreaming, partReplacement, activePersonaId, clearError]
  );

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearHistory = useCallback(() => {
    cancelStreaming();
    const welcome = buildWelcomeMessage(activePersonaId);
    setChatHistory([{ sender: 'ai', text: welcome }]);
    setPartReplacement(0);
    setError(null);
  }, [activePersonaId, cancelStreaming]);

  return {
    chatHistory,
    partReplacement,
    isStreaming,
    error,
    apiKey,
    activePersonaId,
    sendMessage,
    setApiKey,
    setActivePersonaId,
    cancelStreaming,
    clearHistory,
    clearError,
  };
};