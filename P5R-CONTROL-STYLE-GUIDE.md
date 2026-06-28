# 🏴‍☠️ P5R 波普朋克控件设计规范

> **Ship of Theseus** — 左侧导航控件面板视觉系统 v2.0
> 本文档面向后续开发者，阐述控件的设计哲学、色彩体系、排版规则、动效模板及组件编写范式。

---

## 一、设计哲学：安那其红黑限色主义

### 1.1 核心三色

所有控件**严禁**使用此三色之外的任何颜色作为主色：

| Token | 色值 | 角色 |
|---|---|---|
| `PAPER` | `#F5F0EB` | 暖白纸色 —— 边框、文字、默认前景 |
| `ANARCHY` | `#D40000` | 狂热大红 —— 点缀、hover 反转、高亮 |
| `BLACK` | `#1A1A1A` | 纯黑 —— 背景、硬阴影 |

```js
// 在每个控件文件顶部声明
const PAPER = '#F5F0EB';
const ANARCHY = '#D40000';
const BLACK = '#1A1A1A';
```

### 1.2 色彩使用规则

| 场景 | 背景 | 边框 | 文字 | 阴影 |
|---|---|---|---|---|
| 默认态 | `BLACK` | `PAPER` | `PAPER` | `BLACK` |
| Hover 态 | `PAPER` | `ANARCHY` | `BLACK` | `ANARCHY` |
| 禁用态 | `#222` | `#444` | `#555` | 无 |

**关键原则**：hover 时执行红黑反转。背景由黑变暖白，边框/阴影由暖白变狂热红，文字由暖白变纯黑。这是 P5R 最核心的交互语言。

---

## 二、极端几何偏折 (Skew & Angles)

### 2.1 斜切规范

所有容器和按钮必须使用 `skewX()` 实现标志性的硬核斜切：

```
外层容器:  skewX(-10deg)  至 skewX(-15deg)
内部文字:  skewX(+10deg)  至 skewX(+15deg)  ← 反向拉正
```

```jsx
// 按钮外壳
<div style={{
  transform: 'skewX(-10deg)',
  border: `2px solid ${PAPER}`,
}}>
  {/* 文字反向拉正 */}
  <span style={{
    display: 'inline-block',
    transform: 'skewX(10deg)',
  }}>
    BUTTON TEXT
  </span>
</div>
```

**严禁**使用 `border-radius`。所有角必须是锐利的斜切角。

### 2.2 斜切角度速查

| 元素 | 外壳 skewX | 文字 counter-skew |
|---|---|---|
| 标题标签 (NAVIGATION) | `-12deg` | `+12deg` |
| SET SAIL 按钮 | `-10deg` | `+10deg` |
| 导航按钮 | `-10deg` | `+10deg` |
| ZoneScene 面板 | `-8deg` | `+8deg` |

---

## 三、硬边漫画阴影 (Hard Shadows)

**严禁**使用 `box-shadow` 的模糊参数。所有阴影必须是纯色无模糊的硬边块：

```jsx
// ✅ 正确
boxShadow: `6px 6px 0px ${BLACK}`
boxShadow: `8px 8px 0px ${ANARCHY}`   // hover 时变红

// ❌ 错误
boxShadow: '0 4px 12px rgba(0,0,0,0.3)'   // 有模糊！禁止！
```

阴影偏移量与元素尺寸成正比：
- 小按钮 (padding ~10px)：`5px 5px 0px`
- 中按钮 (padding ~14px)：`6px 6px 0px`
- 大按钮 (padding ~26px)：`14px 14px 0px`

---

## 四、英文字体排版 (Typography)

### 4.1 字体族

```js
const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';
```

优先级：`Passion One` (本地托管) > `Impact` > `Bebas Neue` > `Arial Black`

### 4.2 排版规则

所有控件文字必须同时满足：

```jsx
style={{
  fontFamily: FONT,           // 极粗黑体
  fontStyle: 'italic',        // 斜体压迫感
  fontWeight: '900',          // 最大字重
  textTransform: 'uppercase', // 全大写
  letterSpacing: '-0.5px',   // 极窄字距 (可 -1px~1px)
}}
```

### 4.3 字号梯度

| 层级 | 字号 | 用途 |
|---|---|---|
| H1 | 56px | 启动画面主标题 |
| H2 | 18px | 区块标签 (NAVIGATION) |
| 主按钮 | 26px | SET SAIL |
| 导航主标签 | 16px | CREW, WAR, CAPTAIN... |
| 导航副标签 | 10px | QUARTERS, ROOM, CABIN... |
| 图标 | 20px | emoji 导航图标 |
| 箭头 | 18px | ▶ |

---

