import React, { useState, useCallback } from 'react';
import { ShipCanvas } from './ShipCanvas';
import { ZoneHover } from './ZoneHover';
import { LaunchControls } from './LaunchControls';
import { ZoneScene } from './ZoneScene';
import { COLORS } from '../../config/constants';

/**
 * 场景1: 船全景启动画面
 * - Pixi.js 动态飞船 + 废墟背景 + 区域标注(高亮+折线+文字)
 * - 左侧控件面板：
 *   - 启动前: 标题 + "开始航行" 按钮
 *   - 启动后: 5 个区域导航按钮，点击直接跳转
 */
export const ShipPanorama = ({ onNavigateToDialogue }) => {
  const [phase, setPhase] = useState('idle');
  const [showingZone, setShowingZone] = useState(null);   // 当前高亮的区域 ID
  const [enteredZone, setEnteredZone] = useState(null);
  const [shipZones, setShipZones] = useState(null);

  const handleShipReady = useCallback((zones) => {
    setShipZones(zones);
  }, []);

  // 点击左侧导航按钮 → 高亮对应区域
  const handleNavigateZone = useCallback((zoneId) => {
    // 高亮视觉反馈
    setShowingZone(zoneId);
    setTimeout(() => {
      // 进入子场景
      if (shipZones?.[zoneId]) {
        setEnteredZone(shipZones[zoneId]);
      }
      setShowingZone(null);
    }, 300);
  }, [shipZones]);

  // 点击 "开始航行"
  const handleLaunch = useCallback(() => {
    setPhase('zooming');
    setTimeout(() => setPhase('launched'), 1500);
  }, []);

  // 从子场景返回
  const handleBackFromZone = useCallback(() => {
    setEnteredZone(null);
  }, []);

  // 从子场景进入对话
  const handleEnterDialogue = useCallback((zoneId) => {
    if (onNavigateToDialogue) {
      onNavigateToDialogue(zoneId);
    }
  }, [onNavigateToDialogue]);

  // 给飞船区域闪烁高亮效果
  const highlightStyle = showingZone && shipZones?.[showingZone]
    ? {
        borderColor: shipZones[showingZone].color || COLORS.P5R_RED,
        boxShadow: `0 0 30px ${shipZones[showingZone].color || COLORS.P5R_RED}, inset 0 0 30px ${shipZones[showingZone].color || COLORS.P5R_RED}33`,
      }
    : {};

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.ANARCHY_BLACK,
        overflow: 'hidden',
        ...highlightStyle,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Pixi.js 飞船画布 */}
      <ShipCanvas phase={phase} onShipReady={handleShipReady} />

      {/* 左侧控件面板 */}
      <LaunchControls
        phase={phase}
        onLaunch={handleLaunch}
        onNavigateZone={handleNavigateZone}
      />

      {/* 子场景 */}
      {enteredZone && (
        <ZoneScene
          zone={enteredZone}
          onBack={handleBackFromZone}
          onEnterDialogue={handleEnterDialogue}
        />
      )}

      {/* 导航动画 */}
      <style>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: skewX(-3deg) translateX(-20px); }
          to { opacity: 1; transform: skewX(-3deg) translateX(0); }
        }
      `}</style>
    </div>
  );
};
