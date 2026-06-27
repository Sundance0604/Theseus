/**
 * 🏴‍☠️ 安那其红黑设计 Token
 * 忒修斯之船 (Ship of Theseus) 全局视觉常量
 */

export const COLORS = {
  /** 安那其红 - 用户主题色 */
  ANARCHY_RED: '#D40000',
  /** 安那其黑 - 背景主色 */
  ANARCHY_BLACK: '#1A1A1A',
  /** P5R 红 (用于强调) */
  P5R_RED: '#D32F2F',
  /** 纯白 */
  WHITE: '#FFFFFF',
  /** 纯黑 */
  BLACK: '#000000',
  /** 半透明黑底 */
  BLACK_OVERLAY: 'rgba(0,0,0,0.85)',

  // ---- 角色主题色 ----
  CINDY_SAKURA: '#FFB7C5',
  NOODLES_MAFIA: '#8B0000',
  VALSE_ROYAL: '#4169E1',
  ORC_BATTLE: '#228B22',
  PAVANE_ORCHID: '#9932CC',
  SOFIES_MINT: '#98FB98',
  SOCRATES_GOLD: '#DAA520',
  LIN_SLATE: '#708090',
};

export const SKEW = {
  /** 左侧面板斜切角度 (AI 侧) */
  LEFT: '-8deg',
  /** 右侧面板斜切角度 (用户侧) */
  RIGHT: '8deg',
};

export const STORAGE_KEYS = {
  API_KEY: 'theseus_deepseek_api_key',
  CHAT_HISTORY: 'theseus_chat_history',
};

export const API_CONFIG = {
  /** DeepSeek API 端点 */
  BASE_URL: 'https://api.deepseek.com/v1/chat/completions',
  /** 默认模型 — DeepSeek V4 */
  MODEL: 'deepseek-v4-pro',
  /** 默认温度 */
  TEMPERATURE: 0.8,
  /** 最大输出 token */
  MAX_TOKENS: 2048,
};
