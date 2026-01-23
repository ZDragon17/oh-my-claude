---
name: voice
description: |
  语音交互技能 - 支持语音输入和语音反馈。
  实验性功能，依赖系统语音服务。
experimental: true
---

# 语音交互技能 (Voice Interaction)

支持语音输入和语音反馈的实验性功能。

## 核心理念

> 解放双手，语音驱动。
> 让编程更自然。

## 功能概述

### 🎙️ 语音输入 (Speech-to-Text)

将语音转换为文字命令：

```bash
/voice on

# 说 "悟空，帮我找一下登录相关的代码"
# → 自动转换为: /wukong 找一下登录相关的代码
```

### 🔊 语音输出 (Text-to-Speech)

将响应转换为语音播报：

```bash
# Agent 响应会被朗读出来
# "我找到了 5 个与登录相关的文件..."
```

## 平台支持

| 平台 | 语音输入 | 语音输出 | 状态 |
|------|----------|----------|------|
| macOS | ✅ 系统 API | ✅ say 命令 | 完整支持 |
| Windows | ✅ SAPI | ✅ SAPI | 完整支持 |
| Linux | ⚠️ sox | ⚠️ espeak | 部分支持 |

## 使用方式

### 开启/关闭

```bash
/voice on    # 开启语音模式
/voice off   # 关闭语音模式
```

### 查看状态

```bash
/voice status
```

### 测试功能

```bash
/voice test
```

### 配置参数

```bash
/voice config
```

## 语音命令

### Agent 调用

| 语音 | 命令 |
|------|------|
| "悟空..." | `/wukong ...` |
| "鲁班..." | `/luban ...` |
| "扁鹊..." | `/bianque ...` |
| "诸葛..." | `/zhuge ...` |

### 控制命令

| 语音 | 命令 |
|------|------|
| "暂停" | 暂停当前任务 |
| "继续" | 恢复任务 |
| "取消" | 取消操作 |
| "帮助" | 显示帮助 |

## 配置选项

```json
{
  "voice": {
    "enabled": false,
    "input": {
      "language": "zh-CN",
      "wakeWord": "小助手",
      "confirmBeforeExecute": true
    },
    "output": {
      "speed": 1.0,
      "volume": 1.0
    }
  }
}
```

## 最佳实践

### 适合场景

- ✅ 快速探索代码
- ✅ 简单命令执行
- ✅ 查看状态和帮助
- ✅ 手不方便时操作

### 不适合场景

- ❌ 复杂的多参数命令
- ❌ 需要精确输入的场景
- ❌ 嘈杂环境
- ❌ 需要安静的办公室

## 限制说明

⚠️ **实验性功能**

1. 语音识别准确性受环境影响
2. 中文识别可能存在误差
3. 需要系统级权限（麦克风）
4. 依赖平台语音服务

## 安装依赖

### Linux

```bash
# 语音输入
sudo apt-get install sox

# 语音输出
sudo apt-get install espeak
```

### macOS / Windows

无需额外安装，使用系统内置服务。
