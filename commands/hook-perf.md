---
name: hook-perf
description: Hook 性能监控 - 查看各 Hook 的执行时间，识别性能瓶颈
allowed-tools:
  - Bash
  - Read
model: haiku
---

<command-name>/hook-perf</command-name>

# Hook 性能监控

查看 oh-my-claude 43 个 Hook 的执行性能，识别可能影响响应速度的瓶颈。

## 使用方式

```text
/hook-perf [report|clear|summary]
```

## 执行流程

### `/hook-perf` 或 `/hook-perf report` - 查看性能报告

执行性能监控脚本：

```bash
~/.claude/plugins/oh-my-claude/hooks/hook-performance-monitor.sh report
```

显示格式：

```text
┌─────────────────────────────────────────────────────────────┐
│              🔍 Hook 性能监控报告                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hook 名称                  平均耗时    最大耗时    调用次数  │
│  ─────────────────────────────────────────────────────────  │
│  keyword-detector.sh        120ms       350ms       45      │
│  todo-enforcer.sh           85ms        200ms       32      │
│  progress-notifier.sh       45ms        120ms       28      │
│  ...                                                        │
│                                                             │
│  📁 日志位置: ~/.oh-my-claude/performance/                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### `/hook-perf clear` - 清除性能日志

```bash
~/.claude/plugins/oh-my-claude/hooks/hook-performance-monitor.sh clear
```

输出：
```text
✅ 性能日志已清除
```

### `/hook-perf summary` - 获取 JSON 摘要

```bash
~/.claude/plugins/oh-my-claude/hooks/hook-performance-monitor.sh summary
```

返回 JSON 格式的性能数据，可用于进一步分析。

---

## 性能阈值说明

| 阈值 | 说明 |
|------|------|
| < 500ms | 正常 |
| 500-2000ms | ⏱️ 较慢，可能需要优化 |
| > 2000ms | ⚠️ 非常慢，建议检查 |

---

## 性能优化建议

当发现慢 Hook 时：

1. **检查外部依赖**
   - 网络请求（API 调用）
   - 文件系统操作（大量文件扫描）
   - 外部命令（jq、curl 等）

2. **考虑禁用不必要的 Hook**
   - 编辑 `hooks/hooks.json`
   - 注释或删除不需要的 Hook

3. **使用缓存**
   - 对于重复计算的结果使用缓存
   - 设置合理的缓存过期时间

4. **异步执行**
   - 非关键 Hook 可以在后台执行
   - 避免阻塞主流程

---

## 日志文件位置

```
~/.oh-my-claude/performance/
├── hook-timing.log    # 原始执行日志
└── summary.json       # 性能摘要
```

---

## 依赖说明

- 需要 `jq` 进行 JSON 分析（可选）
- 无 jq 时仍可记录日志，但无法生成详细报告

安装 jq：
```bash
# macOS
brew install jq

# Linux
apt install jq

# Windows
choco install jq
```

---

## 别名

- `/hook-perf` - 主命令
- `/perf-hook` - 英文别名
- `/性能` - 中文别名
