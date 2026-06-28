import React, { useState } from 'react';
import { useChatManager } from './hooks/useChatManager';
import { GameBackground } from './components/GameBackground';
import { AiDialogueStream } from './components/AiDialogueStream';
import { UserInputPanel } from './components/UserInputPanel';
import { ShipPanorama } from './scenes/ShipPanorama';
import { COLORS } from './config/constants';

function App() {
  const {
    chatHistory,
    partReplacement,
    personas,
    activePersona,
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
  } = useChatManager();

  // scene: 'launch' | 'dialogue'
  const [scene, setScene] = useState('launch');

  // 从启动画面进入对话
  const handleNavigateToDialogue = (personaId) => {
    if (personaId) {
      setActivePersonaId(personaId);
    }
    setScene('dialogue');
  };

  // 返回启动画面
  const handleBackToLaunch = () => {
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
        />
      )}

      {/* ============ 场景2: 对话界面 ============ */}
      {scene === 'dialogue' && (
        <>
          {/* Pixi.js 动态斜角背景层 */}
          <GameBackground
            partReplacement={partReplacement}
            activeColor={activePersona?.color}
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
            padding: '12px 30px',
          }}>
            {/* 左侧：品牌标题 */}
            <h1 style={{
              margin: 0,
              color: COLORS.P5R_RED,
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              textShadow: `3px 3px 0px ${COLORS.BLACK}`,
            }}>
              Ship of Theseus
            </h1>

            {/* 右侧：状态指示器 + 操作按钮 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {/* 部件替换率标签 */}
              <span style={{
                color: partReplacement >= 100 ? '#5C6BC0' : COLORS.P5R_RED,
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(0,0,0,0.75)',
                padding: '3px 10px',
                border: '1px solid currentColor',
                letterSpacing: '1px',
              }}>
                REPLACED {partReplacement}%
              </span>

              {/* 本地 AI 服务状态灯 */}
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: localService
                  ? (isStreaming ? '#FFD700' : '#00E676')
                  : '#FF1744',
                boxShadow: `0 0 6px currentColor`,
              }}
                title={localService
                  ? (isStreaming ? 'Claude Code 通信中...' : '本地 AI 服务就绪')
                  : '本地 AI 服务未连接'}
              />

              {/* 返回甲板 */}
              <button onClick={handleBackToLaunch} style={{
                background: 'none',
                border: '1px solid #555',
                color: '#999',
                padding: '3px 10px',
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}>
                ← DECK
              </button>

              {/* 重置对话 */}
              <button onClick={clearHistory} style={{
                background: 'none',
                border: '1px solid #555',
                color: '#999',
                padding: '3px 10px',
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}>
                RESET
              </button>

            </div>
          </div>

          {/* 错误横幅 */}
          {error && (
            <div style={{
              position: 'absolute',
              top: '55px',
              left: '50%',
              transform: 'translateX(-50%) skewX(-3deg)',
              zIndex: 15,
              backgroundColor: COLORS.P5R_RED,
              color: COLORS.WHITE,
              padding: '8px 24px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: `2px solid ${COLORS.WHITE}`,
              boxShadow: `6px 6px 0px ${COLORS.BLACK}`,
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <span style={{ letterSpacing: '1px' }}>!! {error}</span>
              <button onClick={() => {
                clearError();
                refreshLocalService();
              }} style={{
                background: COLORS.WHITE,
                color: COLORS.BLACK,
                border: 'none',
                padding: '3px 10px',
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}>
                RETRY
              </button>
            </div>
          )}

          {/* 流式传输指示器 */}
          {isStreaming && (
            <div style={{
              position: 'absolute',
              top: '55px',
              right: '30px',
              zIndex: 15,
              color: '#FFD700',
              fontFamily: 'monospace',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '4px 12px',
              border: '1px solid #FFD700',
            }}>
              <span style={{
                display: 'inline-block',
                width: '5px',
                height: '5px',
                backgroundColor: '#FFD700',
                animation: 'blink 0.5s infinite',
              }} />
              RX STREAM
              <button onClick={cancelStreaming} style={{
                background: 'none',
                border: '1px solid #FFD700',
                color: '#FFD700',
                padding: '1px 6px',
                fontFamily: 'monospace',
                fontSize: '9px',
                cursor: 'pointer',
              }}>
                ABORT
              </button>
            </div>
          )}

          {/* 中央对话视窗 */}
          <div style={{
            position: 'absolute',
            top: '55px',
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
            />
            <UserInputPanel
              isStreaming={isStreaming || isLoadingHistory}
              onSendMessage={sendMessage}
            />
          </div>
        </>
      )}

      {/* ============ 全局关键帧动画 ============ */}
      <style>{`
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
