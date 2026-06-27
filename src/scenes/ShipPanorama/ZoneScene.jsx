import React from 'react';
import { PERSONAS } from '../../config/personas';
import { COLORS } from '../../config/constants';

/**
 * 子场景：进入飞船不同区域后的交互界面
 * - 船员室 → 选择船员交流
 * - 作战会议室 → 多人研讨
 * - 船长室 → 个人看板
 * - 引擎室 → 系统状态
 * - 档案室 → 历史记录
 */
export const ZoneScene = ({ zone, onBack, onEnterDialogue }) => {
  if (!zone) return null;

  const zoneStyles = getZoneStyle(zone.id);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 30,
      backgroundColor: 'rgba(0,0,0,0.92)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'sceneFadeIn 0.35s ease-out',
    }}>
      <div style={{
        backgroundColor: COLORS.ANARCHY_BLACK,
        border: `3px solid ${zone.color}`,
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80%',
        padding: '30px',
        transform: 'skewX(-3deg)',
        boxShadow: `12px 12px 0px ${COLORS.BLACK}`,
        overflowY: 'auto',
      }}>
        <div style={{ transform: 'skewX(3deg)' }}>
          {/* 标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: `2px solid ${zone.color}`,
                color: zone.color,
                padding: '6px 14px',
                fontFamily: 'monospace',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← 甲板
            </button>
            <h2 style={{
              margin: 0,
              color: zone.color,
              fontFamily: 'monospace',
              fontSize: '22px',
              letterSpacing: '3px',
            }}>
              {zone.label} // {zone.sub}
            </h2>
          </div>

          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: zone.color,
            marginBottom: '24px',
            opacity: 0.5,
          }} />

          {/* 区域特有内容 */}
          {renderZoneContent(zone, zoneStyles, onEnterDialogue)}
        </div>
      </div>

      <style>{`
        @keyframes sceneFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

function renderZoneContent(zone, style, onEnterDialogue) {
  switch (zone.id) {
    case 'crew':
      return <CrewQuartersContent onEnterDialogue={onEnterDialogue} />;
    case 'warRoom':
      return <WarRoomContent />;
    case 'captain':
      return <CaptainsCabinContent />;
    case 'engine':
      return <EngineRoomContent />;
    case 'archive':
      return <ArchiveContent />;
    default:
      return <p style={{ color: '#999', fontFamily: 'monospace' }}>该区域正在建设中...</p>;
  }
}

/* ---- 船员室 ---- */
function CrewQuartersContent({ onEnterDialogue }) {
  const crewIds = ['cindy', 'noodles', 'valse', 'orc', 'pavane', 'sofies', 'socrates', 'lin'];
  return (
    <div>
      <p style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', marginBottom: '20px', letterSpacing: '1px' }}>
        选择一位船员进行 1v1 对话。每位船员拥有独立的人格与记忆。
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {crewIds.map((id) => {
          const p = PERSONAS[id];
          if (!p) return null;
          return (
            <button
              key={id}
              onClick={() => onEnterDialogue(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: `2px solid ${p.color}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* 头像 */}
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: p.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}>
                {p.emoji}
              </div>
              {/* 信息 */}
              <div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: p.color,
                  letterSpacing: '1px',
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: '#777',
                  letterSpacing: '0.5px',
                  marginTop: '2px',
                }}>
                  {p.domain} — {p.tagline}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- 作战会议室 ---- */
function WarRoomContent() {
  return (
    <div>
      <p style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', marginBottom: '16px', letterSpacing: '1px' }}>
        作战会议室 (War Room) 支持多角色环形研讨。Socrates 可随时"闯入"讨论。
      </p>
      <div style={{
        padding: '30px',
        backgroundColor: 'rgba(65,105,225,0.08)',
        border: '1px solid rgba(65,105,225,0.3)',
        textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#4169E1', letterSpacing: '2px' }}>
          🏛️ 研讨室即将开放
        </span>
        <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginTop: '8px' }}>
          多人研讨功能正在开发中...
        </p>
      </div>
    </div>
  );
}

/* ---- 船长室 ---- */
function CaptainsCabinContent() {
  return (
    <div>
      <p style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', marginBottom: '16px', letterSpacing: '1px' }}>
        船长室 (Captain's Cabin) — 你的个人计划看板与船员便签收集处。
      </p>
      <div style={{
        padding: '30px',
        backgroundColor: 'rgba(218,165,32,0.08)',
        border: '1px solid rgba(218,165,32,0.3)',
        textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#DAA520', letterSpacing: '2px' }}>
          ⚓ 船长室即将开放
        </span>
        <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginTop: '8px' }}>
          个人任务看板功能正在开发中...
        </p>
      </div>
    </div>
  );
}

/* ---- 引擎室 ---- */
function EngineRoomContent() {
  return (
    <div>
      <p style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', marginBottom: '16px', letterSpacing: '1px' }}>
        引擎室 (Engine Room) — 系统状态监控与维护。
      </p>
      <div style={{
        padding: '30px',
        backgroundColor: 'rgba(34,139,34,0.08)',
        border: '1px solid rgba(34,139,34,0.3)',
        textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#228B22', letterSpacing: '2px' }}>
          ⚙️ 引擎室
        </span>
        <div style={{ marginTop: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
          <div style={{ color: '#00E676', marginBottom: '4px' }}>DeepSeek API: 连接正常</div>
          <div style={{ color: '#00E676', marginBottom: '4px' }}>Pixi.js Renderer: 运行中</div>
          <div style={{ color: '#FFD700' }}>React 19: 已挂载</div>
        </div>
      </div>
    </div>
  );
}

/* ---- 档案室 ---- */
function ArchiveContent() {
  return (
    <div>
      <p style={{ color: '#999', fontFamily: 'monospace', fontSize: '12px', marginBottom: '16px', letterSpacing: '1px' }}>
        档案室 (Archive) — 历史研讨会记录与知识库。
      </p>
      <div style={{
        padding: '30px',
        backgroundColor: 'rgba(112,128,144,0.08)',
        border: '1px solid rgba(112,128,144,0.3)',
        textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#708090', letterSpacing: '2px' }}>
          📜 档案室
        </span>
        <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginTop: '8px' }}>
          暂无存档记录。开始对话后，历史记录将自动保存于此。
        </p>
      </div>
    </div>
  );
}

function getZoneStyle(zoneId) {
  const styles = {
    crew: { color: '#FFB7C5', accent: 'rgba(255,183,197,0.1)' },
    warRoom: { color: '#4169E1', accent: 'rgba(65,105,225,0.1)' },
    captain: { color: '#DAA520', accent: 'rgba(218,165,32,0.1)' },
    engine: { color: '#228B22', accent: 'rgba(34,139,34,0.1)' },
    archive: { color: '#708090', accent: 'rgba(112,128,144,0.1)' },
  };
  return styles[zoneId] || { color: COLORS.P5R_RED, accent: 'rgba(211,47,47,0.1)' };
}
