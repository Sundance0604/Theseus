import React from 'react';
import { COLORS } from '../../config/constants';

/**
 * 左侧导航控件面板 — P5R 美学
 * 启动前: 标题 + 开始航行按钮
 * 启动后: 5 个区域导航按钮 (带主题色)
 */
const ZONES = [
  { id: 'crew', label: '船员室', sub: 'CREW QUARTERS', color: '#FFB7C5', icon: '👥', desc: '与船员进行 1v1 对话' },
  { id: 'warRoom', label: '作战会议室', sub: 'WAR ROOM', color: '#4169E1', icon: '🏛️', desc: '多人环形研讨会' },
  { id: 'captain', label: '船长室', sub: "CAPTAIN'S CABIN", color: '#DAA520', icon: '⚓', desc: '个人计划与便签' },
  { id: 'engine', label: '引擎室', sub: 'ENGINE ROOM', color: '#228B22', icon: '⚙️', desc: '系统状态监控' },
  { id: 'archive', label: '档案室', sub: 'ARCHIVE', color: '#708090', icon: '📜', desc: '历史记录与知识库' },
];

export const LaunchControls = ({ phase, onLaunch, onNavigateZone }) => {
  const isIdle = phase === 'idle';
  const isZooming = phase === 'zooming';
  const isLaunched = phase === 'launched';

  return (
    <div style={{
      position: 'absolute',
      left: isLaunched ? '24px' : '30px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: isLaunched ? '6px' : '18px',
      alignItems: 'flex-start',
      transition: 'all 0.5s ease',
    }}>
      {/* ======== 标题区 (仅 idle/zooming) ======== */}
      {!isLaunched && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={{
            margin: 0,
            color: COLORS.WHITE,
            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            textShadow: `5px 5px 0px ${COLORS.ANARCHY_RED}`,
            lineHeight: 1.1,
          }}>
            Ship of
          </h2>
          <h2 style={{
            margin: 0,
            color: COLORS.ANARCHY_RED,
            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            textShadow: `5px 5px 0px ${COLORS.BLACK}`,
            lineHeight: 1.1,
            marginTop: '-2px',
          }}>
            Theseus
          </h2>
        </div>
      )}

      {/* ======== 已启动后的标题 (缩小) ======== */}
      {isLaunched && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{
            margin: 0,
            color: COLORS.P5R_RED,
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}>
            Navigation
          </h2>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: COLORS.P5R_RED,
            marginTop: '6px',
            opacity: 0.5,
          }} />
        </div>
      )}

      {/* ======== 分割线 (idle/zooming) ======== */}
      {!isLaunched && (
        <div style={{
          width: '100%',
          height: '3px',
          backgroundColor: COLORS.ANARCHY_RED,
          margin: '4px 0',
          boxShadow: `2px 2px 0px ${COLORS.BLACK}`,
        }} />
      )}

      {/* ======== 状态文字 ======== */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isLaunched ? '#00E676' : (isZooming ? '#FFD700' : '#999'),
        letterSpacing: '2px',
        marginBottom: isLaunched ? '6px' : '0',
      }}>
        {isIdle && '· AWAITING ·'}
        {isZooming && '· ENGAGING ·'}
        {isLaunched && '· ACTIVE ·'}
      </div>

      {/* ======== "开始航行" 按钮 (仅 idle) ======== */}
      {!isLaunched && (
        <button
          onClick={onLaunch}
          disabled={!isIdle}
          style={{
            padding: '18px 36px',
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '5px',
            color: isIdle ? COLORS.WHITE : '#555',
            backgroundColor: isIdle ? COLORS.ANARCHY_RED : '#222',
            border: `3px solid ${isIdle ? COLORS.WHITE : '#444'}`,
            cursor: isIdle ? 'pointer' : 'not-allowed',
            transform: 'skewX(-5deg)',
            boxShadow: isIdle ? `8px 8px 0px ${COLORS.BLACK}` : 'none',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (isIdle) {
              e.currentTarget.style.backgroundColor = '#FF1744';
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1.06)';
              e.currentTarget.style.boxShadow = `10px 10px 0px ${COLORS.BLACK}`;
            }
          }}
          onMouseLeave={(e) => {
            if (isIdle) {
              e.currentTarget.style.backgroundColor = COLORS.ANARCHY_RED;
              e.currentTarget.style.transform = 'skewX(-5deg) scale(1)';
              e.currentTarget.style.boxShadow = `8px 8px 0px ${COLORS.BLACK}`;
            }
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(5deg)' }}>
            {isIdle ? '▶ 开始航行' : isZooming ? '···' : '已启航'}
          </span>
        </button>
      )}

      {/* ======== 导航按钮列表 (launched) ======== */}
      {isLaunched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {ZONES.map((zone, i) => (
            <button
              key={zone.id}
              onClick={() => onNavigateZone(zone.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: `2px solid ${zone.color}`,
                borderLeft: `4px solid ${zone.color}`,
                cursor: 'pointer',
                textAlign: 'left',
                transform: 'skewX(-3deg)',
                transition: 'all 0.2s ease',
                animation: `navFadeIn 0.3s ${i * 0.06}s ease-out both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.85)';
                e.currentTarget.style.borderLeft = `6px solid ${zone.color}`;
                e.currentTarget.style.transform = 'skewX(-3deg) scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.borderLeft = `4px solid ${zone.color}`;
                e.currentTarget.style.transform = 'skewX(-3deg) scale(1)';
              }}
            >
              {/* 图标 */}
              <span style={{
                fontSize: '16px',
                transform: 'skewX(3deg)',
                flexShrink: 0,
              }}>
                {zone.icon}
              </span>

              {/* 文字区 */}
              <div style={{ transform: 'skewX(3deg)', flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: zone.color,
                  letterSpacing: '2px',
                }}>
                  {zone.label}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '8px',
                  color: '#777',
                  letterSpacing: '1px',
                  marginTop: '2px',
                }}>
                  {zone.sub}
                </div>
              </div>

              {/* 箭头 */}
              <span style={{
                color: zone.color,
                fontSize: '12px',
                transform: 'skewX(3deg)',
                flexShrink: 0,
                opacity: 0.6,
              }}>
                →
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ======== 动画 ======== */}
      <style>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: skewX(-3deg) translateX(-20px); }
          to { opacity: 1; transform: skewX(-3deg) translateX(0); }
        }
      `}</style>
    </div>
  );
};
