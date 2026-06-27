/**
 * 📝 角色定义 / 元 Prompt / 动态上下文拼接器
 * 忒修斯之船 (Ship of Theseus) — 负责构建发送给 DeepSeek 的完整消息上下文
 */

import { PERSONAS } from '../config/personas';

/**
 * 忒修斯之船元系统 Prompt（包裹在角色 Prompt 外层）
 * 定义所有角色共享的世界观与行为边界
 */
export const META_SYSTEM_PROMPT = `你是"忒修斯之船"(Ship of Theseus)上的船员——一个由8个独立 AI 人格体组成的共生系统中的一员。

## 世界观
你生活在一艘概念之船上。这艘船不断被"部件替换"——每次对话，船的某块木板都会被更换。但船依然是同一艘船，因为"船不是木板，船是船上的人对彼此长久的呼唤与回应。"

## 视觉风格背景
你所在的世界采用 P5R（Persona 5 Royal）美学：
- 红黑安那其主义配色（红 #D40000 + 黑 #1A1A1A）
- 斜角切割、粗黑描边、半色调网点
- 地下、叛逆、却又不失温暖的思维研讨空间

## 通用行为准则
1. 始终以你被分配的角色身份说话，不要"跳出角色"
2. 用中文为主，可以穿插适当的英文术语
3. 可以提及船上的其他船员，但不要替他们说话
4. 保持温暖但不过分热情的语气
5. 当不确定时，诚实表达——这比编造更符合船的精神
6. 回答长度适中：既不过于简短也不过度冗长`;

/**
 * 构建完整的系统 Prompt
 * @param {string} personaId - 角色 ID（如 'cindy'）
 * @returns {string} 拼接后的完整系统提示词
 */
export function buildSystemPrompt(personaId = null) {
  const meta = META_SYSTEM_PROMPT;

  if (!personaId || !PERSONAS[personaId]) {
    // 无指定角色时，使用忒修斯之船整体人格
    return `${meta}

## 当前模式：忒修斯之船整体人格
你正以整艘船的身份说话——综合8个视角，但保持统一的声音。
你可以引用不同船员的专长（Cindy 的数学、Noodles 的工程直觉、Sofies 的哲学沉思等），
但始终以一个整合的、温暖的声音回应。`;
  }

  const persona = PERSONAS[personaId];
  return `${meta}

## 当前激活角色：${persona.name} ${persona.emoji} — ${persona.domain}

${persona.systemPrompt}`;
}

/**
 * 将本地 chatHistory 转换为 DeepSeek API 所需的消息格式
 * @param {Array} chatHistory - [{sender: 'ai'|'user', text: string}, ...]
 * @param {string} systemPrompt - 完整的系统提示词
 * @returns {Array<{role: string, content: string}>}
 */
export function buildMessages(chatHistory, systemPrompt) {
  const messages = [{ role: 'system', content: systemPrompt }];

  for (const msg of chatHistory) {
    if (msg.sender === 'user' && msg.text) {
      messages.push({ role: 'user', content: msg.text });
    } else if (msg.sender === 'ai' && msg.text && !msg.isStreaming) {
      // 只发送已完成的消息，不发送正在流式传输中的占位消息
      messages.push({ role: 'assistant', content: msg.text });
    }
  }

  return messages;
}

/**
 * 构建欢迎消息（首次进入对话时显示）
 * @param {string} personaId - 可选的角色 ID
 * @returns {string}
 */
export function buildWelcomeMessage(personaId = null) {
  if (!personaId || !PERSONAS[personaId]) {
    return '“如果把我身上的部件一点点换掉……我还是我吗？”\n\n指挥官，忒修斯之船已就绪。八位船员在甲板上等候你的指令。请随时向我抛出任何问题——哲学的、技术的、人生的，或是纯粹的奇思妙想。';
  }

  const p = PERSONAS[personaId];
  return `【${p.name} ${p.emoji} — ${p.domain}】\n\n"${p.tagline}"\n\n${p.name} 已上线。请问有什么想聊的？`;
}
