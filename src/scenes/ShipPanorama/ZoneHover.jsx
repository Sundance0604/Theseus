import React from 'react';
import { COLORS } from '../../config/constants';

/**
 * 飞船热区 hover 提示浮层
 * 显示区域名称和简短描述
 */
export const ZoneHover = ({ zone, visible }) => {
  if (!visible || !zone) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 25,
      pointerEvents: 'none',
      animation: 'zoneFadeIn 0.25s ease-out',
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        border: `2px solid ${zone.color || COLORS.P5R_RED}`,
        padding: '14px 24px',
        transform: 'skewX(-5deg)',
        boxShadow: `8px 8px 0px rgba(0,0,0,0.7)`,
      }}>
        <div style={{ transform: 'skewX(5deg)' }}>
          {/* 区域名称 */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            color: zone.color || COLORS.WHITE,
            letterSpacing: '3px',
            marginBottom: '4px',
          }}>
            {zone.label}
          </div>
          {/* 英文副标题 */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#999',
            letterSpacing: '1px',
          }}>
            {zone.sub}
          </div>
          {/* 点击提示 */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            color: zone.color || COLORS.P5R_RED,
            letterSpacing: '2px',
            marginTop: '8px',
            opacity: 0.8,
          }}>
            [ 点击进入 ]
          </div>
        </div>
      </div>

      {/* 向下的三角箭头 */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${zone.color || COLORS.P5R_RED}`,
        margin: '0 auto',
      }} />

      <style>{`
        @keyframes zoneFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};
