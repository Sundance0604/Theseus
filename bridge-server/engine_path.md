# 引擎室数据源配置

> 此文件存储读取 Claude Code 统计信息的路径配置。
> 不会提交到 git，仅本地使用。

## Claude Code 配置

| 配置项 | 值 |
|--------|-----|
| claude_json | `C:\Users\86198\.claude.json` |
| projects_dir | `C:\Users\86198\.claude\projects` |
| num_startups_field | `numStartups` |

## 会话文件匹配

- 会话文件后缀: `.jsonl`
- 用户消息识别: `type=user` 且 `message.role=user`
- 注意: `message` 字段是 Python repr 格式（单引号），不能直接用 `JSON.parse()`

## 项目列表

| 项目 slug | 说明 |
|-----------|------|
| AIpersona | AI 角色工作区 |
| claude-code | Claude Code 相关 |
| Intercity | 城际项目 |
| WSL Ubuntu | WSL Ubuntu 相关 |
| p5r-game | 本项目的 Claude Code 会话 |
