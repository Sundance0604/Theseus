import React, { useEffect, useState } from 'react';

/* ==========================================================================
   ZoneScene — P5R 波普朋克红底白框子场景
   限色: 纯红 #D40000 / 暖白 #F5F0EB / 纯黑 #1A1A1A
   无抖动动画，简洁硬朗
   ========================================================================== */
const RED = '#D40000';
const PAPER = '#F5F0EB';
const BLACK = '#1A1A1A';
const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

/* ---- P5R 头像选中抖动关键帧 ---- */
const SHAKE_KEYFRAMES = `
@keyframes p5r-avatar-shake {
   0%   { transform: skewX(-5deg) scale(1.05) translate(0, 0) rotate(0deg); }
  15%   { transform: skewX(-5deg) scale(1.05) translate(-2px,  1px) rotate(-1.2deg); }
  30%   { transform: skewX(-5deg) scale(1.05) translate( 2px, -1px) rotate( 1.5deg); }
  45%   { transform: skewX(-5deg) scale(1.05) translate(-1px, -2px) rotate(-0.8deg); }
  60%   { transform: skewX(-5deg) scale(1.05) translate( 3px,  2px) rotate( 1.3deg); }
  75%   { transform: skewX(-5deg) scale(1.05) translate(-3px,  1px) rotate(-1.8deg); }
  90%   { transform: skewX(-5deg) scale(1.05) translate( 1px, -2px) rotate( 0.9deg); }
 100%   { transform: skewX(-5deg) scale(1.05) translate( 0,  0) rotate(0deg); }
}`;

