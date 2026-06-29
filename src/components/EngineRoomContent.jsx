import React, { useEffect, useState } from 'react';
import { getEngineRoomStats } from '../api/claudeBridge';
import { COLORS } from '../config/constants';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

/**
 * ENGINE ROOM — 引擎室统计面板
 * 每次打开时重新拉取数据，显示三行核心指标
 */
export const EngineRoomContent = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 加载中
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{
          margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
          fontSize: '16px', color: COLORS.PAPER, textTransform: 'uppercase',
          letterSpacing: '2px', animation: 'engineBlink 0.8s infinite steps(1)',
        }}>
          SCANNING SYSTEMS...
        </p>
        <style>{`@keyframes engineBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    );
  }

  // 错误
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{
          margin: '0 0 12px', fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
          fontSize: '14px', color: COLORS.ANARCHY_RED, textTransform: 'uppercase',
        }}>
          ⚠ DATA LINK FAILURE
        </p>
        <p style={{
          margin: '0 0 16px', fontFamily: FONT, fontStyle: 'italic',
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
    );
  }

  // 空数据
  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <p style={{
          margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
          fontSize: '15px', color: COLORS.PAPER, opacity: 0.5, textTransform: 'uppercase',
        }}>
          NO DATA AVAILABLE
        </p>
      </div>
    );
  }

  const { startups, projectSessions, projectMessages, totalUserMessages } = stats;
  const projectSlugs = Object.keys(projectSessions).sort();

  // 数据卡片样式
  const statCardStyle = {
    backgroundColor: COLORS.ANARCHY_BLACK,
    border: `2px solid ${COLORS.PAPER}`,
    transform: 'skewX(-6deg)',
    padding: '14px 22px',
    boxShadow: `6px 6px 0px ${COLORS.ANARCHY_BLACK}`,
  };

  const statNumberStyle = {
    display: 'inline-block', transform: 'skewX(6deg)',
    fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
    fontSize: '36px', lineHeight: 1.0,
    color: COLORS.ANARCHY_RED,
    textShadow: `3px 3px 0px ${COLORS.ANARCHY_BLACK}`,
  };

  const statLabelStyle = {
    display: 'block', transform: 'skewX(6deg)',
    fontFamily: FONT, fontStyle: 'italic',
    fontSize: '12px', color: COLORS.PAPER, opacity: 0.7,
    textTransform: 'uppercase', letterSpacing: '1px',
    marginTop: '4px',
  };

  return (
    <div>
      {/* ---- 三大核心指标 ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '18px',
        marginBottom: '28px',
      }}>
        {/* 用户消息总数 */}
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{totalUserMessages.toLocaleString()}</span>
          <span style={statLabelStyle}>TOTAL MESSAGES</span>
        </div>

        {/* Claude Code 启动次数 */}
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{startups}</span>
          <span style={statLabelStyle}>CLAUDE STARTUPS</span>
        </div>

        {/* 项目会话总数 */}
        <div style={{
          ...statCardStyle,
        }}>
          <span style={statNumberStyle}>
            {Object.values(projectSessions).reduce((a, b) => a + b, 0)}
          </span>
          <span style={statLabelStyle}>TOTAL SESSIONS</span>
        </div>
      </div>

      {/* ---- 分割线 ---- */}
      <div style={{
        width: '100%', height: '2px',
        backgroundColor: COLORS.PAPER, opacity: 0.3,
        marginBottom: '20px',
        boxShadow: `2px 2px 0px ${COLORS.ANARCHY_BLACK}`,
      }} />

      {/* ---- 每个项目详情 ---- */}
      <p style={{
        fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
        fontSize: '14px', color: COLORS.PAPER, opacity: 0.7,
        textTransform: 'uppercase', letterSpacing: '2px',
        marginBottom: '14px',
      }}>
        PER-PROJECT BREAKDOWN
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {projectSlugs.map((slug) => {
          const sessions = projectSessions[slug] || 0;
          const messages = projectMessages[slug] || 0;

          return (
            <div
              key={slug}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: COLORS.ANARCHY_BLACK,
                border: `1px solid ${COLORS.PAPER}`,
                borderLeftWidth: '4px',
                transform: 'skewX(-4deg)',
                opacity: sessions > 0 ? 1 : 0.4,
                boxShadow: `3px 3px 0px ${COLORS.ANARCHY_BLACK}`,
              }}
            >
              {/* 项目名 */}
              <span style={{
                display: 'inline-block', transform: 'skewX(4deg)',
                fontFamily: FONT, fontStyle: 'italic', fontWeight: '900',
                fontSize: '14px', color: COLORS.PAPER,
                textTransform: 'uppercase', letterSpacing: '1px',
                minWidth: '120px',
              }}>
                {slug}
              </span>

              {/* 数据条 */}
              <div style={{
                display: 'flex', gap: '20px',
                transform: 'skewX(4deg)',
              }}>
                <span style={{
                  fontFamily: FONT, fontStyle: 'italic',
                  fontSize: '12px', color: COLORS.PAPER, opacity: 0.6,
                  textTransform: 'uppercase',
                }}>
                  <span style={{ color: COLORS.ANARCHY_RED, fontWeight: '900', fontSize: '16px' }}>
                    {sessions}
                  </span>{' '}
                  sessions
                </span>
                <span style={{
                  fontFamily: FONT, fontStyle: 'italic',
                  fontSize: '12px', color: COLORS.PAPER, opacity: 0.6,
                  textTransform: 'uppercase',
                }}>
                  <span style={{ color: COLORS.ANARCHY_RED, fontWeight: '900', fontSize: '16px' }}>
                    {messages}
                  </span>{' '}
                  msgs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- 底部刷新 ---- */}
      <div style={{
        marginTop: '22px', textAlign: 'right',
      }}>
        <button
          onClick={fetchStats}
          style={{
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
    </div>
  );
};
