import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../config/constants';

/* ==========================================================================
   用户输入面板 (UserInputPanel)
   固定在聊天主视窗最底部，不与消息历史共用滚动区域。
   仅负责：输入框 + EXEC 按钮，在流式传输中禁用交互。
   ========================================================================== */
export const UserInputPanel = ({ isStreaming, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  /* AI 回复完成后自动聚焦输入框 */
  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInputValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        flexShrink: 0,                      /* 不被滚动区域压缩 */
        display: 'flex',
        gap: '12px',
        padding: '16px clamp(40px, 6%, 120px) 20px clamp(40px, 6%, 120px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',  /* 微弱分割线 */
      }}
    >
      {/* ---- 输入框 ---- */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isStreaming ? 'RX IN PROGRESS...' : '向忒修斯发送指令...'}
        disabled={isStreaming}
        autoFocus
        style={{
          flex: 1,
          padding: '14px 18px',
          fontSize: '15px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: isStreaming ? '#555' : COLORS.BLACK,
          backgroundColor: isStreaming
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(255,255,255,0.92)',
          border: `3px solid ${isStreaming ? '#444' : COLORS.BLACK}`,
          transform: 'skewX(10deg)',
          outline: 'none',
          cursor: isStreaming ? 'not-allowed' : 'text',
          transition: 'background-color 0.25s, border-color 0.25s',
          /* 内部文字反向抵消倾斜 */
        }}
        onKeyDown={(e) => {
          /* Enter 发送，Shift+Enter 换行（单行 input 暂不支持，预留） */
          if (e.key === 'Enter' && !e.shiftKey) {
            // handled by form onSubmit
          }
        }}
      />

      {/* ---- EXEC 按钮 ---- */}
      <button
        type="submit"
        disabled={isStreaming}
        style={{
          padding: '14px 28px',
          fontFamily: 'monospace',
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          color: isStreaming ? '#555' : COLORS.WHITE,
          backgroundColor: isStreaming ? '#222' : COLORS.BLACK,
          border: `3px solid ${isStreaming ? '#444' : COLORS.WHITE}`,
          transform: 'skewX(10deg)',
          boxShadow: `5px 5px 0px ${COLORS.ANARCHY_RED}`,
          cursor: isStreaming ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          flexShrink: 0,           /* ★ 死守按钮宽度，不被输入框挤压 */
        }}
      >
        {/* 按钮内文字反向抵消倾斜 */}
        <span style={{ display: 'inline-block', transform: 'skewX(-10deg)' }}>
          {isStreaming ? '···' : 'EXEC'}
        </span>
      </button>
    </form>
  );
};