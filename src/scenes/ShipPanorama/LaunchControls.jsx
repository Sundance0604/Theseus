import React from 'react';

/* ==========================================================================
   LaunchControls — P5R 波普朋克纯英文控件面板
   配色: 纯黑 #1A1A1A / 暖白 #F5F0EB / 狂热大红 #D40000
   字体: Passion One / Impact / Bebas Neue (极粗黑体)
   ========================================================================== */
const PAPER = '#F5F0EB';
const ANARCHY = '#D40000';
const BLACK = '#1A1A1A';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

const ZONES = [
  { id: 'crew',       label: 'CREW',        sub: 'QUARTERS' },
  { id: 'warRoom',    label: 'WAR',         sub: 'ROOM' },
  { id: 'captain',    label: 'CAPTAIN',     sub: 'CABIN' },
  { id: 'engine',     label: 'ENGINE',      sub: 'ROOM' },
  { id: 'archive',    label: 'ARCHIVE',     sub: 'LOG' },
  { id: 'memoryWard', label: 'MEMORY',      sub: 'WARD' },
];

/* ---- P5R 颤抖关键帧 ---- */
const SHAKE_KEYFRAMES = `
@keyframes p5r-shake {
   0%   { transform: skewX(-15deg) scale(1.06) translate(0, 0) rotate(0deg); }
  15%   { transform: skewX(-15deg) scale(1.06) translate(-2px,  1px) rotate(-0.8deg); }
  30%   { transform: skewX(-15deg) scale(1.06) translate( 2px, -1px) rotate( 1.2deg); }
  45%   { transform: skewX(-15deg) scale(1.06) translate(-1px, -2px) rotate(-0.5deg); }
  60%   { transform: skewX(-15deg) scale(1.06) translate( 3px,  2px) rotate( 1.0deg); }
  75%   { transform: skewX(-15deg) scale(1.06) translate(-2px,  2px) rotate(-1.5deg); }
  90%   { transform: skewX(-15deg) scale(1.06) translate( 1px, -2px) rotate( 0.6deg); }
 100%   { transform: skewX(-15deg) scale(1.06) translate( 0,  0) rotate(0deg); }
}`;

