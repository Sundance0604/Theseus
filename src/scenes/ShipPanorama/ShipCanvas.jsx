import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

/* ==========================================================================
   ShipCanvas — 全屏红底 + 旋转方形背景 + 居中虚空舰
   React 19 + Pixi.js v8
   ========================================================================== */
export const ShipCanvas = ({ phase, onShipReady }) => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    const app = new PIXI.Application();

    app.init({
      resizeTo: window,
      backgroundColor: 0xD40000,   // 安那其大红全屏填充
      antialias: true,
    }).then(async () => {
      if (destroyed) { app.destroy(true); return; }
      canvasRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // ================================================================
      // 1. 加载纹理
      // ================================================================
      const [bgTex, shipTex] = await Promise.all([
        PIXI.Assets.load('/background.png'),
        PIXI.Assets.load('/ship.png'),
      ]);

      // ================================================================
      // 2. 旋转方形背景 — 居中占据视口大片区域
      // ================================================================
      const squareBg = new PIXI.Sprite(bgTex);
      squareBg.anchor.set(0.5);
      // 缩放: 覆盖视口短边的 90%
      const bgSize = Math.min(app.screen.width, app.screen.height) * 0.95;
      const bgScale = bgSize / Math.max(squareBg.texture.width, squareBg.texture.height);
      squareBg.scale.set(bgScale);
      // 死死居中
      squareBg.x = app.screen.width * 0.5;
      squareBg.y = app.screen.height * 0.5;
      app.stage.addChild(squareBg);

      // ================================================================
      // 3. 虚空舰 — 叠在方形背景正中央，缩放至完全位于背景内
      // ================================================================
      const shipContainer = new PIXI.Container();
      const ship = new PIXI.Sprite(shipTex);
      ship.anchor.set(0.5);
      // 缩放: 虚空舰约占方形背景内切圆直径的 65%（确保旋转时也完全在内）
      const shipMaxSize = bgSize * 0.75;
      const shipBaseScale = shipMaxSize / Math.max(ship.texture.width, ship.texture.height);
      ship.scale.set(shipBaseScale);
      shipContainer.addChild(ship);
      // 与方形背景同一中心
      shipContainer.x = app.screen.width * 0.5;
      shipContainer.y = app.screen.height * 0.5;
      app.stage.addChild(shipContainer);

      // ================================================================
      // 4. 静态空热区 (暂不实现点击逻辑，仅为兼容父组件)
      // ================================================================
      const dummyZones = {};
      if (onShipReady) onShipReady(dummyZones);

      // ================================================================
      // 5. 主循环：仅旋转方形背景
      // ================================================================
      app.ticker.add((ticker) => {
        // 方形背景高速旋转
        squareBg.rotation += ticker.deltaTime * 0.075;

        // 虚空舰不动 — rotation 始终为 0

        // phase 缩放动画
        if (phase === 'zooming') {
          const target = shipBaseScale * 1.8;
          ship.scale.set(ship.scale.x + (target - ship.scale.x) * 0.03);
        } else if (phase === 'idle') {
          ship.scale.set(ship.scale.x + (shipBaseScale - ship.scale.x) * 0.02);
        }
      });
    });

    return () => {
      destroyed = true;
      try { app.destroy(true, { children: true, texture: true }); } catch (_) {}
    };
  }, [phase]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0,
      }}
    />
  );
};
