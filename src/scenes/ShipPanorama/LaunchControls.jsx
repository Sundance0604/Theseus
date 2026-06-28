import React from 'react';
import { COLORS } from '../../config/constants';

/**
 * 左侧导航控件面板 — P5R 波普朋克限色视效
 * 配色: 纯黑背景 #1A1A1A / 暖白边框 #F5F0EB / 狂热大红 #D40000
 * 启动前: 标题 + 开始航行按钮
 * 启动后: 6 个区域导航按钮
 */
const PAPER = '#F5F0EB';
const ANARCHY = '#D40000';
const BLACK = '#1A1A1A';

const ZONES = [
  { id: 'crew', label: '船员室', sub: 'CREW QUARTERS', icon: '👥' },
  { id: 'warRoom', label: '作战会议室', sub: 'WAR ROOM', icon: '🏛️' },
  { id: 'captain', label: '船长室', sub: "CAPTAIN'S CABIN", icon: '⚓' },
  { id: 'engine', label: '引擎室', sub: 'ENGINE ROOM', icon: '⚙️' },
  { id: 'archive', label: '档案室', sub: 'ARCHIVE', icon: '📜' },
  { id: 'memoryWard', label: '心理室', sub: 'MEMORY WARD', icon: '🧠' },
];

export const LaunchControls = ({ phase, onLaunch, onNavigateZone }) => {
  const isIdle = phase === 'idle';
  const isZooming = phase === 'zooming';
  const isLaunched = phase === 'launched';

  return (
    <div style={{
      position: 'absolute',
      left: isLaunched ? '20px' : '30px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: isLaunched ? '0px' : '18px',
      alignItems: 'flex-start',
      transition: 'all 0.5s ease',
      width: isLaunched ? '220px' : 'auto',
    }}>
      {/* ======== 标题区 (仅 idle/zooming) ======== */}
      {!isLaunched && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={{
            margin: 0, color: PAPER,
            fontFamily: '"Impact", "Arial Black", sans-serif',
            fontSize: '36px', fontWeight: '900',
            letterSpacing: '10px', textTransform: 'uppercase',
            textShadow: `6px 6px 0px ${ANARCHY}`,
            lineHeight: 1.05,
          }}>Ship of</h2>
          <h2 style={{
            margin: 0, color: ANARCHY,
            fontFamily: '"Impact", "Arial Black", sans-serif',
            fontSize: '36px', fontWeight: '900',
            letterSpacing: '10px', textTransform: 'uppercase',
            textShadow: `6px 6px 0px ${BLACK}`,
            lineHeight: 1.05, marginTop: '-2px',
          }}>Theseus</h2>
        </div>
      )}

      {/* ======== 已启动标题 ======== */}
      {isLaunched && (
        <div style={{
          position: 'relative', marginBottom: '6px',
          backgroundColor: BLACK, border: `3px solid ${ANARCHY}`,
          transform: 'skewX(-12deg)',
          padding: '6px 20px', alignSelf: 'flex-start',
          boxShadow: `6px 6px 0px ${BLACK}`,
        }}>
          <span style={{
            display: 'inline-block', transform: 'skewX(12deg)',
            fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold',
            color: PAPER, letterSpacing: '3px', textTransform: 'uppercase',
          }}>NAVIGATION</span>
        </div>
      )}

      {/* ======== 分割线 (idle/zooming) ======== */}
      {!isLaunched && (
        <div style={{ width: '100%', height: '4px', backgroundColor: ANARCHY, margin: '4px 0', boxShadow: `3px 3px 0px ${BLACK}` }} />
      )}

      {/* ======== 状态文字 ======== */}
      <div style={{
        fontFamily: 'monospace', fontSize: '10px',
        color: isLaunched ? '#00E676' : (isZooming ? '#FFD700' : '#888'),
        letterSpacing: '3px', marginBottom: isLaunched ? '4px' : '0',
      }}>
        {isIdle && '· AWAITING ·'}
        {isZooming && '· ENGAGING ·'}
        {isLaunched && '· ACTIVE ·'}
      </div>

      {/* ======== "开始航行" 按钮 (仅 idle) ======== */}
      {!isLaunched && (
        <button
          onClick={onLaunch} disabled={!isIdle}
          style={{
            padding: '18px 40px', fontFamily: 'monospace', fontSize: '16px',
            fontWeight: 'bold', letterSpacing: '6px',
            color: isIdle ? PAPER : '#555',
            backgroundColor: isIdle ? ANARCHY : '#222',
            border: `3px solid ${isIdle ? PAPER : '#444'}`, outline: 'none',
            cursor: isIdle ? 'pointer' : 'not-allowed',
            transform: 'skewX(-8deg)',
            boxShadow: isIdle ? `10px 10px 0px ${BLACK}` : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isIdle) return;
            e.currentTarget.style.backgroundColor = BLACK;
            e.currentTarget.style.color = ANARCHY;
            e.currentTarget.style.borderColor = ANARCHY;
            e.currentTarget.style.transform = 'skewX(-8deg) scale(1.04)';
            e.currentTarget.style.boxShadow = `12px 12px 0px ${ANARCHY}`;
          }}
          onMouseLeave={(e) => {
            if (!isIdle) return;
            e.currentTarget.style.backgroundColor = ANARCHY;
            e.currentTarget.style.color = PAPER;
            e.currentTarget.style.borderColor = PAPER;
            e.currentTarget.style.transform = 'skewX(-8deg) scale(1)';
            e.currentTarget.style.boxShadow = `10px 10px 0px ${BLACK}`;
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>
            {isIdle ? '▶ 开始航行' : isZooming ? '···' : '已启航'}
          </span>
        </button>
      )}

      {/* ======== 导航按钮列表 (launched) ======== */}
      {isLaunched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {ZONES.map((zone, i) => (
            <button
              key={zone.id}
              onClick={() => onNavigateZone(zone.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 14px',
                backgroundColor: BLACK,
                border: `2px solid ${PAPER}`, borderLeft: `5px solid ${PAPER}`,
                outline: 'none', cursor: 'pointer', textAlign: 'left',
                transform: 'skewX(-10deg)',
                transition: 'all 0.15s ease',
                boxShadow: `5px 5px 0px ${BLACK}`,
                animation: `navFadeIn 0.25s ${i * 0.05}s ease-out both`,
                marginBottom: i < ZONES.length - 1 ? '-2px' : '0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PAPER;
                e.currentTarget.style.borderColor = ANARCHY;
                e.currentTarget.style.borderLeftColor = ANARCHY;
                e.currentTarget.style.transform = 'skewX(-10deg) scale(1.03)';
                e.currentTarget.style.boxShadow = `8px 8px 0px ${ANARCHY}`;
                // 反色子元素
                const spans = e.currentTarget.querySelectorAll('span, div');
                spans.forEach(s => s.style.color = s.dataset.origColor ? '#1A1A1A' : '');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BLACK;
                e.currentTarget.style.borderColor = PAPER;
                e.currentTarget.style.borderLeftColor = PAPER;
                e.currentTarget.style.transform = 'skewX(-10deg) scale(1)';
                e.currentTarget.style.boxShadow = `5px 5px 0px ${BLACK}`;
                const spans = e.currentTarget.querySelectorAll('span, div');
                spans.forEach(s => { if (s.dataset.origColor) s.style.color = s.dataset.origColor; });
              }}
            >
              {/* 图标 */}
              <span data-orig-color={PAPER} style={{ fontSize: '16px', transform: 'skewX(10deg)', flexShrink: 0, color: PAPER, transition: 'color 0.15s' }}>
                {zone.icon}
              </span>

              {/* 文字区 */}
              <div style={{ transform: 'skewX(10deg)', flex: 1, minWidth: 0 }}>
                <div data-orig-color={PAPER} style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: PAPER, letterSpacing: '2px', transition: 'color 0.15s' }}>
                  {zone.label}
                </div>
                <div data-orig-color={'#888'} style={{ fontFamily: 'monospace', fontSize: '7px', color: '#888', letterSpacing: '1px', marginTop: '1px', transition: 'color 0.15s' }}>
                  {zone.sub}
                </div>
              </div>

              {/* 箭头 */}
              <span data-orig-color={PAPER} style={{ color: PAPER, fontSize: '12px', transform: 'skewX(10deg)', flexShrink: 0, opacity: 0.6, transition: 'color 0.15s' }}>
                →
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: skewX(-10deg) translateX(-20px); }
          to { opacity: 1; transform: skewX(-10deg) translateX(0); }
        }
      `}</style>
    </div>
  );
};
