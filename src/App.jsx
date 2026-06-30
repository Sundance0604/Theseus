import React, { useState } from 'react';
import { useChatManager } from './hooks/useChatManager';
import { GameBackground } from './components/GameBackground';
import { AiDialogueStream } from './components/AiDialogueStream';
import { UserInputPanel } from './components/UserInputPanel';
import { PersonaInteractionOverlay } from './components/PersonaInteractionOverlay';
import { ShipPanorama } from './scenes/ShipPanorama';
import { EngineRoomScene } from './scenes/EngineRoom';
import { MemoryRoomScene } from './scenes/MemoryRoom';
import { ArchiveRoomScene } from './scenes/ArchiveRoom';
import { COLORS } from './config/constants';

const INTERACTION_PREVIEW = {
  id: 'development-interaction-preview',
  kind: 'permission',
  personaId: '',
  toolName: 'Bash',
  title: 'Bash',
  description: '查看工作区文件变更摘要',
  details: { command: 'git status --short' },
  questions: [],
  choices: [
    { value: 'allow', label: '同意执行', description: '允许这一次操作' },
    { value: 'deny', label: '拒绝执行', description: '让对方调整方案' },
  ],
};

function App() {
  const {
    chatHistory,
    partReplacement,
    personas,
    userProfile,
    activePersona,
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
  } = useChatManager();

  const interactionPreviewEnabled = (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('preview') === 'interaction'
  );
  // scene: 'launch' | 'dialogue'
  const [scene, setScene] = useState(
    interactionPreviewEnabled ? 'dialogue' : 'launch',
  );
  // 从对话返回时直接跳到 NAVIGATION 界面
  const [backToNav, setBackToNav] = useState(false);

  // WAR ROOM 多人对话模式
  const [dialogueMode, setDialogueMode] = useState('single'); // 'single' | 'warRoom'
  const [warRoomPersonaIds, setWarRoomPersonaIds] = useState([]);
  const [warRoomSpeakerId, setWarRoomSpeakerId] = useState(null);

  const warRoomPersonas = personas.filter(p => warRoomPersonaIds.includes(p.id));
  const facilitator = personas.find(p => p.isFacilitator) || null;
  const sortedWarRoomPersonas = [...warRoomPersonas].sort((a, b) => {
    if (a.isFacilitator) return -1;
    if (b.isFacilitator) return 1;
    return 0;
  });
  const warRoomSpeaker = warRoomPersonas.find(p => p.id === warRoomSpeakerId)
    || facilitator;

  const isWarRoom = dialogueMode === 'warRoom';
  const activeInteraction = interactions[0] || (
    interactionPreviewEnabled ? INTERACTION_PREVIEW : null
  );
  const interactionPersona = activeInteraction
    ? (
        personas.find(persona => persona.id === activeInteraction.personaId) ||
        personas.find(persona => persona.halfPortraitUrl) ||
        personas[0]
      )
    : null;

  // 从启动画面进入单人对��
  const handleNavigateToDialogue = (personaId) => {
    if (personaId) {
      setActivePersonaId(personaId);
    }
    setDialogueMode('single');
    setScene('dialogue');
  };

  // WAR ROOM 多选确认 → 进入多人对话
  const handleNavigateToWarRoom = (selectedIds) => {
    const participantIds = [
      ...new Set([facilitator?.id, ...(selectedIds || [])].filter(Boolean)),
    ];
    setWarRoomPersonaIds(participantIds);
    setWarRoomSpeakerId(facilitator?.id || participantIds[0] || null);
    setDialogueMode('warRoom');
    setScene('dialogue');
    startWarRoom(participantIds);
  };

  // 返回 NAVIGATION 画面
  const handleBackToLaunch = () => {
    setBackToNav(true);
    setDialogueMode('single');
    setWarRoomPersonaIds([]);
    setWarRoomSpeakerId(null);
    setScene('launch');
  };

  // 引擎室跳转
  const handleNavigateToEngineRoom = () => {
    setScene('engineRoom');
  };

  // 从引擎室返回
  const handleBackFromEngineRoom = () => {
    setBackToNav(true);
    setScene('launch');
  };

  const handleNavigateToMemoryRoom = () => {
    setScene('memoryRoom');
  };

  const handleBackFromMemoryRoom = () => {
    setBackToNav(true);
    setScene('launch');
  };

  const handleNavigateToArchiveRoom = () => {
    setScene('archiveRoom');
  };

  const handleBackFromArchiveRoom = () => {
    setBackToNav(true);
    setScene('launch');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: COLORS.ANARCHY_BLACK,
    }}>

      {/* ============ 场景1: 船全景启动画面 ============ */}
      {scene === 'launch' && (
        <ShipPanorama
          personas={personas}
          onNavigateToDialogue={handleNavigateToDialogue}
          onNavigateToWarRoom={handleNavigateToWarRoom}
          onNavigateToEngineRoom={handleNavigateToEngineRoom}
          onNavigateToMemoryRoom={handleNavigateToMemoryRoom}
          onNavigateToArchiveRoom={handleNavigateToArchiveRoom}
          initialPhase={backToNav ? 'launched' : undefined}
        />
      )}

      {/* ============ 场景3: 引擎室 ============ */}
      {scene === 'engineRoom' && (
        <EngineRoomScene onBack={handleBackFromEngineRoom} />
      )}

      {scene === 'memoryRoom' && (
        <MemoryRoomScene
          personas={personas}
          userProfile={userProfile}
          onBack={handleBackFromMemoryRoom}
        />
      )}

      {scene === 'archiveRoom' && (
        <ArchiveRoomScene
          personas={personas}
          onBack={handleBackFromArchiveRoom}
        />
      )}

      {/* ============ 场景2: 对话界面 ============ */}
      {scene === 'dialogue' && (
        <>
          {/* Pixi.js 动态斜角背景层 — WAR ROOM 强制红色，单人对��跟角色色 */}
          <GameBackground
            partReplacement={partReplacement}
            activeColor={dialogueMode === 'warRoom' ? COLORS.ANARCHY_RED : activePersona?.color}
          />

          {/* 顶部工具栏 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 32px',
          }}>
            {/* 左侧：品牌标题 */}
            <div style={{
              backgroundColor: COLORS.ANARCHY_BLACK,
              border: `3px solid ${dialogueMode === 'warRoom' ? COLORS.ANARCHY_RED : COLORS.P5R_RED}`,
              transform: 'skewX(-12deg)',
              padding: '6px 24px',
              boxShadow: `6px 6px 0px ${COLORS.BLACK}`,
            }}>
              <h1 style={{
                margin: 0,
                color: COLORS.PAPER,
                fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '18px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                transform: 'skewX(12deg)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                Ship of Theseus
                {dialogueMode === 'warRoom' && (
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.ANARCHY_RED,
                    backgroundColor: COLORS.PAPER,
                    padding: '1px 8px',
                    letterSpacing: '2px',
                  }}>
                    WAR ROOM
                  </span>
                )}
              </h1>
            </div>

            {/* 右侧：状态指示器 + 操作按钮 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* 本地 AI 服务状态灯 */}
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                backgroundColor: localService
                  ? (isStreaming ? '#FFD700' : '#00E676')
                  : '#FF1744',
                boxShadow: localService
                  ? `0 0 8px ${isStreaming ? '#FFD700' : '#00E676'}`
                  : '0 0 8px #FF1744',
                border: `1px solid ${COLORS.ANARCHY_BLACK}`,
              }}
                title={localService
                  ? (isStreaming ? 'Claude Code 通信中...' : '本地 AI 服务就绪')
                  : '本地 AI 服务未连接'}
              />

              {/* 返回导航 */}
              <button onClick={handleBackToLaunch} style={{
                background: COLORS.ANARCHY_BLACK,
                border: `2px solid ${COLORS.PAPER}`,
                color: COLORS.PAPER,
                padding: '6px 16px',
                fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '12px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transform: 'skewX(-8deg)',
                boxShadow: `4px 4px 0px ${COLORS.BLACK}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = COLORS.PAPER;
                e.currentTarget.style.color = COLORS.BLACK;
                e.currentTarget.style.borderColor = COLORS.ANARCHY_RED;
                e.currentTarget.style.boxShadow = `4px 4px 0px ${COLORS.ANARCHY_RED}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = COLORS.ANARCHY_BLACK;
                e.currentTarget.style.color = COLORS.PAPER;
                e.currentTarget.style.borderColor = COLORS.PAPER;
                e.currentTarget.style.boxShadow = `4px 4px 0px ${COLORS.BLACK}`;
              }}>
                <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>← NAV</span>
              </button>

              {/* 重置对话 */}
              <button
                onClick={clearHistory}
                disabled={isStreaming}
                style={{
                background: isStreaming ? '#222' : COLORS.ANARCHY_BLACK,
                border: `2px solid ${isStreaming ? '#444' : COLORS.PAPER}`,
                color: isStreaming ? '#555' : COLORS.PAPER,
                padding: '6px 16px',
                fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '12px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: isStreaming ? 'not-allowed' : 'pointer',
                transform: 'skewX(-8deg)',
                boxShadow: isStreaming ? 'none' : `4px 4px 0px ${COLORS.BLACK}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (isStreaming) return;
                e.currentTarget.style.background = COLORS.PAPER;
                e.currentTarget.style.color = COLORS.BLACK;
                e.currentTarget.style.borderColor = COLORS.ANARCHY_RED;
                e.currentTarget.style.boxShadow = `4px 4px 0px ${COLORS.ANARCHY_RED}`;
              }}
              onMouseLeave={e => {
                if (isStreaming) return;
                e.currentTarget.style.background = COLORS.ANARCHY_BLACK;
                e.currentTarget.style.color = COLORS.PAPER;
                e.currentTarget.style.borderColor = COLORS.PAPER;
                e.currentTarget.style.boxShadow = `4px 4px 0px ${COLORS.BLACK}`;
              }}>
                <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>RESET</span>
              </button>

            </div>
          </div>

          {/* 错误横幅 */}
          {error && (
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%) skewX(-6deg)',
              zIndex: 15,
              backgroundColor: COLORS.ANARCHY_RED,
              color: COLORS.PAPER,
              padding: '8px 28px',
              fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
              fontStyle: 'italic',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              border: `3px solid ${COLORS.PAPER}`,
              boxShadow: `8px 8px 0px ${COLORS.BLACK}`,
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }}>!! {error}</span>
              <button onClick={() => {
                clearError();
                refreshLocalService();
              }} style={{
                background: COLORS.PAPER,
                color: COLORS.BLACK,
                border: 'none',
                padding: '4px 12px',
                fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transform: 'skewX(6deg)',
              }}>
                <span style={{ display: 'inline-block', transform: 'skewX(-6deg)' }}>RETRY</span>
              </button>
            </div>
          )}

          {/* 流式传输指示器 */}
          {isStreaming && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '32px',
              zIndex: 15,
              color: '#FFD700',
              fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
              fontStyle: 'italic',
              fontWeight: '900',
              fontSize: '12px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(0,0,0,0.75)',
              padding: '6px 14px',
              border: `2px solid #FFD700`,
              boxShadow: `4px 4px 0px ${COLORS.BLACK}`,
              transform: 'skewX(-6deg)',
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                backgroundColor: '#FFD700',
                animation: 'blink 0.5s infinite',
                transform: 'skewX(6deg)',
              }} />
              <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }}>RX STREAM</span>
              <button onClick={cancelStreaming} style={{
                background: 'none',
                border: `2px solid #FFD700`,
                color: '#FFD700',
                padding: '2px 10px',
                fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: '900',
                fontSize: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transform: 'skewX(6deg)',
              }}>
                <span style={{ display: 'inline-block', transform: 'skewX(-6deg)' }}>ABORT</span>
              </button>
            </div>
          )}

          {/* WAR ROOM 多人头像条 */}
          {isWarRoom && sortedWarRoomPersonas.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '55px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 12,
              display: 'flex',
              alignItems: 'center',
              gap: '0px',
            }}>
              {sortedWarRoomPersonas.map((p, i) => {
                const yOffset = (i % 3 - 1) * 5; // -5, 0, 5 错落
                const isSpeaker = warRoomSpeaker?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWarRoomSpeakerId(p.id)}
                    aria-pressed={isSpeaker}
                    title={`由 ${p.name} 回复`}
                    style={{
                    width: '44px',
                    height: '44px',
                    padding: 0,
                    flexShrink: 0,
                    overflow: 'hidden',
                    transform: `skewX(-8deg) translateY(${yOffset}px) scale(${isSpeaker ? 1.18 : 1})`,
                    boxShadow: isSpeaker
                      ? `6px 6px 0px ${COLORS.PAPER}`
                      : `4px 4px 0px ${COLORS.BLACK}`,
                    border: `${isSpeaker ? 3 : 2}px solid ${p.color || COLORS.PAPER}`,
                    background: COLORS.BLACK,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}>
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          transform: 'skewX(8deg) scale(1.15)',
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '100%', height: '100%',
                        fontSize: '20px',
                        transform: 'skewX(8deg)',
                      }}>{p.emoji || '◆'}</span>
                    )}
                  </button>
                );
              })}
              <span style={{
                marginLeft: '14px',
                color: COLORS.PAPER,
                fontFamily: 'monospace',
                fontSize: '10px',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}>
                SPEAKER: {(warRoomSpeaker?.name || '...').toUpperCase()}
              </span>
            </div>
          )}

          {/* 中央对话视窗 */}
          <div style={{
            position: 'absolute',
            top: isWarRoom ? '110px' : '55px',
            bottom: '0',
            left: '0',
            right: '0',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <AiDialogueStream
              chatHistory={chatHistory}
              isStreaming={isStreaming}
              activePersona={activePersona}
              personas={personas}
              userProfile={userProfile}
            />
            <UserInputPanel
              isStreaming={
                isStreaming
                || isLoadingHistory
                || (isWarRoom && !seminar?.id)
              }
              placeholder={
                isWarRoom && warRoomSpeaker
                  ? `向 ${warRoomSpeaker.name} 发言...`
                  : undefined
              }
              onSendMessage={(text) => {
                if (isWarRoom) {
                  sendSeminarMessage(text, warRoomSpeakerId);
                } else {
                  sendMessage(text);
                }
              }}
            />
          </div>

          {activeInteraction && (
            <PersonaInteractionOverlay
              interaction={activeInteraction}
              persona={interactionPersona}
              userProfile={userProfile}
              onRespond={
                interactionPreviewEnabled
                  ? async () => ({ preview: true })
                  : respondToInteraction
              }
            />
          )}
        </>
      )}

      {/* ============ 全局关键帧动画 ============ */}
      <style>{`
        @keyframes fadeInLeftFlat {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRightFlat {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: skewX(-15deg) translateX(-30px); }
          to   { opacity: 1; transform: skewX(-15deg) translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: skewX(15deg) translateX(30px); }
          to   { opacity: 1; transform: skewX(15deg) translateX(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.15; }
        }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default App;
