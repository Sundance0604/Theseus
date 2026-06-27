import React from 'react';
import { COLORS } from '../../config/constants';

/**
 * 左侧启动控件面板 (白-红 P5R 风格)
 * 包含 "开始航行" 按钮和状态指示
 */
export const LaunchControls = ({ phase, onLaunch }) => {
  const isIdle = phase === 'idle';
  const isZooming = phase === 'zooming';
  const isLaunched = phase === 'launched';

  return (
    <div style={{
      position: 'absolute',
      left: '30px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      alignItems: 'flex-start',
    }}>
      {/* 标题区 */}
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{
          margin: 0,
          color: COLORS.WHITE,
          fontFamily: 'monospace',
          fontSize: '28px',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          textShadow: `4px 4px 0px ${COLORS.P5R_RED}`,
          lineHeight: 1.1,
        }}>
          Ship of
        </h2>
        <h2 style={{
          margin: 0,
          color: COLORS.P5R_RED,
          fontFamily: 'monospace',
          fontSize: '28px',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          textShadow: `4px 4px 0px ${COLORS.BLACK}`,
          lineHeight: 1.1,
        }}>
          Theseus
        </h2>
      </div>

      {/* 分割线 */}
      <div style={{
        width: '100%',
        height: '2px',
        backgroundColor: COLORS.P5R_RED,
        margin: '4px 0',
      }} />

      {/* 状态文字 */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isLaunched ? '#00E676' : '#999',
        letterSpacing: '2px',
      }}>
        {isIdle && '· AWAITING ·'}
        {isZooming && '· ENGAGING ·'}
        {isLaunched && '· ACTIVE ·'}
      </div>

      {/* "开始航行" 按钮 */}
      <button
        onClick={onLaunch}
        disabled={!isIdle}
        style={{
          padding: '16px 32px',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          color: isIdle ? COLORS.WHITE : '#555',
          backgroundColor: isIdle ? COLORS.ANARCHY_RED : '#222',
          border: `3px solid ${isIdle ? COLORS.WHITE : '#444'}`,
          cursor: isIdle ? 'pointer' : 'not-allowed',
          transform: 'skewX(-5deg)',
          boxShadow: isIdle ? `6px 6px 0px ${COLORS.BLACK}` : 'none',
          transition: 'all 0.3s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (isIdle) {
            e.target.style.backgroundColor = COLORS.P5R_RED;
            e.target.style.transform = 'skewX(-5deg) scale(1.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (isIdle) {
            e.target.style.backgroundColor = COLORS.ANARCHY_RED;
            e.target.style.transform = 'skewX(-5deg) scale(1)';
          }
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(5deg)' }}>
          {isIdle ? '▶ 开始航行' : isZooming ? '···' : '已启航'}
        </span>
      </button>

      {/* 提示文字 */}
      {isLaunched && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#777',
          letterSpacing: '1px',
          marginTop: '8px',
          maxWidth: '180px',
          lineHeight: 1.5,
        }}>
          鼠标悬停飞船<br />不同位置以探索
        </div>
      )}
    </div>
  );
};
