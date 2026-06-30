import React from 'react';
import { COLORS } from '../config/constants';

const buttonBase = {
  width: '34px',
  height: '28px',
  border: `2px solid ${COLORS.PAPER}`,
  backgroundColor: COLORS.ANARCHY_BLACK,
  color: COLORS.PAPER,
  transform: 'skewX(-8deg)',
  boxShadow: `3px 3px 0 ${COLORS.BLACK}`,
  cursor: 'pointer',
  fontFamily: 'Impact, "Arial Black", sans-serif',
  fontSize: '14px',
  lineHeight: 1,
  padding: 0,
  WebkitAppRegion: 'no-drag',
};

function WindowButton({ label, title, onClick, danger = false }) {
  const [hovered, setHovered] = React.useState(false);
  const activeDanger = danger && hovered;

  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...buttonBase,
        backgroundColor: activeDanger
          ? COLORS.ANARCHY_RED
          : hovered
            ? COLORS.PAPER
            : COLORS.ANARCHY_BLACK,
        borderColor: hovered ? COLORS.ANARCHY_RED : COLORS.PAPER,
        color: hovered ? COLORS.BLACK : COLORS.PAPER,
      }}
    >
      <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>
        {label}
      </span>
    </button>
  );
}

export function ElectronWindowControls() {
  const windowApi = window.theseusWindow;
  if (!windowApi) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '10px',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        WebkitAppRegion: 'no-drag',
      }}
    >
      <WindowButton
        label="_"
        title="最小化"
        onClick={() => windowApi.minimize()}
      />
      <WindowButton
        label="X"
        title="关闭"
        danger
        onClick={() => windowApi.close()}
      />
    </div>
  );
}
