import React, { useEffect, useState, useCallback } from 'react';
import { getEngineRoomStats } from '../../api/claudeBridge';
import { COLORS } from '../../config/constants';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

/**
 * ENGINE ROOM — 独立全屏场景
 * 背景: engine.png，项目列表可滚动
 */
export const EngineRoomScene = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEngineRoomStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 50,
      display: 'flex', flexDirection: 'column',
      // engine.png 作为背景
      backgroundImage: `url('/engine.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: COLORS.ANARCHY_BLACK,
    }}>
      {/* ---- 顶部导航栏 ---- */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '18px 36px',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: `3px solid ${COLORS.PAPER}`,
            color: COLORS.PAPER,
            padding: '8px 22px',
            fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
            fontSize: '14px', letterSpacing: '0px', textTransform: 'uppercase',
            cursor: 'pointer',
            transform: 'skewX(-8deg)',
            boxShadow: `4px 4px 0px ${COLORS.ANARCHY_BLACK}`,
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>← DECK</span>
        </button>

        <h2 style={{
          margin: 0,
          color: COLORS.PAPER,
          fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
          fontSize: '28px', letterSpacing: '-0.5px', textTransform: 'uppercase',
          textShadow: `4px 4px 0px ${COLORS.ANARCHY_BLACK}`,
        }}>
          ENGINE ROOM
        </h2>

        {/* 刷新按钮 */}
        <button
          onClick={fetchStats}
          style={{
            marginLeft: 'auto',
            padding: '6px 18px',
            fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
            fontSize: '11px', textTransform: 'uppercase',
            color: COLORS.PAPER,
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.PAPER}`,
            cursor: 'pointer', letterSpacing: '1px',
            transform: 'skewX(-8deg)',
            boxShadow: `3px 3px 0px ${COLORS.ANARCHY_BLACK}`,
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>⟳ REFRESH</span>
        </button>
      </div>

      {/* ---- 主内容区 ---- */}
      <div style={{
        flex: 1,
        padding: '0 48px 24px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 数据面板容器（无背景，透明融入引擎室背景） */}
        <div style={{
          flex: 1,
          padding: '32px 40px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{
                margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '18px', color: COLORS.PAPER, textTransform: 'uppercase',
                letterSpacing: '2px', animation: 'engineBlink 0.8s infinite steps(1)',
              }}>
                SCANNING SYSTEMS...
              </p>
              <style>{`@keyframes engineBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{
                margin: '0 0 12px', fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '16px', color: COLORS.ANARCHY_RED, textTransform: 'uppercase',
              }}>
                ⚠ DATA LINK FAILURE
              </p>
              <p style={{
                margin: '0 0 20px', fontFamily: FONT, fontStyle: 'italic',
                fontSize: '11px', color: COLORS.PAPER, opacity: 0.6,
              }}>
                {error}
              </p>
              <button
                onClick={fetchStats}
                style={{
                  padding: '8px 24px',
                  fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                  fontSize: '13px', textTransform: 'uppercase',
                  color: COLORS.PAPER,
                  backgroundColor: COLORS.ANARCHY_BLACK,
                  border: `2px solid ${COLORS.ANARCHY_RED}`,
                  cursor: 'pointer', letterSpacing: '1px',
                  transform: 'skewX(-8deg)',
                }}
              >
                <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>RETRY</span>
              </button>
            </div>
          )}

          {!loading && !error && !stats && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{
                margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '16px', color: COLORS.PAPER, opacity: 0.5, textTransform: 'uppercase',
              }}>
                NO DATA AVAILABLE
              </p>
            </div>
          )}

          {stats && (
            <EngineRoomDashboard stats={stats} />
          )}
        </div>
      </div>
    </div>
  );
};

/** 引擎室数据面板（纯展示，不负责 fetch） */
function EngineRoomDashboard({ stats }) {
  const { startups, projectSessions, projectMessages, totalUserMessages } = stats;
  const projectSlugs = Object.keys(projectSessions).sort();

  const statCardStyle = {
    backgroundColor: COLORS.ANARCHY_BLACK,
    border: `2px solid ${COLORS.PAPER}`,
    transform: 'perspective(500px) rotateX(5deg)',
    padding: '16px 24px',
    boxShadow: `6px 6px 0px ${COLORS.ANARCHY_BLACK}`,
  };

  const statNumberStyle = {
    display: 'inline-block', transform: 'perspective(500px) rotateX(-5deg)',
    fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
    fontSize: '38px', lineHeight: 1.0,
    color: COLORS.ANARCHY_RED,
    textShadow: `3px 3px 0px ${COLORS.ANARCHY_BLACK}`,
  };

  const statLabelStyle = {
    display: 'block', transform: 'perspective(500px) rotateX(-5deg)',
    fontFamily: FONT, fontStyle: 'italic',
    fontSize: '12px', color: COLORS.PAPER, opacity: 0.7,
    textTransform: 'uppercase', letterSpacing: '1px',
    marginTop: '4px',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* ---- 三大核心指标（固定） ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px',
        flexShrink: 0,
      }}>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{totalUserMessages.toLocaleString()}</span>
          <span style={statLabelStyle}>TOTAL MESSAGES</span>
        </div>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{startups}</span>
          <span style={statLabelStyle}>CLAUDE STARTUPS</span>
        </div>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>
            {Object.values(projectSessions).reduce((a, b) => a + b, 0)}
          </span>
          <span style={statLabelStyle}>TOTAL SESSIONS</span>
        </div>
      </div>

      {/* ---- 分割线（固定） ---- */}
      <div style={{
        width: '100%', height: '2px',
        backgroundColor: COLORS.PAPER, opacity: 0.25,
        marginBottom: '16px',
        flexShrink: 0,
      }} />

      {/* ---- 项目详情标题（固定） ---- */}
      <p style={{
        fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
        fontSize: '14px', color: COLORS.PAPER, opacity: 0.7,
        textTransform: 'uppercase', letterSpacing: '2px',
        marginBottom: '12px',
        flexShrink: 0,
      }}>
        PER-PROJECT BREAKDOWN
      </p>

      {/* ---- 项目列表（可滚动 ★） ---- */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '8px',
        paddingRight: '6px',
      }}>
        {projectSlugs.map((slug) => {
          const sessions = projectSessions[slug] || 0;
          const messages = projectMessages[slug] || 0;

          return (
            <div
              key={slug}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: COLORS.ANARCHY_BLACK,
                border: `1px solid ${COLORS.PAPER}`,
                borderLeftWidth: '4px',
                transform: 'perspective(500px) rotateX(4deg)',
                opacity: sessions > 0 ? 1 : 0.35,
                boxShadow: `3px 3px 0px ${COLORS.ANARCHY_BLACK}`,
                flexShrink: 0,
              }}
            >
              <span style={{
                display: 'inline-block', transform: 'perspective(500px) rotateX(-4deg)',
                fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '13px', color: COLORS.PAPER,
                textTransform: 'uppercase', letterSpacing: '1px',
                flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {slug}
              </span>

              <div style={{
                display: 'flex', gap: '24px',
                transform: 'perspective(500px) rotateX(-4deg)',
                flexShrink: 0, marginLeft: '16px',
              }}>
                <span style={{
                  fontFamily: FONT, fontStyle: 'italic',
                  fontSize: '12px', color: COLORS.PAPER, opacity: 0.6,
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  <span style={{ color: COLORS.ANARCHY_RED, fontWeight: '900', fontSize: '16px' }}>
                    {sessions}
                  </span>
                  {' '}sessions
                </span>
                <span style={{
                  fontFamily: FONT, fontStyle: 'italic',
                  fontSize: '12px', color: COLORS.PAPER, opacity: 0.6,
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  <span style={{ color: COLORS.ANARCHY_RED, fontWeight: '900', fontSize: '16px' }}>
                    {messages}
                  </span>
                  {' '}msgs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
