---
name: voice
description: |
  语音交互命令 - 启用语音输入和语音反馈。
  支持语音识别、语音合成和语音命令。
  别名：/伯牙 (伯牙善于倾听，高山流水遇知音)
aliases:
  - /伯牙
  - /知音
  - /语音
allowed-tools:
  - Bash
  - TodoWrite
  - AskUserQuestion
model: haiku
---

<command-name>/voice</command-name>

# 🎤 语音交互模式

你正在使用 **语音交互** 功能，支持语音输入和语音反馈。

---

## 命令解析

根据用户输入 `$ARGUMENTS` 执行相应操作：

### 子命令分发

| 命令 | 说明 |
|------|------|
| `/voice` 或 `/voice status` | 显示语音功能状态 |
| `/voice on` | 开启语音模式 |
| `/voice off` | 关闭语音模式 |
| `/voice config` | 配置语音参数 |
| `/voice test` | 测试语音功能 |

---

## 语音功能概述

### 🎙️ 语音输入 (Speech-to-Text)

将语音转换为文字命令：

```text
🎤 语音识别已启动...

用户说: "悟空，帮我找一下登录相关的代码"

识别结果: /wukong 找一下登录相关的代码

确认执行? [Y/n]
```

### 🔊 语音输出 (Text-to-Speech)

将响应转换为语音播报：

```text
Agent 响应: "我找到了 5 个与登录相关的文件..."

🔊 播报中...
```

---

## 配置说明

### 系统要求

| 平台 | 语音输入 | 语音输出 |
|------|----------|----------|
| macOS | ✅ 系统麦克风 | ✅ say 命令 |
| Windows | ✅ 系统麦克风 | ✅ SAPI 引擎 |
| Linux | ⚠️ 需安装 sox | ⚠️ 需安装 espeak |

### 配置参数

```json
{
  "voice": {
    "enabled": false,
    "input": {
      "engine": "system",
      "language": "zh-CN",
      "wakeWord": "小助手"
    },
    "output": {
      "engine": "system",
      "voice": "default",
      "speed": 1.0,
      "volume": 1.0
    },
    "shortcuts": {
      "toggle": "Ctrl+Shift+V",
      "pushToTalk": "Space"
    }
  }
}
```

---

## 语音命令映射

### 内置语音命令

| 语音 | 命令 |
|------|------|
| "悟空探索..." | `/wukong ...` |
| "鲁班实现..." | `/luban ...` |
| "扁鹊调试..." | `/bianque ...` |
| "暂停" | 暂停当前任务 |
| "继续" | 恢复任务 |
| "取消" | 取消当前操作 |
| "帮助" | 显示帮助 |

### 自然语言理解

```text
用户: "帮我看看这个文件有什么问题"
      ↓ 语义理解
识别: 调试/诊断意图 → 调用扁鹊

用户: "把这个函数重构一下"
      ↓ 语义理解
识别: 重构意图 → 调用老子/重构命令
```

---

## 状态显示

### 语音模式开启时

```text
🎤 语音交互模式
═══════════════════════════════════════════════════════════════

状态: 🟢 已启用

🎙️ 语音输入
   • 引擎: 系统默认
   • 语言: 中文 (zh-CN)
   • 唤醒词: "小助手"

🔊 语音输出
   • 引擎: 系统默认
   • 语速: 1.0x
   • 音量: 100%

⌨️ 快捷键
   • 切换: Ctrl+Shift+V
   • 按住说话: Space

💡 说 "小助手" 或按 Space 开始语音输入

═══════════════════════════════════════════════════════════════
```

---

## 平台实现

### macOS

```bash
# 语音输入 (需要授权麦克风)
# 使用 macOS 内置语音识别 API

# 语音输出
say -v "Ting-Ting" "你好，我是小助手"
```

### Windows

```powershell
# 语音输入
# 使用 Windows Speech Recognition API

# 语音输出
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Speak("你好，我是小助手")
```

### Linux

```bash
# 语音输入 (需要安装 sox)
rec -r 16000 -c 1 recording.wav

# 语音输出 (需要安装 espeak)
espeak -v zh "你好，我是小助手"
```

---

## 限制说明

⚠️ **当前限制**：

1. **语音识别** - 需要系统级支持或第三方服务
2. **实时性** - 依赖网络延迟和处理速度
3. **准确性** - 中文识别可能有误差，建议确认后执行
4. **环境** - 需要安静环境以获得最佳效果

💡 **建议**：

- 复杂命令仍建议使用文字输入
- 语音适合快速探索和简单操作
- 配合快捷键使用效率更高

---

## 用户的请求

$ARGUMENTS

---

## 执行

根据用户请求配置或显示语音功能状态...