export const ZoneScene = ({ zone, personas, onBack, onEnterDialogue, onConfirmWarRoom, onNavigateToEngineRoom }) => {
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
          {renderZoneContent(zone, personas, onEnterDialogue, onConfirmWarRoom, onNavigateToEngineRoom)}
        </div>
      </div>

      <style>{`@keyframes sceneFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

function renderZoneContent(zone, personas, onEnterDialogue, onConfirmWarRoom, onNavigateToEngineRoom) {
  switch (zone.id) {
    case 'crew':       return <CrewQuartersContent personas={personas} onEnterDialogue={onEnterDialogue} />;
    case 'warRoom':    return <WarRoomContent personas={personas} onConfirm={onConfirmWarRoom} />;
    case 'captain':    return <InfoPlaceholder label="CAPTAIN'S CABIN" desc="Personal dashboard — coming soon." />;
    case 'engine':     return <EngineRoomBridge onNavigate={onNavigateToEngineRoom} />;
    case 'archive':    return <InfoPlaceholder label="ARCHIVE" desc="Historical records — coming soon." />;
    case 'memoryWard': return <InfoPlaceholder label="MEMORY WARD" desc="Isolated memory viewer — coming soon." />;
    default:           return null;
  }
}

/** 引擎室桥接组件 — 挂载后立即触发跳转 */
function EngineRoomBridge({ onNavigate }) {
  useEffect(() => {
    onNavigate?.();
  }, [onNavigate]);
  return null;
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
function CrewQuartersContent({ personas = [], onEnterDialogue }) {
  return (
    <div>
      <p style={{ fontFamily: FONT, fontStyle: 'italic', fontSize: '14px', color: PAPER, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
        SELECT A CREW MEMBER FOR 1-ON-1 DIALOGUE
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '14px', justifyContent: 'center' }}>
        {personas.map(p => {
          return (
            <button
              key={p.id}
              onClick={() => onEnterDialogue(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                padding: '16px 10px 12px',
                backgroundColor: BLACK,
                border: `2px solid ${p.color || PAPER}`,
                cursor: 'pointer',
                transform: 'skewX(-5deg)',
                boxShadow: `5px 5px 0px ${BLACK}`,
                transition: 'transform 0.15s ease, background-color 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'skewX(-5deg) scale(1.05)';
                e.currentTarget.style.backgroundColor = '#0D0D0D';
                e.currentTarget.style.borderColor = PAPER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'skewX(-5deg) scale(1)';
                e.currentTarget.style.backgroundColor = BLACK;
                e.currentTarget.style.borderColor = p.color || PAPER;
              }}
            >
              {/* 头像 */}
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${p.color || PAPER}`,
                backgroundColor: '#1A1A1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'skewX(5deg)',
              }}>
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '28px' }}>{p.emoji || '◆'}</span>
                )}
              </div>

              {/* 名字（头像底部） */}
              <div style={{
                transform: 'skewX(5deg)',
                fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '15px', color: p.color || PAPER,
                textTransform: 'uppercase', letterSpacing: '0px',
                textAlign: 'center',
              }}>
                {p.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
/* ---- 战争室：多选船员（本地配置的主持人默认必选） ---- */
function WarRoomContent({ personas = [], onConfirm }) {
  const facilitator = personas.find(p => p.isFacilitator) || null;
  const [selectedIds, setSelectedIds] = useState(() => {
    if (facilitator) return [facilitator.id];
    return [];
  });

  useEffect(() => {
    if (!facilitator) return;
    setSelectedIds(prev => (
      prev.includes(facilitator.id) ? prev : [facilitator.id, ...prev]
    ));
  }, [facilitator]);

  const toggleCrew = (personaId) => {
    if (personaId === facilitator?.id) return;
    setSelectedIds(prev => {
      if (prev.includes(personaId)) {
        return prev.filter(id => id !== personaId);
      }
      return [...prev, personaId];
    });
  };

  const isFacilitator = (id) => id === facilitator?.id;
  const isSelected = (id) => selectedIds.includes(id);
  const selectedPersonas = personas.filter(p => selectedIds.includes(p.id));
  const guestCount = selectedIds.filter(id => id !== facilitator?.id).length;
  const canConvene = Boolean(facilitator && guestCount > 0);

  // 将网格排序：主持人始终排第一
  const sortedPersonas = [...personas].sort((a, b) => {
    if (a.isFacilitator) return -1;
    if (b.isFacilitator) return 1;
    return 0;
  });

  return (
    <div>
      <style>{SHAKE_KEYFRAMES}</style>

      <p style={{
        fontFamily: FONT, fontStyle: 'italic', fontSize: '14px',
        color: PAPER, opacity: 0.85, textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '20px',
      }}>
        SELECT PARTICIPANTS FOR WAR ROOM SEMINAR
      </p>

      {/* ---- 角色选择网格 ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '14px',
        justifyContent: 'center',
        marginBottom: '28px',
      }}>
        {sortedPersonas.map(p => {
          const checked = isSelected(p.id);
          const locked = isFacilitator(p.id);

          return (
            <button
              key={p.id}
              onClick={() => toggleCrew(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                padding: '16px 10px 12px',
                backgroundColor: checked ? '#0D0D0D' : BLACK,
                border: checked
                  ? `3px solid ${PAPER}`
                  : `2px solid ${p.color || PAPER}`,
                cursor: locked ? 'not-allowed' : 'pointer',
                transform: 'skewX(-5deg)',
                boxShadow: checked
                  ? `5px 5px 0px ${PAPER}`
                  : `5px 5px 0px ${BLACK}`,
                transition: 'transform 0.15s ease, background-color 0.12s, border-color 0.12s, box-shadow 0.12s',
                animation: checked ? 'p5r-avatar-shake 0.22s infinite linear' : 'none',
                opacity: locked ? 1 : (checked ? 1 : 0.55),
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (locked) return;
                e.currentTarget.style.transform = 'skewX(-5deg) scale(1.05)';
                e.currentTarget.style.backgroundColor = '#0D0D0D';
                if (!checked) e.currentTarget.style.borderColor = PAPER;
              }}
              onMouseLeave={e => {
                if (locked) return;
                if (checked) {
                  e.currentTarget.style.transform = 'skewX(-5deg) scale(1.05)';
                  e.currentTarget.style.backgroundColor = '#0D0D0D';
                  e.currentTarget.style.borderColor = PAPER;
                } else {
                  e.currentTarget.style.transform = 'skewX(-5deg) scale(1)';
                  e.currentTarget.style.backgroundColor = BLACK;
                  e.currentTarget.style.borderColor = p.color || PAPER;
                }
              }}
            >
              {/* 主持人锁定标记 */}
              {locked && (
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px',
                  backgroundColor: PAPER,
                  border: `2px solid ${BLACK}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '900',
                  color: BLACK, fontFamily: FONT,
                  zIndex: 2, transform: 'skewX(5deg)',
                  boxShadow: `2px 2px 0px ${BLACK}`,
                }}>🔒</div>
              )}

              {/* 选中标记 */}
              {checked && !locked && (
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px',
                  backgroundColor: PAPER,
                  border: `2px solid ${BLACK}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '900',
                  color: RED, fontFamily: FONT,
                  zIndex: 2, transform: 'skewX(5deg)',
                  boxShadow: `2px 2px 0px ${BLACK}`,
                }}>✓</div>
              )}

              {/* 头像 */}
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${checked ? PAPER : (p.color || PAPER)}`,
                backgroundColor: '#1A1A1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'skewX(5deg)',
              }}>
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '28px' }}>{p.emoji || '◆'}</span>
                )}
              </div>

              {/* 名字 */}
              <div style={{
                transform: 'skewX(5deg)',
                fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '15px', color: checked ? PAPER : (p.color || PAPER),
                textTransform: 'uppercase', letterSpacing: '0px',
                textAlign: 'center',
              }}>
                {p.name}
                {locked && <span style={{ fontSize: '9px', color: PAPER, marginLeft: '4px' }}>HOST</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* ---- 已选角色预览 + 确认按钮 ---- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 0 0',
        borderTop: `2px dashed ${PAPER}40`,
      }}>
        {/* 左侧：已选头像缩略条 */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: '10px', color: PAPER,
            textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6,
          }}>
            SELECTED:
          </span>
          {selectedPersonas.map(p => (
            <div key={p.id} style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${p.color || PAPER}`,
              backgroundColor: '#1A1A1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {p.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '14px' }}>{p.emoji || '◆'}</span>
              )}
            </div>
          ))}
          {selectedPersonas.length === 0 && (
            <span style={{
              fontFamily: 'monospace', fontSize: '10px', color: '#666',
              textTransform: 'uppercase',
            }}>NONE</span>
          )}
        </div>

        {/* 右侧：确认按钮 */}
        <button
          onClick={() => onConfirm?.(selectedIds)}
          disabled={!canConvene}
          style={{
            padding: '12px 32px',
            fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
            fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase',
            color: canConvene ? PAPER : '#555',
            backgroundColor: canConvene ? RED : '#222',
            border: `3px solid ${canConvene ? PAPER : '#444'}`,
            cursor: canConvene ? 'pointer' : 'not-allowed',
            transform: 'skewX(-8deg)',
            boxShadow: canConvene
              ? `8px 8px 0px ${BLACK}`
              : 'none',
            transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1), background-color 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={(e) => {
            if (!canConvene) return;
            const el = e.currentTarget;
            el.style.backgroundColor = BLACK;
            el.style.color = PAPER;
            el.style.borderColor = PAPER;
            el.style.boxShadow = `10px 10px 0px ${PAPER}`;
          }}
          onMouseLeave={(e) => {
            if (!canConvene) return;
            const el = e.currentTarget;
            el.style.backgroundColor = RED;
            el.style.color = PAPER;
            el.style.borderColor = PAPER;
            el.style.boxShadow = `8px 8px 0px ${BLACK}`;
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>
            CONVENE ▸
          </span>
        </button>
      </div>
    </div>
  );
}
