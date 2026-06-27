import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export const GameBackground = ({ partReplacement }) => {
  const canvasRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const app = new PIXI.Application();
    let skewBlock = null;
    let isDestroyed = false;

    app.init({ resizeTo: window, backgroundColor: 0x1a1a1a }).then(() => {
      if (isDestroyed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      skewBlock = new PIXI.Graphics();
      app.stage.addChild(skewBlock);

      let time = 0;
      app.ticker.add((ticker) => {
        time += ticker.deltaTime * 0.03;
        const dynamicOffset = Math.sin(time) * 20;

        skewBlock.clear();
        const blockColor = partReplacement === 100 ? 0x1A237E : 0xD32F2F;
        skewBlock.fill(blockColor);

        skewBlock.moveTo(0, 0);
        skewBlock.lineTo(app.screen.width * 0.45, 0);
        skewBlock.lineTo(app.screen.width * 0.3 + dynamicOffset, app.screen.height);
        skewBlock.lineTo(0, app.screen.height);
        skewBlock.fill();
      });
    });

    return () => {
      isDestroyed = true;
      isInitialized.current = false;
      setTimeout(() => {
        try { app.destroy(true, { children: true, texture: true }); } catch (e) {}
      }, 0);
    };
  }, [partReplacement]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  );
};