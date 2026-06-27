import React, { useState } from 'react';
import { COLORS } from '../config/constants';

export const SettingsPanel = ({ apiKey, onSaveApiKey, onClose, isVisible }) => {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [saved, setSaved] = useState(false);

  if (!isVisible) return null;

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: COLORS.ANARCHY_BLACK,
          border: `3px solid ${COLORS.P5R_RED}`,
          padding: '35px 30px',
          maxWidth: '480px',
          width: '90%',
          transform: 'skewX(-3deg)',
          boxShadow: `12px 12px 0px ${COLORS.BLACK}`,
        }}
      >
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{
            margin: 0,
            color: COLORS.P5R_RED,
            fontFamily: 'monospace',
            fontSize: '22px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            Ship Settings_
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `2px solid ${COLORS.WHITE}`,
              color: COLORS.WHITE,
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
          >
            X
          </button>
        </div>

        {/* API Key 输入区 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: COLORS.WHITE,
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '8px',
            letterSpacing: '1px',
          }}>
            DEEPSEEK API KEY
          </label>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '12px 15px',
              fontSize: '14px',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: COLORS.WHITE,
              border: `2px solid ${inputKey ? COLORS.P5R_RED : '#444'}`,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: COLORS.P5R_RED,
              color: COLORS.WHITE,
              border: 'none',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              letterSpacing: '1px',
              boxShadow: `4px 4px 0px ${COLORS.BLACK}`,
            }}
          >
            {saved ? 'SAVED' : 'SAVE KEY'}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '12px 20px',
              backgroundColor: 'transparent',
              color: '#999',
              border: '2px solid #444',
              fontFamily: 'monospace',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            CLEAR
          </button>
        </div>

        {/* 提示信息 */}
        <p style={{
          margin: 0,
          color: '#666',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.5',
        }}>
          API Key 仅保存在浏览器本地存储中，不会上传到任何第三方服务器。
          获取 Key: platform.deepseek.com
        </p>
      </div>
    </div>
  );
};