## 五、高动态 Hover 动效

### 5.1 P5R 颤抖动画 (p5r-shake)

```css
@keyframes p5r-shake {
   0%   { transform: skewX(-15deg) scale(1.06) translate(0, 0) rotate(0deg); }
  15%   { transform: skewX(-15deg) scale(1.06) translate(-2px,  1px) rotate(-0.8deg); }
  30%   { transform: skewX(-15deg) scale(1.06) translate( 2px, -1px) rotate( 1.2deg); }
  45%   { transform: skewX(-15deg) scale(1.06) translate(-1px, -2px) rotate(-0.5deg); }
  60%   { transform: skewX(-15deg) scale(1.06) translate( 3px,  2px) rotate( 1.0deg); }
  75%   { transform: skewX(-15deg) scale(1.06) translate(-2px,  2px) rotate(-1.5deg); }
  90%   { transform: skewX(-15deg) scale(1.06) translate( 1px, -2px) rotate( 0.6deg); }
 100%   { transform: skewX(-15deg) scale(1.06) translate( 0,  0) rotate(0deg); }
}
```

**使用方式**：在 `onMouseEnter` 中动态添加动画类，`onMouseLeave` 中移除。

```jsx
onMouseEnter={(e) => {
  e.currentTarget.style.animation = 'p5r-shake 0.15s infinite linear';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.animation = '';
}}
```

### 5.2 弹性缓动

```jsx
transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1)';
```

`cubic-bezier(0.25, 1.5, 0.5, 1)` 产生弹簧回弹效果，严禁使用 `ease` 或 `linear`。

### 5.3 Hover 完整模板

```jsx
<button
  style={{
    // 默认态
    backgroundColor: BLACK,
    color: PAPER,
    border: `2px solid ${PAPER}`,
    transform: 'skewX(-10deg)',
    boxShadow: `5px 5px 0px ${BLACK}`,
    transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1), '
              + 'background-color 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
  }}
  onMouseEnter={(e) => {
    // 红黑反转 + 弹性放大 + 颤抖
    e.currentTarget.style.backgroundColor = PAPER;
    e.currentTarget.style.color = BLACK;
    e.currentTarget.style.borderColor = ANARCHY;
    e.currentTarget.style.boxShadow = `8px 8px 0px ${ANARCHY}`;
    e.currentTarget.style.animation = 'p5r-shake 0.15s infinite linear';
  }}
  onMouseLeave={(e) => {
    // 复原
    e.currentTarget.style.backgroundColor = BLACK;
    e.currentTarget.style.color = PAPER;
    e.currentTarget.style.borderColor = PAPER;
    e.currentTarget.style.boxShadow = `5px 5px 0px ${BLACK}`;
    e.currentTarget.style.animation = '';
  }}
>
  <span style={{
    display: 'inline-block',
    transform: 'skewX(10deg)',
  }}>
    BUTTON TEXT
  </span>
</button>
```

### 5.4 子元素反色

导航按钮 hover 时，内部图标、文字、箭头等子元素也需要同步反色。使用 `data-og` 属性存储原始颜色：

```jsx
<span data-og={PAPER} style={{ color: PAPER }}>
  👥
</span>
```

```js
// hover 时遍历反色
el.querySelectorAll('[data-og]').forEach(s => {
  s.style.color = BLACK;
});

// leave 时恢复
el.querySelectorAll('[data-og]').forEach(s => {
  s.style.color = s.dataset.og;
});
```

---

## 六、不规则修饰标签 (Stylized Badge)

用于区块标题的标签（如 "NAVIGATION"），必须在左上角独立叠放：

```jsx
<div style={{
  position: 'relative',
  backgroundColor: BLACK,
  border: `3px solid ${ANARCHY}`,
  transform: 'skewX(-12deg)',         // 与按钮斜角形成对比
  padding: '8px 24px',
  boxShadow: `6px 6px 0px ${BLACK}`,  // 硬边阴影
}}>
  <span style={{
    display: 'inline-block',
    transform: 'skewX(12deg)',          // 文字反向拉正
    fontFamily: FONT,
    fontStyle: 'italic',
    fontSize: '18px',
    fontWeight: '900',
    color: PAPER,
    textTransform: 'uppercase',
    letterSpacing: '-0.5px',
  }}>
    NAVIGATION
  </span>
</div>
```

---

## 七、子场景面板 (ZoneScene)

信息弹窗统一使用红底白框限色方案：

