import { useState, useEffect, useRef, useCallback } from 'react';
import {
  checkBridgeHealth,
  clearLocalHistory,
  getLocalHistory,
  getLocalPersonas,
  getLocalProfile,
  respondToLocalInteraction,
  startLocalSeminar,
  streamClaude,
  streamLocalSeminarMessage,
} from '../api/claudeBridge';

export const useChatManager = () => {
  const [partReplacement, setPartReplacement] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [userProfile, setUserProfile] = useState({ avatarUrl: '' });
  const [activePersonaId, setActivePersonaIdState] = useState(null);
  const [seminar, setSeminar] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localService, setLocalService] = useState(null);
  const [error, setError] = useState(null);
  const [interactions, setInteractions] = useState([]);

  const abortControllerRef = useRef(null);
  const streamingTextRef = useRef('');
  const activePersonaRef = useRef(null);
  const seminarRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);
  const onInteraction = useCallback((interaction) => {
    setInteractions((current) => (
      current.some((item) => item.id === interaction.id)
        ? current
        : [...current, interaction]
    ));
  }, []);
  const onInteractionResolved = useCallback(({ id }) => {
    setInteractions((current) => current.filter((item) => item.id !== id));
  }, []);

  const refreshLocalService = useCallback(async () => {
    const health = await checkBridgeHealth();
    setLocalService(health);
    if (!health) {
      setError('本地 AI 运行层尚未就绪，请确认 npm run dev 正在运行');
      return false;
    }
    try {
      const [loadedPersonas, loadedProfile] = await Promise.all([
        getLocalPersonas(),
        getLocalProfile(),
      ]);
      setPersonas(loadedPersonas);
      setUserProfile(loadedProfile);
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

  const cancelStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setInteractions([]);
  }, []);

  const respondToInteraction = useCallback(async ({
    interactionId,
    decision,
    answers,
    message,
  }) => {
    try {
      await respondToLocalInteraction({
        interactionId,
        decision,
        answers,
        message,
      });
    } catch (interactionError) {
      setError(interactionError.message);
      throw interactionError;
    }
  }, []);

  const updateStreamingMessage = useCallback((text, personaId, extra = {}) => {
    setChatHistory((previous) => {
      const updated = [...previous];
      const targetIndex = updated.length - 1;
      if (updated[targetIndex]?.isStreaming) {
        updated[targetIndex] = {
          ...updated[targetIndex],
          text,
          personaId,
          ...extra,
        };
      }
      return updated;
    });
  }, []);

  const setActivePersonaId = useCallback(async (personaId) => {
    cancelStreaming();
    seminarRef.current = null;
    setSeminar(null);

    if (!personaId) {
      activePersonaRef.current = null;
      setActivePersonaIdState(null);
      setChatHistory([]);
      setPartReplacement(0);
      return;
    }

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
      }
    } finally {
      if (activePersonaRef.current === personaId) setIsLoadingHistory(false);
    }
  }, [cancelStreaming]);

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
        personaId,
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
      onInteraction,
      onInteractionResolved,
      onChunk: (chunkText) => {
        streamingTextRef.current += chunkText;
        updateStreamingMessage(streamingTextRef.current, personaId);
      },
      onDone: (fullText) => {
        updateStreamingMessage(
          fullText || streamingTextRef.current,
          personaId,
          { isStreaming: false },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
      onError: (streamError) => {
        setError(streamError.message);
        updateStreamingMessage(
          `通信故障：${streamError.message}`,
          personaId,
          { isStreaming: false, isError: true },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
    });
  }, [
    clearError,
    isStreaming,
    onInteraction,
    onInteractionResolved,
    updateStreamingMessage,
  ]);

  const startWarRoom = useCallback((requestedParticipantIds) => {
    if (isStreaming) return;
    const facilitator = personas.find((persona) => persona.isFacilitator);
    if (!facilitator) {
      setError('私人配置中没有设置研讨会主持人');
      return;
    }

    const participantIds = [
      ...new Set([facilitator.id, ...(requestedParticipantIds || [])]),
    ];
    if (participantIds.length < 2) {
      setError('请至少选择一位主持人之外的参会角色');
      return;
    }

    cancelStreaming();
    activePersonaRef.current = null;
    setActivePersonaIdState(null);
    const pendingSeminar = {
      id: null,
      participantIds,
      facilitatorId: facilitator.id,
    };
    seminarRef.current = pendingSeminar;
    setSeminar(pendingSeminar);
    setChatHistory([{
      id: `seminar-opening-${Date.now()}`,
      sender: 'ai',
      personaId: facilitator.id,
      text: '',
      isStreaming: true,
    }]);
    setPartReplacement(0);
    setError(null);
    setIsStreaming(true);
    streamingTextRef.current = '';

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    startLocalSeminar({
      participantIds,
      signal: abortController.signal,
      onInteraction,
      onInteractionResolved,
      onConnected: (connection) => {
        const connectedSeminar = {
          id: connection.seminarId,
          participantIds: connection.participantIds,
          facilitatorId: connection.facilitatorId,
        };
        seminarRef.current = connectedSeminar;
        setSeminar(connectedSeminar);
      },
      onChunk: (chunkText) => {
        streamingTextRef.current += chunkText;
        updateStreamingMessage(streamingTextRef.current, facilitator.id);
      },
      onDone: (fullText) => {
        updateStreamingMessage(
          fullText || streamingTextRef.current,
          facilitator.id,
          { isStreaming: false },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
      onError: (streamError) => {
        setError(streamError.message);
        updateStreamingMessage(
          `开会失败：${streamError.message}`,
          facilitator.id,
          { isStreaming: false, isError: true },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
    });
  }, [
    cancelStreaming,
    isStreaming,
    onInteraction,
    onInteractionResolved,
    personas,
    updateStreamingMessage,
  ]);

  const sendSeminarMessage = useCallback((userText, personaId) => {
    const currentSeminar = seminarRef.current;
    if (!userText.trim() || isStreaming) return;
    if (!currentSeminar?.id) {
      setError('研讨会尚未完成初始化');
      return;
    }
    if (!currentSeminar.participantIds.includes(personaId)) {
      setError('请选择本次研讨会中的发言角色');
      return;
    }

    clearError();
    setPartReplacement((current) => Math.min(current + 10, 100));
    setChatHistory((previous) => [
      ...previous,
      {
        id: `seminar-user-${Date.now()}`,
        sender: 'user',
        targetPersonaId: personaId,
        text: userText,
      },
      {
        id: `seminar-ai-${Date.now()}`,
        sender: 'ai',
        personaId,
        text: '',
        isStreaming: true,
      },
    ]);
    setIsStreaming(true);
    streamingTextRef.current = '';

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamLocalSeminarMessage({
      seminarId: currentSeminar.id,
      personaId,
      message: userText,
      signal: abortController.signal,
      onInteraction,
      onInteractionResolved,
      onChunk: (chunkText) => {
        streamingTextRef.current += chunkText;
        updateStreamingMessage(streamingTextRef.current, personaId);
      },
      onDone: (fullText) => {
        updateStreamingMessage(
          fullText || streamingTextRef.current,
          personaId,
          { isStreaming: false },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
      onError: (streamError) => {
        setError(streamError.message);
        updateStreamingMessage(
          `发言失败：${streamError.message}`,
          personaId,
          { isStreaming: false, isError: true },
        );
        setIsStreaming(false);
        setInteractions([]);
        abortControllerRef.current = null;
      },
    });
  }, [
    clearError,
    isStreaming,
    onInteraction,
    onInteractionResolved,
    updateStreamingMessage,
  ]);

  const clearHistory = useCallback(async () => {
    const currentSeminar = seminarRef.current;
    if (currentSeminar) {
      startWarRoom(currentSeminar.participantIds);
      return;
    }

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
  }, [cancelStreaming, startWarRoom]);

  const activePersona =
    personas.find((persona) => persona.id === activePersonaId) || null;

  return {
    chatHistory,
    partReplacement,
    personas,
    userProfile,
    activePersona,
    activePersonaId,
    seminar,
    isStreaming,
    isLoadingHistory,
    localService,
    error,
    interactions,
    sendMessage,
    sendSeminarMessage,
    startWarRoom,
    respondToInteraction,
    setActivePersonaId,
    cancelStreaming,
    clearHistory,
    clearError,
    refreshLocalService,
  };
};
