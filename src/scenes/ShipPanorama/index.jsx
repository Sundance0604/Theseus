import React, { useState, useCallback } from 'react';
import { ShipCanvas } from './ShipCanvas';
import { LaunchControls } from './LaunchControls';
import { ZoneScene } from './ZoneScene';

/** 静态区域定义 (英文) */
const ZONE_DEFS = {
  crew:       { id: 'crew',       label: 'CREW QUARTERS',      sub: 'Select crew member',  color: '#FFB7C5' },
  warRoom:    { id: 'warRoom',    label: 'WAR ROOM',           sub: 'Multi-character seminar', color: '#4169E1' },
  captain:    { id: 'captain',    label: "CAPTAIN'S CABIN",    sub: 'Personal dashboard',  color: '#DAA520' },
  engine:     { id: 'engine',     label: 'ENGINE ROOM',        sub: 'System status',       color: '#228B22' },
  archive:    { id: 'archive',    label: 'ARCHIVE',            sub: 'Historical records',  color: '#708090' },
  memoryWard: { id: 'memoryWard', label: 'MEMORY WARD',        sub: 'Isolated memory',     color: '#FFD700' },
};

export const ShipPanorama = ({
  personas,
  onNavigateToDialogue,
}) => {
  const [phase, setPhase] = useState('idle');
  const [enteredZone, setEnteredZone] = useState(null);

  // 点击左侧导航按钮 → 进入对应子场景
  const handleNavigateZone = useCallback((zoneId) => {
    setEnteredZone(ZONE_DEFS[zoneId] || null);
  }, []);

  const handleLaunch = useCallback(() => {
    setPhase('zooming');
    setTimeout(() => setPhase('launched'), 1500);
  }, []);

  const handleBackFromZone = useCallback(() => setEnteredZone(null), []);

  const handleEnterDialogue = useCallback((zoneId) => {
    // 信息框消失 → Ship 放大 → 跳转对话
    setEnteredZone(null);
    setPhase('zooming');
    setTimeout(() => {
      setPhase('launched');
      if (onNavigateToDialogue) onNavigateToDialogue(zoneId);
    }, 1200);
  }, [onNavigateToDialogue]);

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      overflow: 'hidden',
    }}>
      <ShipCanvas phase={phase} />

      <LaunchControls
        phase={phase}
        onLaunch={handleLaunch}
        onNavigateZone={handleNavigateZone}
      />

      {enteredZone && (
        <ZoneScene
          zone={enteredZone}
          personas={personas}
          onBack={handleBackFromZone}
          onEnterDialogue={handleEnterDialogue}
        />
      )}
    </div>
  );
};
