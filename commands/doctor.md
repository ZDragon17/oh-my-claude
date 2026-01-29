# 诊断修复命令 - 自动检测和修复问题

> 🏥 华佗妙手，起死回生

自动诊断 oh-my-claude 安装问题，一键修复。

## 命令格式

```bash
# 完整诊断（默认）
/doctor

# 中文命令
/zhenduan

# 简写
/diag
```

## 诊断模式

```bash
# 完整诊断（默认）
/doctor

# 快速诊断（只检测关键项）
/doctor --quick

# 指定检测项
/doctor --check=commands,agents

# 详细输出
/doctor --verbose
```

## 修复操作

```bash
# 诊断并自动修复
/doctor --fix

# 仅显示修复建议（不执行）
/doctor --dry-run

# 强制重新安装
/doctor --reinstall

# 清理并重装
/doctor --clean-install
```

## 检测项目

| 类别 | 检测内容 |
|------|----------|
| 基础环境 | Node.js 版本、Claude Code 状态 |
| 插件安装 | 目录结构、文件完整性 |
| 命令注册 | 命令文件、别名映射 |
| Agent 配置 | Agent 定义、模型配置 |
| 技能配置 | 技能文件、引用关系 |
| Hook 系统 | hooks.json、脚本权限 |
| MCP 服务器 | 配置文件、连接状态 |

## 自动修复

**可自动修复**：
- 旧版文件残留
- 配置文件格式错误
- 权限问题
- 缺失文件

**需手动修复**：
- 环境依赖缺失
- 网络问题
- 严重配置损坏

## 命令别名

- `/doctor` - Doctor（英文）
- `/zhenduan` - 诊断（中文）
- `/diag` - 简写
- `/health` - 健康检查
- `/troubleshoot` - 故障排查

---

加载 doctor 技能以获取详细指南。
