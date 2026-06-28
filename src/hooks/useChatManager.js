import { useState, useEffect, useRef, useCallback } from 'react';
import {
  checkBridgeHealth,
  clearLocalHistory,
  getLocalHistory,
  getLocalPersonas,
  streamClaude,
} from '../api/claudeBridge';

/**
 * Thin presentation controller.
 * Persona documents, model sessions and transcripts all live in the local
 * service; React only mirrors the current UI state.
 */
export const useChatManager = () => {
  const [partReplacement, setPartReplacement] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [activePersonaId, setActivePersonaIdState] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localService, setLocalService] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const streamingTextRef = useRef('');
  const activePersonaRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshLocalService = useCallback(async () => {
    const health = await checkBridgeHealth();
    setLocalService(health);
    if (!health) {
      setError('本地 AI 运行层尚未就绪，请确认 npm run dev 正在运行');
      return false;
    }
    try {
      const loadedPersonas = await getLocalPersonas();
      setPersonas(loadedPersonas);
      setError(null);
    } catch (loadError) {
      setError(loadError.message);
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const connect = async () => {
      const connected = await refreshLocalService();
      if (!connected && !cancelled) {
        retryTimer = window.setTimeout(connect, 1500);
      }
    };

    connect();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [refreshLocalService]);

  const setActivePersonaId = useCallback(async (personaId) => {
    if (!personaId) return;
    activePersonaRef.current = personaId;
    setActivePersonaIdState(personaId);
    setIsLoadingHistory(true);
    setError(null);

    try {
      const result = await getLocalHistory(personaId);
      if (activePersonaRef.current === personaId) {
        setChatHistory(result.messages || []);
        const completedTurns = (result.messages || []).filter(
          (message) => message.sender === 'user',
        ).length;
        setPartReplacement(Math.min(completedTurns * 10, 100));
      }
    } catch (loadError) {
      if (activePersonaRef.current === personaId) {
        setChatHistory([]);
        setError(loadError.message);
        setLocalService(null);
      }
    } finally {
      if (activePersonaRef.current === personaId) setIsLoadingHistory(false);
    }
  }, []);

  const sendMessage = useCallback((userText) => {
    const personaId = activePersonaRef.current;
    if (!userText.trim() || isStreaming) return;
    if (!personaId) {
      setError('请先从船员舱选择一位角色');
      return;
    }

    clearError();
    setPartReplacement((current) => Math.min(current + 10, 100));
    setChatHistory((previous) => [
      ...previous.filter((message) => !message.isWelcome),
      {
        id: `local-user-${Date.now()}`,
        sender: 'user',
        text: userText,
      },
      {
        id: `local-ai-${Date.now()}`,
        sender: 'ai',
        text: '',
        isStreaming: true,
      },
    ]);
    setIsStreaming(true);
    streamingTextRef.current = '';

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    streamClaude({
      personaId,
      message: userText,
      signal: abortController.signal,
      onChunk: (chunkText) => {
        streamingTextRef.current += chunkText;
        setChatHistory((previous) => {
          const updated = [...previous];
          const targetIndex = updated.length - 1;
          if (updated[targetIndex]?.isStreaming) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              text: streamingTextRef.current,
            };
          }
          return updated;
        });
      },
      onDone: (fullText) => {
        setChatHistory((previous) => {
          const updated = [...previous];
          const targetIndex = updated.length - 1;
          if (updated[targetIndex]?.sender === 'ai') {
            updated[targetIndex] = {
              ...updated[targetIndex],
              text: fullText || streamingTextRef.current,
              isStreaming: false,
            };
          }
          return updated;
        });
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      onError: (streamError) => {
        setError(streamError.message);
        setChatHistory((previous) => {
          const updated = [...previous];
          const targetIndex = updated.length - 1;
          if (updated[targetIndex]?.isStreaming) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              text: `通信故障：${streamError.message}`,
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
  }, [clearError, isStreaming]);

  const cancelStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const clearHistory = useCallback(async () => {
    const personaId = activePersonaRef.current;
    if (!personaId) return;
    cancelStreaming();
    try {
      const result = await clearLocalHistory(personaId);
      setChatHistory(result.messages || []);
      setPartReplacement(0);
      setError(null);
    } catch (clearHistoryError) {
      setError(clearHistoryError.message);
    }
  }, [cancelStreaming]);

  const activePersona =
    personas.find((persona) => persona.id === activePersonaId) || null;

  return {
    chatHistory,
    partReplacement,
    personas,
    activePersona,
    activePersonaId,
    isStreaming,
    isLoadingHistory,
    localService,
    error,
    sendMessage,
    setActivePersonaId,
    cancelStreaming,
    clearHistory,
    clearError,
    refreshLocalService,
  };
};
