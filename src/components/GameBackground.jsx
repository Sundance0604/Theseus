import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

function hexToPixi(hex) {
  const cleaned = hex.replace('#', '');
  return parseInt(cleaned, 16);
}

export const GameBackground = ({ partReplacement, activeColor = '#D32F2F' }) => {
  const canvasRef = useRef(null);
  const isInitialized = useRef(false);
  const activeColorRef = useRef(activeColor);
  const partReplacementRef = useRef(partReplacement);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    partReplacementRef.current = partReplacement;
  }, [partReplacement]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const app = new PIXI.Application();
    let skewBlock = null;
    let isDestroyed = false;

    app.init({ resizeTo: window, backgroundColor: 0x1a1a1a }).then(() => {
      if (isDestroyed) {
        app.destroy(true, { children: true });
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
        const blockColor = partReplacementRef.current === 100
          ? 0x1A237E
          : hexToPixi(activeColorRef.current);
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
        try { app.destroy(true, { children: true }); } catch {}
      }, 0);
    };
  }, []);

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
