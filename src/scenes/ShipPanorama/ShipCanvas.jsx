import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { COLORS } from '../../config/constants';

/**
 * 启动画面 Pixi.js 画布
 * 绘制：科幻飞船 + 文明废墟 + 动态粒子效果
 */
export const ShipCanvas = ({ phase, onShipReady }) => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const shipRef = useRef(null);
  const zonesRef = useRef({});

  useEffect(() => {
    let destroyed = false;
    const app = new PIXI.Application();

    app.init({ resizeTo: window, backgroundColor: 0x1a1a1a, antialias: true }).then(() => {
      if (destroyed) { app.destroy(true); return; }
      canvasRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // ---- 1. 废墟背景层 (视差滚动) ----
      const ruinsLayer = new PIXI.Container();
      app.stage.addChild(ruinsLayer);

      const ruins1 = createRuinsSet(app, 0.3);
      const ruins2 = createRuinsSet(app, 0.15);
      ruinsLayer.addChild(ruins1.container);
      ruinsLayer.addChild(ruins2.container);

      // ---- 2. 粒子效果层 ----
      const particlesLayer = new PIXI.Container();
      app.stage.addChild(particlesLayer);
      const particles = createParticleSystem(app);

      // ---- 3. 飞船层 ----
      const shipLayer = new PIXI.Container();
      app.stage.addChild(shipLayer);
      const ship = createShip(app);
      ship.container.scale.set(0.35);
      ship.container.x = app.screen.width * 0.65;
      ship.container.y = app.screen.height * 0.45;
      shipLayer.addChild(ship.container);
      shipRef.current = ship;

      // 存储热区信息
      zonesRef.current = ship.zones;

      // 通知父组件飞船已就绪
      if (onShipReady) onShipReady(ship.zones);

      // ---- 主循环 ----
      let time = 0;
      app.ticker.add((ticker) => {
        time += ticker.deltaTime * 0.016;

        // 废墟滚动
        updateRuins(ruins1, app, time, 0.4);
        updateRuins(ruins2, app, time, 0.2);

        // 粒子
        updateParticles(particles, app, time);

        // 飞船微浮动
        const baseY = app.screen.height * 0.45;
        ship.container.y = baseY + Math.sin(time * 0.5) * 15;
        ship.container.rotation = Math.sin(time * 0.3) * 0.02;

        // 引擎光效脉动
        ship.engineGlow.alpha = 0.6 + Math.sin(time * 3) * 0.4;

        // 缩放动画 (phase)
        if (phase === 'zooming') {
          const targetScale = 0.7;
          ship.container.scale.set(
            ship.container.scale.x + (targetScale - ship.container.scale.x) * 0.03
          );
          ship.container.x += (app.screen.width * 0.5 - ship.container.x) * 0.03;
          ship.container.y += (app.screen.height * 0.5 - ship.container.y) * 0.03;
        } else if (phase === 'idle') {
          const targetScale = 0.35;
          ship.container.scale.set(
            ship.container.scale.x + (targetScale - ship.container.scale.x) * 0.02
          );
          ship.container.x += (app.screen.width * 0.65 - ship.container.x) * 0.02;
        }
      });
    });

    return () => {
      destroyed = true;
      try { app.destroy(true, { children: true, texture: true }); } catch (e) {}
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

/* ==========================================================================
   废墟生成
   ========================================================================== */
function createRuinsSet(app, alpha) {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  container.addChild(g);

  const color = alpha > 0.2 ? 0x2a1010 : 0x1a0808;

  // 随机生成多个建筑废墟
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * app.screen.width * 1.5 - app.screen.width * 0.25;
    const baseY = app.screen.height * 0.5 + Math.random() * app.screen.height * 0.4;
    const w = 30 + Math.random() * 80;
    const h = 40 + Math.random() * 120;

    g.fill({ color, alpha });
    // 主体
    g.rect(x - w / 2, baseY - h, w, h);
    // 破碎顶部
    g.moveTo(x - w / 2, baseY - h);
    g.lineTo(x - w / 2 + 10, baseY - h - 10 - Math.random() * 20);
    g.lineTo(x + w / 4, baseY - h);
    g.lineTo(x + w / 3, baseY - h - 8 - Math.random() * 15);
    g.lineTo(x + w / 2, baseY - h);
    g.fill();
    // 窗口
    g.fill({ color: 0x3a0000, alpha: 0.6 });
    for (let j = 0; j < 4; j++) {
      if (Math.random() > 0.3) {
        g.rect(
          x - w / 2 + 8 + j * (w / 5),
          baseY - h + 10 + (j % 2) * 25,
          6 + Math.random() * 4,
          8 + Math.random() * 6
        );
      }
    }
  }

  // 碎片
  g.fill({ color: 0x331111, alpha: alpha * 1.2 });
  for (let i = 0; i < 15; i++) {
    const sx = Math.random() * app.screen.width * 1.5 - app.screen.width * 0.25;
    const sy = app.screen.height * 0.55 + Math.random() * app.screen.height * 0.35;
    g.rect(sx, sy, 4 + Math.random() * 12, 3 + Math.random() * 8);
  }

  return {
    container,
    graphics: g,
    speed: 0.3 + Math.random() * 0.4,
  };
}

function updateRuins(ruins, app, time, speed) {
  ruins.container.x = -(time * 50 * speed) % (app.screen.width * 1.5);
}

/* ==========================================================================
   粒子系统
   ========================================================================== */
function createParticleSystem(app) {
  const container = new PIXI.Container();
  const particles = [];

  for (let i = 0; i < 30; i++) {
    const g = new PIXI.Graphics();
    const size = 1.5 + Math.random() * 2.5;
    const isRed = Math.random() > 0.7;
    g.fill({ color: isRed ? COLORS.P5R_RED : 0x666666, alpha: 0.3 + Math.random() * 0.5 });
    g.circle(0, 0, size);
    g.x = Math.random() * app.screen.width;
    g.y = Math.random() * app.screen.height;
    container.addChild(g);
    particles.push({
      g,
      baseX: g.x,
      baseY: g.y,
      speed: 0.3 + Math.random() * 0.8,
      amplitude: 10 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
    });
  }

  return { container, particles };
}

function updateParticles(ps, app, time) {
  for (const p of ps.particles) {
    p.g.x = p.baseX + Math.sin(time * p.speed + p.phase) * p.amplitude;
    p.g.y = p.baseY + Math.cos(time * p.speed * 0.7 + p.phase) * p.amplitude * 0.6;
    p.g.alpha = 0.2 + Math.sin(time * 1.5 + p.phase) * 0.2;
  }
}

/* ==========================================================================
   科幻飞船绘制
   返回 { container, zones, engineGlow }
   zones: { id: { x, y, width, height, label, sub, color, hitArea } }
   ========================================================================== */
function createShip(app) {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  container.addChild(g);
  const w = 300;
  const h = 100;

  // -- 主体 (暗色六边形船体) --
  g.fill({ color: 0x2a2a35 });
  g.moveTo(-w / 2, 0);
  g.lineTo(-w / 3, -h / 2);
  g.lineTo(w / 3, -h / 2);
  g.lineTo(w / 2 + 20, 0);
  g.lineTo(w / 3, h / 2);
  g.lineTo(-w / 3, h / 2);
  g.closePath();
  g.fill();

  // 船体红边
  g.stroke({ color: COLORS.P5R_RED, width: 2, alpha: 0.8 });
  g.moveTo(-w / 2, 0);
  g.lineTo(-w / 3, -h / 2);
  g.lineTo(w / 3, -h / 2);
  g.lineTo(w / 2 + 20, 0);
  g.stroke();

  // -- 舰桥 (上层建筑) --
  g.fill({ color: 0x3a3a48 });
  g.moveTo(-w / 5, -h / 2);
  g.lineTo(-w / 8, -h / 2 - 35);
  g.lineTo(w / 6, -h / 2 - 35);
  g.lineTo(w / 4, -h / 2);
  g.closePath();
  g.fill();
  g.stroke({ color: COLORS.P5R_RED, width: 2, alpha: 0.6 });

  // 舰桥窗户
  g.fill({ color: 0xffd700, alpha: 0.7 });
  g.rect(-w / 10, -h / 2 - 28, w / 5, 12);

  // -- 引擎舱 (尾部) --
  g.fill({ color: 0x222233 });
  g.rect(w / 3, -8, 50, 16);
  g.stroke({ color: 0x4444aa, width: 1 });

  // 引擎光效
  const engineGlow = new PIXI.Graphics();
  engineGlow.fill({ color: 0x4488ff, alpha: 0.7 });
  engineGlow.ellipse(w / 3 + 50, 0, 18, 10);
  engineGlow.fill({ color: 0x88ccff, alpha: 0.4 });
  engineGlow.ellipse(w / 3 + 55, 0, 25, 14);
  container.addChild(engineGlow);

  // -- 侧翼 --
  g.fill({ color: 0x252530 });
  g.moveTo(-w / 4, 5);
  g.lineTo(-w / 2 - 30, 25);
  g.lineTo(-w / 3, 20);
  g.closePath();
  g.moveTo(w / 4, 5);
  g.lineTo(w / 2 + 30, 25);
  g.lineTo(w / 3, 20);
  g.closePath();
  g.fill();
  g.stroke({ color: COLORS.P5R_RED, width: 1, alpha: 0.5 });

  // -- 天线/桅杆 --
  g.stroke({ color: 0x888888, width: 1.5 });
  g.moveTo(0, -h / 2 - 35);
  g.lineTo(0, -h / 2 - 55);
  g.moveTo(-5, -h / 2 - 55);
  g.lineTo(5, -h / 2 - 55);

  // -- 装饰线 --
  g.stroke({ color: COLORS.P5R_RED, width: 1.5, alpha: 0.5 });
  g.moveTo(-w / 3, h / 2);
  g.lineTo(w / 3, h / 2);

  // 船体文字标记
  const labelStyle = new PIXI.TextStyle({
    fontFamily: 'monospace',
    fontSize: 10,
    fill: COLORS.P5R_RED,
    letterSpacing: 3,
  });
  const label = new PIXI.Text({ text: 'THESEUS', style: labelStyle });
  label.anchor.set(0.5);
  label.x = -w / 6;
  label.y = -h / 4;
  container.addChild(label);

  // ====== 区域定义 (相对于 container) ======
  const zoneDefs = [
    {
      id: 'crew',
      label: '船员室',
      sub: 'Crew Quarters',
      color: 0xFFB7C5,
      // 船体左前部
      x: -w / 2 + 12, y: -h / 2 + 5,
      w: w * 0.28, h: h * 0.7,
      // 折线终点 (标签位置)
      labelX: -w / 2 - 75, labelY: -h / 2 - 28,
    },
    {
      id: 'warRoom',
      label: '作战会议室',
      sub: 'War Room',
      color: 0x4169E1,
      // 舰桥区域
      x: -w / 6, y: -h / 2 - 30,
      w: w * 0.38, h: 34,
      labelX: -30, labelY: -h / 2 - 70,
    },
    {
      id: 'captain',
      label: '船长室',
      sub: "Captain's Cabin",
      color: 0xDAA520,
      // 船体前中部
      x: w * 0.02, y: -h / 2 + 5,
      w: w * 0.25, h: h * 0.7,
      labelX: w / 2 + 50, labelY: -h / 2 - 10,
    },
    {
      id: 'engine',
      label: '引擎室',
      sub: 'Engine Room',
      color: 0x228B22,
      // 尾部引擎区
      x: w / 3, y: -10,
      w: w * 0.22, h: h * 0.45,
      labelX: w / 2 + 72, labelY: h / 2 - 5,
    },
    {
      id: 'archive',
      label: '档案室',
      sub: 'Archive',
      color: 0x708090,
      // 船体后部下方
      x: -w * 0.05, y: h * 0.1,
      w: w * 0.32, h: h * 0.42,
      labelX: -w / 3, labelY: h / 2 + 35,
    },
  ];

  // ====== 绘制区域高亮 + 折线 + 标签 ======
  const annotationLayer = new PIXI.Container();
  container.addChild(annotationLayer);

  const hitZones = {};

  for (const zd of zoneDefs) {
    // 1) 半透明高亮矩形
    const highlight = new PIXI.Graphics();
    highlight.fill({ color: zd.color, alpha: 0.15 });
    highlight.rect(zd.x, zd.y, zd.w, zd.h);
    highlight.fill();
    highlight.stroke({ color: zd.color, width: 1.5, alpha: 0.7 });
    highlight.rect(zd.x, zd.y, zd.w, zd.h);
    highlight.stroke();
    // 虚线效果 — 间隔描点
    const dashLen = 6;
    for (let dashX = zd.x + dashLen; dashX < zd.x + zd.w; dashX += dashLen * 2) {
      highlight.stroke({ color: zd.color, width: 1.5, alpha: 0.5 });
      highlight.moveTo(dashX, zd.y);
      highlight.lineTo(Math.min(dashX + dashLen, zd.x + zd.w), zd.y);
      highlight.stroke();
      highlight.moveTo(dashX, zd.y + zd.h);
      highlight.lineTo(Math.min(dashX + dashLen, zd.x + zd.w), zd.y + zd.h);
      highlight.stroke();
    }
    annotationLayer.addChild(highlight);

    // 2) 折线连接线
    const cx = zd.x + zd.w / 2;
    const cy = zd.y + zd.h / 2;
    const connector = new PIXI.Graphics();
    connector.stroke({ color: zd.color, width: 1.5, alpha: 0.8 });
    // 折线: 区域中心 → 水平出 → 终点
    connector.moveTo(cx, cy);
    const midX = cx + (zd.labelX - cx) * 0.55;
    connector.lineTo(midX, cy);
    connector.lineTo(midX, zd.labelY);
    connector.lineTo(zd.labelX, zd.labelY);
    connector.stroke();
    annotationLayer.addChild(connector);

    // 3) 端点小圆
    const dot = new PIXI.Graphics();
    dot.fill({ color: zd.color, alpha: 0.9 });
    dot.circle(zd.labelX, zd.labelY, 3.5);
    dot.fill();
    annotationLayer.addChild(dot);

    // 4) 标签文字
    const zoneLabel = new PIXI.Text({
      text: zd.label,
      style: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: zd.color,
        letterSpacing: 2,
        dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 2 },
      },
    });
    zoneLabel.x = zd.labelX + 8;
    zoneLabel.y = zd.labelY - 8;
    annotationLayer.addChild(zoneLabel);

    // 5) 英文副标题
    const subLabel = new PIXI.Text({
      text: zd.sub,
      style: {
        fontFamily: 'monospace',
        fontSize: 8,
        fill: 0x999999,
        letterSpacing: 1,
        dropShadow: { color: 0x000000, alpha: 0.8, blur: 2, distance: 1 },
      },
    });
    subLabel.x = zd.labelX + 8;
    subLabel.y = zd.labelY + 8;
    annotationLayer.addChild(subLabel);

    // 存储热区 (用于点击检测)
    hitZones[zd.id] = {
      id: zd.id,
      label: zd.label,
      sub: zd.sub,
      color: '#' + zd.color.toString(16).padStart(6, '0'),
      x: zd.x,
      y: zd.y,
      width: zd.w,
      height: zd.h,
    };
  }

  return {
    container,
    zones: hitZones,
    engineGlow,
  };
}
