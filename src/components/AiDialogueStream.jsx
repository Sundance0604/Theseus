import React, { useEffect, useRef } from 'react';
import { COLORS } from '../config/constants';

/* ==========================================================================
   统一时间轴聊天流 (ChatTimeline)
   按时间顺序从上到下交错排列 AI 与用户消息。
   - AI 消息: 靠左对齐，左侧 60×60 斜切黑框头像槽，气泡 skewX(-15°)，尖角指向左
   - 用户消息: 靠右对齐，右侧 60×60 斜切白框头像槽，气泡 skewX(15°)，尖角指向右
   ========================================================================== */

/** 单条消息气泡 + 头像槽 */
const MessageRow = ({ msg, index, isLastStreaming, activePersona }) => {
  const isAi = msg.sender === 'ai';
  const isError = msg.isError;

  // 根据消息发送者决定对齐方向与斜切角度
  const justifyContent = isAi ? 'flex-start' : 'flex-end';
  const skewAngle = isAi ? '-15deg' : '15deg';
  const animName = isAi ? 'fadeInLeft' : 'fadeInRight';

  // --- 气泡样式 ---
  const bubbleBg = isAi
    ? (isError ? 'rgba(211,47,47,0.2)' : COLORS.BLACK_OVERLAY)
    : COLORS.WHITE;
  const bubbleTextColor = isAi ? COLORS.WHITE : COLORS.BLACK;
  const bubbleBorderColor = isAi
    ? (isError ? COLORS.P5R_RED : (isLastStreaming ? '#FFD700' : COLORS.WHITE))
    : COLORS.ANARCHY_RED;
  const shadowColor = isAi ? COLORS.BLACK : COLORS.P5R_RED;

  // --- 气泡内的标题标签 ---
  const headerLabel = isAi
    ? (isError ? 'ERR' : isLastStreaming ? 'RX...' : `LOG_${index + 1}`)
    : `INPUT_${index + 1}`;
  const headerColor = isAi
    ? (isError ? COLORS.P5R_RED : (isLastStreaming ? '#FFD700' : COLORS.P5R_RED))
    : '#666';

  // --- 头像槽样式 ---
  const avatarBg = isAi ? COLORS.ANARCHY_BLACK : COLORS.WHITE;
  const avatarBorder = isAi
    ? `2px solid ${bubbleBorderColor}`
    : `2px solid ${COLORS.ANARCHY_RED}`;
  const avatarContent = isAi ? (activePersona?.emoji || '⚓') : 'YOU';
  const avatarContentColor = isAi ? bubbleBorderColor : COLORS.ANARCHY_RED;
  const photoUrl = isAi ? activePersona?.avatarUrl : null;

  // --- 气泡尖角 (CSS border triangle) ---
  const tailSize = 10;
  const tailStyle = isAi
    ? {
        /* AI 气泡尖角指向左侧（朝向头像） */
        position: 'absolute',
        left: `-${tailSize}px`,
        top: '32px',                    /* 与上内边距对齐 */
        width: 0,
        height: 0,
        borderTop: `${tailSize}px solid transparent`,
        borderBottom: `${tailSize}px solid transparent`,
        borderRight: `${tailSize}px solid ${bubbleBorderColor}`,
      }
    : {
        /* 用户气泡尖角指向右侧（朝向头像） */
        position: 'absolute',
        right: `-${tailSize}px`,
        top: '32px',
        width: 0,
        height: 0,
        borderTop: `${tailSize}px solid transparent`,
        borderBottom: `${tailSize}px solid transparent`,
        borderLeft: `${tailSize}px solid ${bubbleBorderColor}`,
      };

  /* ---- 气泡内容片段 ---- */
  const bubbleContent = (
    <>
      {/* 气泡尖角三角形 */}
      <div style={tailStyle} />

      {/* 标题行 */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '1.5px',
        color: headerColor,
        marginBottom: '6px',
        fontWeight: 'bold',
      }}>
        {isAi ? (activePersona?.name || 'THESEUS').toUpperCase() : 'COMMAND'} // {headerLabel}
      </div>

      {/* 正文 — 与气泡共享同一 skewX，自然匹配平行四边形 */}
      <p style={{
        margin: 0,
        fontSize: '16px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.text}
        {isLastStreaming && (
          <span className="cursor-blink" style={{ color: '#FFD700' }}>▌</span>
        )}
      </p>
    </>
  );

  /* ---- 消息气泡：整体斜切，文字与边框共享同一坐标系 ---- */
  const bubbleBox = (
    <div style={{
      position: 'relative',
      maxWidth: isAi ? 'min(68%, 750px)' : 'min(58%, 580px)',
      minWidth: 0,
      flexShrink: 1,
      padding: '24px 40px',
      backgroundColor: bubbleBg,
      color: bubbleTextColor,
      border: `3px solid ${bubbleBorderColor}`,
      transform: `skewX(${skewAngle})`,
      boxShadow: `8px 8px 0px ${shadowColor}`,
      animation: `${animName} 0.35s ease-out forwards`,
      fontFamily: 'sans-serif',
    }}>
      {bubbleContent}
    </div>
  );

  /* ---- 头像槽片段 ---- */
  const avatarSlot = (
    <div style={{
      width: '60px',
      height: '60px',
      minWidth: '60px',
      flexShrink: 0,
      alignSelf: 'flex-start',
      backgroundColor: avatarBg,
      border: avatarBorder,
      transform: isAi ? 'skewX(-12deg)' : 'skewX(12deg)',
      boxShadow: isAi
        ? `4px 4px 0px ${COLORS.BLACK}`
        : `4px 4px 0px ${COLORS.ANARCHY_RED}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {isAi && photoUrl ? (
        <img
          src={photoUrl}
          alt={activePersona?.name || 'AI'}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: 'skewX(12deg)',
          }}
        />
      ) : (
        <span style={{
          transform: isAi ? 'skewX(12deg)' : 'skewX(-12deg)',
          fontSize: isAi ? '22px' : '18px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: avatarContentColor,
          userSelect: 'none',
        }}>
          {avatarContent}
        </span>
      )}
    </div>
  );

  /* ================================================================
     布局策略:
     - AI 行: 外层 flex-start，avatar + bubble 直接作为子元素居左
     - 用户行: 外层 flex-end，内层再套一个局部 flex 容器包裹
       bubble + avatar，确保在任何缩放比例下 avatar 不被挤出
     ================================================================ */
  return (
    <div style={{
      display: 'flex',
      justifyContent,                   /* AI: flex-start / 用户: flex-end */
      alignItems: 'flex-start',
      width: '100%',                    /* ★ 占满父容器宽度，建立弹性基准 */
      padding: '4px 0',
      flexShrink: 0,
    }}>
      {isAi ? (
        /* ---- AI 靠左: 头像 + 气泡 直接排列 ---- */
        <>
          {avatarSlot}
          {bubbleBox}
        </>
      ) : (
        /* ---- 用户靠右: 内层 flex 包裹 (气泡 + 头像)，防御性对齐 ---- */
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          maxWidth: '100%',
          minWidth: 0,               /* 允许在窄屏时收缩 */
          flexShrink: 1,             /* 允许在窄屏时将整组收缩 */
        }}>
          {bubbleBox}
          {avatarSlot}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   主组件: 统一时间轴聊天流
   ========================================================================== */
export const AiDialogueStream = ({ chatHistory, activePersona }) => {
  const scrollRef = useRef(null);
  const prevLengthRef = useRef(0);

  /* 每当 chatHistory 长度增长时自动滚动到底部 */
  useEffect(() => {
    if (scrollRef.current) {
      const prevLen = prevLengthRef.current;
      const currLen = chatHistory.length;

      /* 仅在新增消息时滚动（流式更新 text 时也保持底部可见） */
      if (currLen > prevLen || chatHistory.some(m => m.isStreaming)) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      prevLengthRef.current = currLen;
    }
  }, [chatHistory]);

  return (
    <div
      ref={scrollRef}
      className="custom-scrollbar"
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',              /* 安全网：截断 skewX 超出的像素级溢出 */
        minWidth: '0',
        /* ★ 自适应水平内边距：最少40px，随视口缩放宽至 6%，上限120px */
        padding: '30px clamp(40px, 7%, 140px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* ======== 按时间顺序渲染所有消息（AI + 用户混合） ======== */}
      {chatHistory.map((msg, i) => {
        /* 判断当前消息是否是最后一条 AI 消息且正在流式传输 */
        const isLastAi =
          msg.sender === 'ai' &&
          i === chatHistory.length - 1;
        const isLastStreaming = isLastAi && msg.isStreaming;

        return (
          <MessageRow
            key={i}
            msg={msg}
            index={
              /* 给每种类型的消息独立编号 */
              chatHistory
                .slice(0, i + 1)
                .filter((m) => m.sender === msg.sender).length
            }
            isLastStreaming={isLastStreaming}
            activePersona={activePersona}
          />
        );
      })}

      {/* ======== 空状态占位 ======== */}
      {chatHistory.length === 0 && (
        <div style={{
          color: '#555',
          fontFamily: 'monospace',
          fontSize: '14px',
          textAlign: 'center',
          marginTop: '60px',
          letterSpacing: '2px',
        }}>
          AWAITING TRANSMISSION...
        </div>
      )}

      {/* ======== 底部留白 (防止最后一条消息贴边) ======== */}
      <div style={{ minHeight: '12px', flexShrink: 0 }} />
    </div>
  );
};