export const LaunchControls = ({ phase, onLaunch, onNavigateZone }) => {
  const isIdle = phase === 'idle';
  const isZooming = phase === 'zooming';
  const isLaunched = phase === 'launched';

  return (
    <div style={{
      position: 'absolute',
      right: isLaunched ? '24px' : '36px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: isLaunched ? '1px' : '22px',
      alignItems: 'flex-end',
      transition: 'all 0.5s ease',
      width: isLaunched ? '280px' : 'auto',
    }}>
      {/* ======== 标题区 (仅 idle/zooming) — 不可点击，保持在左侧 ======== */}
      {!isLaunched && (
        <div style={{
          position: 'fixed',
          left: '36px',
          top: '50%',
          transform: 'translateY(-50%)',
          marginBottom: '10px',
          pointerEvents: 'none',
        }}>
          <h2 style={{
            margin: 0, color: PAPER,
            fontFamily: FONT, fontStyle: 'italic',
            fontSize: '56px', fontWeight: '900',
            letterSpacing: '-1px', textTransform: 'uppercase',
            textShadow: `8px 8px 0px ${ANARCHY}`,
            lineHeight: 1.0,
          }}>SHIP OF</h2>
          <h2 style={{
            margin: 0, color: ANARCHY,
            fontFamily: FONT, fontStyle: 'italic',
            fontSize: '56px', fontWeight: '900',
            letterSpacing: '-1px', textTransform: 'uppercase',
            textShadow: `8px 8px 0px ${BLACK}`,
            lineHeight: 1.0, marginTop: '-4px',
          }}>THESEUS</h2>
        </div>
      )}

      {/* ======== 已启动标题标签 ======== */}
      {isLaunched && (
        <div style={{
          position: 'relative', marginBottom: '6px',
          backgroundColor: BLACK, border: `3px solid ${ANARCHY}`,
          transform: 'skewX(12deg)',
          padding: '8px 24px', alignSelf: 'flex-end',
          boxShadow: `8px 8px 0px ${BLACK}`,
        }}>
          <span style={{
            display: 'inline-block', transform: 'skewX(-12deg)',
            fontFamily: FONT, fontStyle: 'italic',
            fontSize: '18px', fontWeight: '900',
            color: PAPER, letterSpacing: '-0.5px', textTransform: 'uppercase',
          }}>NAVIGATION</span>
        </div>
      )}

      {/* ======== 分割线 ======== */}
      {!isLaunched && (
        <div style={{ width: '100%', height: '5px', backgroundColor: ANARCHY, margin: '6px 0', boxShadow: `4px 4px 0px ${BLACK}` }} />
      )}

      {/* ======== 状态文字 ======== */}
      <div style={{
        fontFamily: FONT, fontStyle: 'italic',
        fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase',
        color: isLaunched ? '#00E676' : (isZooming ? '#FFD700' : '#888'),
        marginBottom: isLaunched ? '4px' : '0',
      }}>
        {isIdle && '· AWAITING ·'}
        {isZooming && '· ENGAGING ·'}
        {isLaunched && '· ACTIVE ·'}
      </div>

      {/* ======== "开始航行" 按钮 ======== */}
      {!isLaunched && (
        <button
          onClick={onLaunch} disabled={!isIdle}
          className="p5r-launch-btn"
          style={{
            padding: '26px 56px',
            fontFamily: FONT, fontStyle: 'italic',
            fontSize: '26px', fontWeight: '900',
            letterSpacing: '-1px', textTransform: 'uppercase',
            color: isIdle ? PAPER : '#555',
            backgroundColor: isIdle ? ANARCHY : '#222',
            border: `4px solid ${isIdle ? PAPER : '#444'}`, outline: 'none',
            cursor: isIdle ? 'pointer' : 'not-allowed',
            transform: 'skewX(10deg)',
            boxShadow: isIdle ? `14px 14px 0px ${BLACK}` : 'none',
            transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1), background-color 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isIdle) return;
            const el = e.currentTarget;
            el.style.backgroundColor = BLACK;
            el.style.color = ANARCHY;
            el.style.borderColor = ANARCHY;
            el.style.boxShadow = `16px 16px 0px ${ANARCHY}`;
            el.style.animation = 'p5r-shake 0.15s infinite linear';
          }}
          onMouseLeave={(e) => {
            if (!isIdle) return;
            const el = e.currentTarget;
            el.style.backgroundColor = ANARCHY;
            el.style.color = PAPER;
            el.style.borderColor = PAPER;
            el.style.boxShadow = `14px 14px 0px ${BLACK}`;
          }}
          onMouseLeave={(e) => {
            if (!isIdle) return;
            const el = e.currentTarget;
            el.style.backgroundColor = ANARCHY;
            el.style.color = PAPER;
            el.style.borderColor = PAPER;
            el.style.boxShadow = `14px 14px 0px ${BLACK}`;
            el.style.animation = '';
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(-10deg)' }}>
            {isIdle ? '▶ SET SAIL' : isZooming ? '···' : 'SAILING'}
          </span>
        </button>
      )}

      {/* ======== 导航按钮列表 ======== */}
      {isLaunched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {ZONES.map((zone, i) => (
            <button
              key={zone.id}
              onClick={() => onNavigateZone(zone.id)}
              className="p5r-nav-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '14px 18px',
                backgroundColor: BLACK,
                border: `2px solid ${PAPER}`, borderLeft: `6px solid ${PAPER}`,
                outline: 'none', cursor: 'pointer', textAlign: 'left',
                transform: 'skewX(10deg)',
                transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1), background-color 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
                boxShadow: `6px 6px 0px ${BLACK}`,
                animation: `navFadeIn 0.25s ${i * 0.05}s ease-out both`,
                marginBottom: i < ZONES.length - 1 ? '-2px' : '0',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = PAPER;
                el.style.borderColor = ANARCHY;
                el.style.borderLeftColor = ANARCHY;
                el.style.boxShadow = `10px 10px 0px ${ANARCHY}`;
                el.style.animation = `navFadeIn 0.25s ${i * 0.05}s ease-out both, p5r-shake 0.15s infinite linear`;
                // 子元素反色
                el.querySelectorAll('[data-og]').forEach(s => { s.style.color = BLACK; });
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = BLACK;
                el.style.borderColor = PAPER;
                el.style.borderLeftColor = PAPER;
                el.style.boxShadow = `6px 6px 0px ${BLACK}`;
                el.style.animation = `navFadeIn 0.25s ${i * 0.05}s ease-out both`;
                el.querySelectorAll('[data-og]').forEach(s => { s.style.color = s.dataset.og; });
              }}
            >
              <div style={{ transform: 'skewX(-10deg)', flex: 1, minWidth: 0 }}>
                <div data-og={PAPER}
                  style={{
                    fontFamily: FONT, fontStyle: 'italic',
                    fontSize: '16px', fontWeight: '900',
                    color: PAPER, letterSpacing: '-0.5px', textTransform: 'uppercase',
                    transition: 'color 0.12s',
                  }}>
                  {zone.label}
                </div>
                <div data-og={'#888'}
                  style={{
                    fontFamily: FONT, fontStyle: 'italic',
                    fontSize: '10px', color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase',
                    marginTop: '1px', transition: 'color 0.12s',
                  }}>
                  {zone.sub}
                </div>
              </div>

              <span data-og={PAPER}
                style={{ color: PAPER, fontSize: '18px', transform: 'skewX(-10deg)', flexShrink: 0, opacity: 0.6, transition: 'color 0.12s' }}>
                ▶
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        ${SHAKE_KEYFRAMES}
        @keyframes navFadeIn {
          from { opacity: 0; transform: skewX(10deg) translateX(20px); }
          to { opacity: 1; transform: skewX(10deg) translateX(0); }
        }
      `}</style>
    </div>
  );
};
