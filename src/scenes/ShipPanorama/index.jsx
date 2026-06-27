import React, { useState, useCallback } from 'react';
import { ShipCanvas } from './ShipCanvas';
import { ZoneHover } from './ZoneHover';
import { LaunchControls } from './LaunchControls';
import { ZoneScene } from './ZoneScene';
import { COLORS } from '../../config/constants';

/**
 * 场景1: 船全景启动画面
 * - Pixi.js 动态飞船 + 废墟背景 + 区域标注(高亮+折线+文字)
 * - 左侧控键面板 (白-红)
 * - 点击标注区域 → 跳转子场景
 */
export const ShipPanorama = ({ onNavigateToDialogue }) => {
  const [phase, setPhase] = useState('idle'); // idle | zooming | launched
  const [activeZone, setActiveZone] = useState(null); // hover 中的热区
  const [enteredZone, setEnteredZone] = useState(null); // 点击进入的子场景
  const [shipZones, setShipZones] = useState(null);

  // Pixi 飞船就绪后获取热区数据
  const handleShipReady = useCallback((zones) => {
    setShipZones(zones);
  }, []);

  // 鼠标移动 → 检测热区 (标注已经画在 canvas 上, 这里仅用于指针样式变化)
  const handleMouseMove = useCallback((e) => {
    if (!shipZones || phase !== 'launched') return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 放大后船在中间, 缩放因子 ~0.7
    const scale = 0.7;
    const cx = el.offsetWidth * 0.5;
    const cy = el.offsetHeight * 0.5;

    let found = null;
    for (const zone of Object.values(shipZones)) {
      const zx = cx + zone.x * scale;
      const zy = cy + zone.y * scale;
      const zw = zone.width * scale;
      const zh = zone.height * scale;
      if (x >= zx && x <= zx + zw && y >= zy && y <= zy + zh) {
        found = zone;
        break;
      }
    }
    if (found?.id !== activeZone?.id) {
      setActiveZone(found);
    }
  }, [shipZones, phase, activeZone]);

  // 点击热区 → 进入子场景
  const handleClick = useCallback((e) => {
    if (!activeZone || phase !== 'launched') return;
    setEnteredZone(activeZone);
  }, [activeZone, phase]);

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

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.ANARCHY_BLACK,
        overflow: 'hidden',
        cursor: activeZone ? 'pointer' : (phase === 'launched' ? 'crosshair' : 'default'),
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Pixi.js 飞船画布 (含区域标注) */}
      <ShipCanvas phase={phase} onShipReady={handleShipReady} />

      {/* 左侧控件面板 */}
      <LaunchControls phase={phase} onLaunch={handleLaunch} />

      {/* 热区 hover 指示 (轻量提示已选区域) */}
      <ZoneHover zone={activeZone} visible={phase === 'launched' && !!activeZone && !enteredZone} />

      {/* 子场景 (船员室/作战会议室等) */}
      {enteredZone && (
        <ZoneScene
          zone={enteredZone}
          onBack={handleBackFromZone}
          onEnterDialogue={handleEnterDialogue}
        />
      )}
    </div>
  );
};
