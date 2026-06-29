#!/usr/bin/env bash
#
# ⚓ forget-session.sh — 忒修斯之船 会话遗忘工具
#
# 默认行为：仅清除当前 session 的痕迹，不影响其他项目。
#
# 用法:
#   ./forget-session.sh              # 清除当前 session
#   ./forget-session.sh --all        # 清除所有 session（全局）
#   ./forget-session.sh --hard       # 同时清除 bridge server 数据
#   ./forget-session.sh --all --hard # 彻底大扫除
#
set -euo pipefail

CLAUDE_HOME="${HOME}/.claude"
ALL_MODE=false
HARD_MODE=false
PROJECT_SLUG=""

# --- 参数解析 ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)   ALL_MODE=true; shift ;;
    --hard)  HARD_MODE=true; shift ;;
    --project) PROJECT_SLUG="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# --- 检测当前 sessionId ---
CURRENT_SESSION_ID=""
# 从 sessions/ 目录中找当前 PID 对应的 session
CURRENT_PID=$$
for f in "${CLAUDE_HOME}/sessions/"*.json; do
  [[ -f "$f" ]] || continue
  sid=$(grep -o '"sessionId":"[^"]*"' "$f" 2>/dev/null | head -1 | sed 's/"sessionId":"\([^"]*\)"/\1/')
  if [[ -n "$sid" ]]; then
    CURRENT_SESSION_ID="$sid"
    break
  fi
done

if [[ -z "${CURRENT_SESSION_ID}" ]]; then
  echo "⚠️  无法检测当前 sessionId，将仅清理非 session 相关的痕迹"
fi

# --- 项目 slug ---
if [[ -z "${PROJECT_SLUG}" ]]; then
  CWD=$(pwd)
  PROJECT_SLUG=$(echo "${CWD}" | sed 's|^\([A-Z]\):|/\1|' | tr '/' '-' | tr '\\' '-' | sed 's/^-//')
  PROJECT_SLUG="${PROJECT_SLUG#-}"
fi

PROJECT_DIR="${CLAUDE_HOME}/projects/${PROJECT_SLUG}"

echo "⚓ 忒修斯之船 — 会话遗忘"
echo "   Session: ${CURRENT_SESSION_ID:-未知}"
echo "   项目:    ${PROJECT_SLUG}"
echo "   范围:    ${ALL_MODE} && echo '全部' || echo '仅当前 session'"
echo "   模式:    ${HARD_MODE} && echo 'HARD (+bridge)' || echo 'SOFT'"
echo ""

cleaned_count=0

# ============================================================
# 1. history.jsonl — 全局用户消息日志（按 sessionId 过滤）
# ============================================================
HISTORY_FILE="${CLAUDE_HOME}/history.jsonl"
if [[ -f "${HISTORY_FILE}" ]]; then
  size_before=$(wc -c < "${HISTORY_FILE}" 2>/dev/null || echo 0)
  lines_before=$(wc -l < "${HISTORY_FILE}" 2>/dev/null || echo 0)

  if ${ALL_MODE}; then
    # 全部清空
    echo -n "" > "${HISTORY_FILE}"
    echo "✓ history.jsonl — 全部清空 (was ${lines_before} 条, ${size_before} bytes)"
  elif [[ -n "${CURRENT_SESSION_ID}" ]]; then
    # 只删除当前 session 的行
    kept=$(mktemp)
    removed=0
    while IFS= read -r line; do
      if echo "$line" | grep -q "\"sessionId\":\"${CURRENT_SESSION_ID}\""; then
        ((removed++))
      else
        echo "$line" >> "$kept"
      fi
    done < "${HISTORY_FILE}"
    mv "$kept" "${HISTORY_FILE}"
    echo "✓ history.jsonl — 移除 ${removed}/${lines_before} 条 (保留其他 ${lines_before} 个项目)"
  else
    echo "○ history.jsonl — 无法检测 sessionId，跳过（用 --all 强制清空）"
  fi
  ((cleaned_count++))
else
  echo "○ history.jsonl — 不存在"
fi

