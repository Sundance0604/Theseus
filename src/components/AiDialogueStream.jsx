import React, { useEffect, useRef } from 'react';
import { COLORS } from '../config/constants';

/* ==========================================================================
   统一时间轴聊天流 (ChatTimeline)
   按时间顺序从上到下交错排列 AI 与用户消息。
   - AI 消息: 靠左对齐，左侧 60×60 斜切黑框头像槽，气泡竖直矩形，
     底层叠放 15° 斜切纯黑+暖白几何色块（拼贴画风格）
   - 用户消息: 靠右对齐，右侧 60×60 斜切白框头像槽，气泡竖直矩形，
     底层叠放 15° 斜切纯黑+安那其红几何色块
   ========================================================================== */

const { PAPER, ANARCHY_RED } = COLORS;

/* ================================================================
   15° 斜切装饰色块背景层 (Background Decoration Layer)
   利用 clip-path 创建两枚互相错落的倾斜几何色块，
   叠放在气泡底部，营造 P5R "背景狂乱倾斜、文字四平八稳" 的拼贴画视觉
   ================================================================ */
const SkewedDecorBlocks = ({ isAi }) => {
  const blockAColor = '#000000';
  const blockBColor = isAi ? PAPER : ANARCHY_RED;
  const blockAOpacity = isAi ? 0.22 : 0.12;
  const blockBOpacity = isAi ? 0.10 : 0.10;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      {/* 色块 A — 向右 15° 斜切 */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-12%',
        width: '72%',
        height: '135%',
        backgroundColor: blockAColor,
        clipPath: 'polygon(0 8%, 92% 0, 100% 92%, 8% 100%)',
        opacity: blockAOpacity,
      }} />
      {/* 色块 B — 向左 15° 斜切，与 A 错位叠放 */}
      <div style={{
        position: 'absolute',
        top: '12%',
        right: '-10%',
        width: '58%',
        height: '125%',
        backgroundColor: blockBColor,
        clipPath: 'polygon(12% 0, 100% 6%, 90% 100%, 0 94%)',
        opacity: blockBOpacity,
      }} />
    </div>
  );
};

/** 单条消息气泡 + 头像槽 */
const MessageRow = ({ msg, index, isLastStreaming, messagePersona, userProfile }) => {
  const isAi = msg.sender === 'ai';
  const isError = msg.isError;

  // 根据消息发送者决定动画方向
  const animName = isAi ? 'fadeInLeftFlat' : 'fadeInRightFlat';

  // --- 气泡样式 ---
  const bubbleBg = isAi
    ? (isError ? 'rgba(211,47,47,0.2)' : COLORS.BLACK_OVERLAY)
    : COLORS.WHITE;
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
  const avatarContent = isAi ? (messagePersona?.emoji || '⚓') : 'YOU';
  const avatarContentColor = isAi ? bubbleBorderColor : COLORS.ANARCHY_RED;
  const photoUrl = isAi ? messagePersona?.avatarUrl : userProfile?.avatarUrl;

  /* ---- 气泡内容片段 ---- */
  const bubbleContent = (
    <>
      {/* 标题行 — 继承气泡斜度，无 counter-skew */}
      <div style={{
        fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
        fontSize: '14px',
        fontStyle: 'italic',
        fontWeight: '900',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: headerColor,
        marginBottom: '8px',
        textShadow: isAi
          ? 'none'
          : `2px 2px 0px ${COLORS.ANARCHY_RED}20`,
      }}>
        {isAi ? (messagePersona?.name || 'THESEUS').toUpperCase() : 'COMMAND'} // {headerLabel}
      </div>

      {/* 正文 — 继承气泡斜度，与边框同坐标系 */}
      <p style={{
        margin: 0,
        fontFamily: '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif',
        fontSize: '18px',
        fontStyle: 'italic',
        fontWeight: '900',
        lineHeight: '1.5',
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

  /* ================================================================
     消息气泡：全元素统一斜切
     - 单层结构，skewX 作用于边框 + 文字 + 色块装饰
     - 文字与边框共享同一坐标系，无边角溢出
     ================================================================ */
  const skewAngle = isAi ? '-15deg' : '15deg';

  const bubbleBox = (
    <div style={{
      position: 'relative',
      maxWidth: isAi ? '720px' : '560px',
      minWidth: 0,
      flexShrink: 1,
      transform: `skewX(${skewAngle})`,
      backgroundColor: bubbleBg,
      color: isAi ? COLORS.WHITE : COLORS.BLACK,
      border: `3px solid ${bubbleBorderColor}`,
      boxShadow: `8px 8px 0px ${shadowColor}`,
      padding: '32px 56px',
      animation: `${animName} 0.35s ease-out forwards`,
    }}>
      {/* 底层：15° 斜切几何色块装饰 */}
      <SkewedDecorBlocks isAi={isAi} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {bubbleContent}
      </div>
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
      transform: isAi ? 'skewX(-8deg)' : 'skewX(8deg)',
      boxShadow: isAi
        ? `4px 4px 0px ${COLORS.BLACK}`
        : `4px 4px 0px ${COLORS.ANARCHY_RED}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={isAi ? (messagePersona?.name || 'AI') : 'User'}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: isAi ? 'skewX(8deg)' : 'skewX(-8deg)',
          }}
        />
      ) : (
        <span style={{
          transform: isAi ? 'skewX(8deg)' : 'skewX(-8deg)',
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
      justifyContent: 'flex-start',     /* 统一从左侧开始排列 */
      alignItems: 'flex-start',
      width: '100%',                    /* ★ 占满父容器宽度，建立弹性基准 */
      padding: '4px 0',
      flexShrink: 0,
    }}>
      {isAi ? (
        /* ---- AI 靠左: 头像 + 气泡 直接排列 ---- */
        <>
          <div style={{ marginRight: '24px' }}>{avatarSlot}</div>
          {bubbleBox}
        </>
      ) : (
        /* ---- 用户靠右: margin-left: auto 推至最右侧 ---- */
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '24px',
          maxWidth: '100%',
          minWidth: 0,
          marginLeft: 'auto',
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
export const AiDialogueStream = ({
  chatHistory,
  activePersona,
  personas = [],
  userProfile,
}) => {
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
        /* ★ 百分比内边距自适应视口宽度: min 40px / 理想 6% / max 120px */
        padding: '30px clamp(40px, 6%, 120px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* ======== 按时间顺序渲染所有消息（AI + 用户混合） ======== */}
      {chatHistory.map((msg, i) => {
        const messagePersona = msg.sender === 'ai'
          ? (personas.find(persona => persona.id === msg.personaId) || activePersona)
          : null;
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
            messagePersona={messagePersona}
            userProfile={userProfile}
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
