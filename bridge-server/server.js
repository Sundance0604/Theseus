/**
 * ⚓ 忒修斯之船 — 桥接服务器 (Bridge Server)
 *
 * 职责：
 * 1. 接收浏览器 HTTP 请求（角色名 + 用户消息）
 * 2. 调用本地 Claude Code CLI（claude 命令）
 * 3. 将 Claude 流式输出通过 SSE (Server-Sent Events) 转发给浏览器前端
 *
 * 用法：
 *   cd D:\mycodelife\workshop\AI\galgame\my-p5r-game
 *   node bridge-server/server.js
 *
 * 架构：
 *   浏览器 (React) ──HTTP POST──→ localhost:3099 ──child_process──→ claude CLI
 *                ←──SSE 流────  localhost:3099 ←────stdout────
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ==========================================================================
// 配置
// ==========================================================================

const PORT = 3099;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Claude Code 工作目录 — 即 AIpersona 目录
 * 这是 CLAUDE.md 和 personas/ 所在的位置
 */
const CLAUDE_WORKSPACE = 'D:/mycodelife/workshop/AI/AIpersona';

/** 已知的8个角色名 -> 触发词 */
const PERSONA_TRIGGERS = {
  cindy: '@Cindy',
  christine: '@Cindy',
  noodles: '@Noodles',
  valse: '@Valse',
  orc: '@Orc',
  pavane: '@Pavane',
  sofies: '@Sofies',
  socrates: '@Socrates',
  lin: '@Lin',
};

// ==========================================================================
// CORS 头
// ==========================================================================

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ==========================================================================
// SSE 流式写入辅助
// ==========================================================================

function sseWrite(res, event, data) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ==========================================================================
// 核心：调用 Claude CLI 并流式返回
// ==========================================================================

/**
 * 向 Claude CLI 发送消息并流式返回
 *
 * Claude Code 支持 --print 模式：直接打印回复到 stdout
 *
 * 对于多轮对话，使用 --resume 恢复上次会话（如果可用）
 * 或者每次使用 --print 传递完整上下文
 *
 * 简化方案：使用 claude --print "<消息>" 并将输出 SSE 转发
 * 更完整的方案：维护 claude 进程的 stdin/stdout 管道
 *
 * @param {string} personaId - 角色 ID（如 'valse'）
 * @param {string} userMessage - 用户消息文本
 * @param {http.ServerResponse} res - HTTP 响应对象（用于 SSE 写入）
 */
async function callClaudeStream(personaId, userMessage, res) {
  const trigger = PERSONA_TRIGGERS[personaId.toLowerCase()];

  // 构建完整的提示消息：带 @触发词 的消息
  let promptMessage;
  if (trigger) {
    promptMessage = `${trigger} ${userMessage}`;
  } else {
    // 无特定角色时，以中性模式发送
    promptMessage = userMessage;
  }

  console.log(`\n[bridge] → 角色: ${personaId || '(中性)'} | 触发: ${trigger || '(无)'} | 消息: "${userMessage.slice(0, 50)}..."`);

  // =========================================================================
  // 方案 A: claude --print 单次调用（简单但无法维持多轮上下文）
  // =========================================================================
  //
  // 对于多轮对话支持，有两个选择：
  // 1. 将历史消息拼到 prompt 中（token 成本高）
  // 2. 维护一个持久的 claude 进程会话（复杂但高效）
  //
  // 当前实现：使用 --print 模式 + --resume 尝试恢复会话
  // 如果 --resume 不可用则退回到单次 print
  // =========================================================================

  // 构建 claude 命令参数
  // --print: 在非交互模式下打印结果后退出
  // --model: 可选，但 claude code 使用自己在 settings 中配置的模型
  const args = ['--print', promptMessage];

  // 在 AIpersona 工作目录下运行 claude
  const child = spawn('claude', args, {
    cwd: CLAUDE_WORKSPACE,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true, // Windows 需要 shell 来解析 claude 命令
  });

  let fullText = '';
  let hasError = false;

  // 读取 stdout（Claude 的回复）
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    fullText += text;

    // 实时 SSE 推送给前端
    sseWrite(res, 'chunk', { text });
  });

  // 读取 stderr（错误或进度信息）
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    // Claude Code 可能在 stderr 输出进度信息
    // 仅当看起来像错误时才标记
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
      console.error(`[bridge] stderr: ${text}`);
      if (!hasError) {
        hasError = true;
      }
    }
  });

  // 进程结束
  child.on('close', (code) => {
    if (code === 0 && !hasError) {
      console.log(`[bridge] ← 回复完成 (${fullText.length} 字符)`);
      sseWrite(res, 'done', { fullText });
    } else {
      console.error(`[bridge] ← 进程退出码: ${code}`);
      sseWrite(res, 'error', {
        message: `Claude 进程异常退出 (exit code: ${code})`,
        partialText: fullText,
      });
    }
    res.end();
  });

  // 进程启动失败
  child.on('error', (err) => {
    console.error(`[bridge] 无法启动 claude 进程:`, err.message);
    sseWrite(res, 'error', {
      message: `无法启动 Claude CLI: ${err.message}\n请确认 "claude" 命令可在终端中运行，且 Node.js 有权限访问。`,
    });
    res.end();
  });

  // 超时保护（5分钟）
  const timeout = setTimeout(() => {
    console.error('[bridge] 超时：5分钟内未收到 Claude 完整回复，终止进程');
    child.kill('SIGTERM');
    sseWrite(res, 'error', {
      message: 'Claude 回复超时 (5分钟)，已终止请求',
      partialText: fullText,
    });
    res.end();
  }, 5 * 60 * 1000);

  // 进程结束时清除超时
  child.on('close', () => clearTimeout(timeout));
}

// ==========================================================================
// HTTP 服务器
// ==========================================================================

const server = http.createServer((req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    setCORS(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    setCORS(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', workspace: CLAUDE_WORKSPACE }));
    return;
  }

  // 主 API：POST /chat — 向 Claude 发送消息
  if (req.method === 'POST' && req.url === '/chat') {
    setCORS(res);

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { personaId, message } = JSON.parse(body);

        if (!message || !message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message 不能为空' }));
          return;
        }

        // 设置 SSE 响应头
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
        });

        // 发送连接确认
        sseWrite(res, 'connected', { personaId, trigger: PERSONA_TRIGGERS[personaId?.toLowerCase()] || null });

        // 调用 Claude
        callClaudeStream(personaId, message.trim(), res);

      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON 解析失败: ' + e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ==========================================================================
// 启动
// ==========================================================================

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ⚓ 忒修斯之船 — 桥接服务器已启动           ║');
  console.log('║                                              ║');
  console.log(`║   地址: http://localhost:${PORT}                  ║`);
  console.log(`║   工作区: ${CLAUDE_WORKSPACE}  ║`);
  console.log('║                                              ║');
  console.log('║   POST /chat  → 向 Claude 发送消息 (SSE)     ║');
  console.log('║   GET  /health → 健康检查                     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  已知角色:');
  for (const [id, trigger] of Object.entries(PERSONA_TRIGGERS)) {
    console.log(`    ${trigger}  ← ${id}`);
  }
  console.log('');
});