# ============================================================
# 2. 当前项目的 session 日志
# ============================================================
if [[ -d "${PROJECT_DIR}" ]]; then
  if ${ALL_MODE}; then
    file_count=$(find "${PROJECT_DIR}" -name "*.jsonl" 2>/dev/null | wc -l)
    if [[ ${file_count} -gt 0 ]]; then
      rm -f "${PROJECT_DIR}"/*.jsonl
      echo "✓ project sessions — 全部删除 ${file_count} 个文件"
      ((cleaned_count++))
    else
      echo "○ project sessions — 无文件"
    fi
  elif [[ -n "${CURRENT_SESSION_ID}" ]]; then
    # 只删除文件名匹配当前 sessionId 的 .jsonl
    matched=$(find "${PROJECT_DIR}" -name "${CURRENT_SESSION_ID}.jsonl" 2>/dev/null | wc -l)
    if [[ ${matched} -gt 0 ]]; then
      rm -f "${PROJECT_DIR}/${CURRENT_SESSION_ID}.jsonl"
      echo "✓ project session — 删除 ${CURRENT_SESSION_ID}.jsonl"
      ((cleaned_count++))
    else
      echo "○ project session — 未找到 ${CURRENT_SESSION_ID}.jsonl"
    fi
  fi
else
  echo "○ project dir — 不存在 (${PROJECT_DIR})"
fi

# ============================================================
# 3. shell-snapshots — bash 历史快照（始终全部清，不区分 session）
# ============================================================
snapshot_count=$(find "${CLAUDE_HOME}/shell-snapshots/" -type f 2>/dev/null | wc -l)
if [[ ${snapshot_count} -gt 0 ]]; then
  rm -rf "${CLAUDE_HOME}/shell-snapshots/"*
  echo "✓ shell-snapshots — 删除 ${snapshot_count} 个文件"
  ((cleaned_count++))
else
  echo "○ shell-snapshots — 已空"
fi

# ============================================================
# 4. file-history — 编辑备份（始终全部清，不区分 session）
# ============================================================
file_hist_count=$(find "${CLAUDE_HOME}/file-history/" -mindepth 1 2>/dev/null | wc -l)
if [[ ${file_hist_count} -gt 0 ]]; then
  rm -rf "${CLAUDE_HOME}/file-history/"*
  echo "✓ file-history — 删除 ${file_hist_count} 个条目"
  ((cleaned_count++))
else
  echo "○ file-history — 已空"
fi

# ============================================================
# 5. HARD 模式：bridge server 数据
# ============================================================
if ${HARD_MODE}; then
  BRIDGE_DATA_DIR="$(dirname "$0")/bridge-server/data"
  if [[ -d "${BRIDGE_DATA_DIR}" ]]; then
    conv_count=$(find "${BRIDGE_DATA_DIR}/conversations/" -name "*.json" 2>/dev/null | wc -l)
    if [[ ${conv_count} -gt 0 ]]; then
      rm -f "${BRIDGE_DATA_DIR}/conversations/"*.json
      echo "✓ bridge conversations — 删除 ${conv_count} 个文件"
      ((cleaned_count++))
    fi
    sem_count=$(find "${BRIDGE_DATA_DIR}/seminars/" -name "*.json" 2>/dev/null | wc -l)
    if [[ ${sem_count} -gt 0 ]]; then
      rm -f "${BRIDGE_DATA_DIR}/seminars/"*.json
      echo "✓ bridge seminars — 删除 ${sem_count} 个文件"
      ((cleaned_count++))
    fi
  fi
fi

echo ""
echo "遗忘完成。${cleaned_count} 处已清除。"

if ${HARD_MODE}; then
  echo ""
  echo "⚠️  HARD 模式已清除 bridge server 数据。p5r 前端刷新后将看到空白对话。"
fi

if ! ${ALL_MODE} && [[ -n "${CURRENT_SESSION_ID}" ]]; then
  echo ""
  echo "💡 仅清除了当前 session。其他项目的对话记录未受影响。"
  echo "   如需清除全部: ./forget-session.sh --all"
fi
