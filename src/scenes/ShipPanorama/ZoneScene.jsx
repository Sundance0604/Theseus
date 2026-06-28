import React from 'react';
import { PERSONAS } from '../../config/personas';

/* ==========================================================================
   ZoneScene — P5R 波普朋克红底白框子场景
   限色: 纯红 #D40000 / 暖白 #F5F0EB / 纯黑 #1A1A1A
   无抖动动画，简洁硬朗
   ========================================================================== */
const RED = '#D40000';
const PAPER = '#F5F0EB';
const BLACK = '#1A1A1A';
const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

export const ZoneScene = ({ zone, onBack, onEnterDialogue }) => {
  if (!zone) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 30,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'sceneFadeIn 0.25s ease-out',
    }}>
      <div style={{
        backgroundColor: RED,
        border: `4px solid ${PAPER}`,
        width: '90%', maxWidth: '760px', maxHeight: '82%',
        padding: '36px 40px',
        transform: 'skewX(-8deg)',
        boxShadow: `14px 14px 0px ${BLACK}`,
        overflowY: 'auto',
      }}>
        <div style={{ transform: 'skewX(8deg)' }}>
          {/* ---- 标题行 ---- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: `3px solid ${PAPER}`,
                color: PAPER,
                padding: '8px 18px',
                fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '14px', letterSpacing: '0px', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: `4px 4px 0px ${BLACK}`,
              }}
            >← DECK</button>
            <h2 style={{
              margin: 0, color: PAPER,
              fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
              fontSize: '28px', letterSpacing: '-0.5px', textTransform: 'uppercase',
              textShadow: `4px 4px 0px ${BLACK}`,
            }}>
              {zone.label}
            </h2>
          </div>

          {/* ---- 分割线 ---- */}
          <div style={{ width: '100%', height: '3px', backgroundColor: PAPER, marginBottom: '24px', boxShadow: `3px 3px 0px ${BLACK}` }} />

          {/* ---- 区域内容 ---- */}
          {renderZoneContent(zone, onEnterDialogue)}
        </div>
      </div>

      <style>{`@keyframes sceneFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

function renderZoneContent(zone, onEnterDialogue) {
  switch (zone.id) {
    case 'crew':       return <CrewQuartersContent onEnterDialogue={onEnterDialogue} />;
    case 'warRoom':    return <InfoPlaceholder label="WAR ROOM" desc="Multi-character seminar — coming soon." />;
    case 'captain':    return <InfoPlaceholder label="CAPTAIN'S CABIN" desc="Personal dashboard — coming soon." />;
    case 'engine':     return <InfoPlaceholder label="ENGINE ROOM" desc="System status — coming soon." />;
    case 'archive':    return <InfoPlaceholder label="ARCHIVE" desc="Historical records — coming soon." />;
    case 'memoryWard': return <InfoPlaceholder label="MEMORY WARD" desc="Isolated memory viewer — coming soon." />;
    default:           return null;
  }
}

/* ---- 占位页面 ---- */
function InfoPlaceholder({ label, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px' }}>
      <p style={{ margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: '900', fontSize: '22px', color: PAPER, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      <p style={{ margin: '12px 0 0', fontFamily: FONT, fontStyle: 'italic', fontSize: '13px', color: PAPER, opacity: 0.7, textTransform: 'uppercase' }}>{desc}</p>
    </div>
  );
}

/* ---- 船员室：选择船员 ---- */
function CrewQuartersContent({ onEnterDialogue }) {
  const crewIds = ['cindy', 'noodles', 'valse', 'orc', 'pavane', 'sofies', 'socrates', 'lin'];
  return (
    <div>
      <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: '14px', color: PAPER, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
        SELECT A CREW MEMBER FOR 1-ON-1 DIALOGUE
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {crewIds.map(id => {
          const p = PERSONAS[id];
          if (!p) return null;
          return (
            <button
              key={id}
              onClick={() => onEnterDialogue(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 18px',
                backgroundColor: BLACK,
                border: `2px solid ${p.color}`,
                cursor: 'pointer', textAlign: 'left',
                transform: 'skewX(-5deg)',
                boxShadow: `5px 5px 0px ${BLACK}`,
                transition: 'transform 0.15s ease, background-color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'skewX(-5deg) scale(1.03)'; e.currentTarget.style.backgroundColor = '#0D0D0D'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'skewX(-5deg) scale(1)'; e.currentTarget.style.backgroundColor = BLACK; }}
            >
              <div style={{
                width: '48px', height: '48px', flexShrink: 0,
                backgroundColor: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', border: `2px solid ${PAPER}`,
              }}>{p.emoji}</div>
              <div style={{ transform: 'skewX(5deg)', minWidth: 0 }}>
                <div style={{
                  fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                  fontSize: '16px', color: p.color, textTransform: 'uppercase', letterSpacing: '0px',
                }}>{p.name}</div>
                <div style={{
                  fontFamily: FONT, fontStyle: 'italic',
                  fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px',
                }}>{p.domain} — {p.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