```jsx
<div style={{
  backgroundColor: ANARCHY,          // 纯红背景
  border: `4px solid ${PAPER}`,     // 暖白粗边框
  transform: 'skewX(-8deg)',         // 斜切外壳
  boxShadow: `14px 14px 0px ${BLACK}`, // 特大硬阴影
  padding: '36px 40px',
}}>
  <div style={{ transform: 'skewX(8deg)' }}>
    {/* 标题 + 分割线 + 内容 */}
    <h2 style={{
      fontFamily: FONT,
      fontStyle: 'italic',
      fontWeight: '900',
      color: PAPER,
      textTransform: 'uppercase',
      textShadow: `4px 4px 0px ${BLACK}`,
    }}>
      CREW QUARTERS
    </h2>
    <div style={{
      height: '3px',
      backgroundColor: PAPER,
      boxShadow: `3px 3px 0px ${BLACK}`,
    }} />
  </div>
</div>
```

**注意**：ZoneScene **不添加颤抖动画**，保持信息呈现的稳定性。

---

## 八、组件模板 (Copy-Paste Template)

新控件按以下骨架快速创建：

```jsx
import React from 'react';

const PAPER = '#F5F0EB';
const ANARCHY = '#D40000';
const BLACK = '#1A1A1A';
const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';

/* ---- 颤抖关键帧 ---- */
const SHAKE = `
@keyframes p5r-shake {
   0%   { transform: skewX(-15deg) scale(1.06) translate(0, 0) rotate(0deg); }
  15%   { transform: skewX(-15deg) scale(1.06) translate(-2px, 1px) rotate(-0.8deg); }
  30%   { transform: skewX(-15deg) scale(1.06) translate( 2px,-1px) rotate( 1.2deg); }
  45%   { transform: skewX(-15deg) scale(1.06) translate(-1px,-2px) rotate(-0.5deg); }
  60%   { transform: skewX(-15deg) scale(1.06) translate( 3px, 2px) rotate( 1.0deg); }
  75%   { transform: skewX(-15deg) scale(1.06) translate(-2px, 2px) rotate(-1.5deg); }
  90%   { transform: skewX(-15deg) scale(1.06) translate( 1px,-2px) rotate( 0.6deg); }
 100%   { transform: skewX(-15deg) scale(1.06) translate( 0, 0) rotate(0deg); }
}`;

export const MyControl = ({ label, onClick }) => (
  <div>
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 18px',
        backgroundColor: BLACK,
        color: PAPER,
        border: `2px solid ${PAPER}`,
        borderLeft: `6px solid ${PAPER}`,
        transform: 'skewX(-10deg)',
        boxShadow: `6px 6px 0px ${BLACK}`,
        transition: 'transform 0.18s cubic-bezier(0.25, 1.5, 0.5, 1), '
                  + 'background-color 0.12s, color 0.12s, border-color 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = PAPER;
        e.currentTarget.style.color = BLACK;
        e.currentTarget.style.borderColor = ANARCHY;
        e.currentTarget.style.boxShadow = `10px 10px 0px ${ANARCHY}`;
        e.currentTarget.style.animation = 'p5r-shake 0.15s infinite linear';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = BLACK;
        e.currentTarget.style.color = PAPER;
        e.currentTarget.style.borderColor = PAPER;
        e.currentTarget.style.boxShadow = `6px 6px 0px ${BLACK}`;
        e.currentTarget.style.animation = '';
      }}
    >
      {/* 图标 (counter-skew) */}
      <span data-og={PAPER} style={{
        transform: 'skewX(10deg)',
        color: PAPER,
        transition: 'color 0.12s',
      }}>
        ▶
      </span>

      {/* 文字 (counter-skew) */}
      <span style={{
        transform: 'skewX(10deg)',
        fontFamily: FONT,
        fontStyle: 'italic',
        fontWeight: '900',
        fontSize: '16px',
        textTransform: 'uppercase',
        letterSpacing: '-0.5px',
      }}>
        {label}
      </span>
    </button>

    <style>{SHAKE}</style>
  </div>
);
```

---

## 九、检查清单

新控件上线前逐项验证：

- [ ] 仅使用 `#F5F0EB` / `#D40000` / `#1A1A1A` 三色
- [ ] 无 `border-radius`
- [ ] 外壳 `skewX(-10deg)` + 内部文字 `skewX(+10deg)` 拉正
- [ ] 所有 `boxShadow` 无模糊参数
- [ ] 字体 `Passion One / Impact / Bebas Neue` + `italic` + `uppercase`
- [ ] Hover: 红黑反转 (`BLACK→PAPER`, `PAPER→ANARCHY`) + 弹性放大 + p5r-shake
- [ ] `cubic-bezier(0.25, 1.5, 0.5, 1)` 弹簧缓动
- [ ] 子元素通过 `data-og` 同步反色
- [ ] ZoneScene 类信息框不添加颤抖动画
