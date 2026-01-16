#!/bin/bash

# ============================================================================
# 愚公移山循环初始化脚本 (Yishan Loop Setup Script)
# ============================================================================
# 快速创建愚公移山循环的状态文件
#
# 用法: ./setup-yishan-loop.sh [max_iterations] [completion_promise]
#
# 参数:
#   max_iterations     - 最大迭代次数 (默认: 50, 0 表示无限制)
#   completion_promise - 完成标记文本 (默认: "移山完毕")
#
# 示例:
#   ./setup-yishan-loop.sh                    # 默认配置
#   ./setup-yishan-loop.sh 100                # 最多 100 次迭代
#   ./setup-yishan-loop.sh 50 "任务完成"      # 自定义完成标记
#   ./setup-yishan-loop.sh 0 "DONE"           # 无限制迭代
# ============================================================================

set -euo pipefail

# 参数处理
MAX_ITERATIONS="${1:-50}"
COMPLETION_PROMISE="${2:-移山完毕}"

# 状态文件路径
STATE_DIR=".claude"
STATE_FILE="$STATE_DIR/yishan-loop.local.md"

# 确保 .claude 目录存在
if [[ ! -d "$STATE_DIR" ]]; then
    mkdir -p "$STATE_DIR"
    echo "📁 创建目录: $STATE_DIR"
fi

# 检查是否已有循环在运行
if [[ -f "$STATE_FILE" ]]; then
    echo "⚠️  警告: 已存在活跃的愚公移山循环"
    echo "   文件: $STATE_FILE"
    echo ""
    read -p "是否覆盖? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "操作取消"
        exit 1
    fi
fi

# 读取用户任务描述
echo ""
echo "🏔️ 愚公移山循环初始化"
echo "════════════════════════════════════════"
echo ""
echo "请输入任务描述 (输入 EOF 或按 Ctrl+D 结束):"
echo ""

TASK_DESCRIPTION=""
while IFS= read -r line; do
    TASK_DESCRIPTION+="$line"$'\n'
done

# 去除尾部空行
TASK_DESCRIPTION="${TASK_DESCRIPTION%$'\n'}"

if [[ -z "$TASK_DESCRIPTION" ]]; then
    echo "❌ 错误: 任务描述不能为空"
    exit 1
fi

# 创建状态文件
cat > "$STATE_FILE" << EOF
---
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: "$COMPLETION_PROMISE"
---

$TASK_DESCRIPTION
EOF

echo ""
echo "════════════════════════════════════════"
echo "✅ 愚公移山循环已初始化"
echo ""
echo "📋 配置信息:"
echo "   状态文件: $STATE_FILE"
echo "   最大迭代: $MAX_ITERATIONS (0 = 无限制)"
echo "   完成标记: <promise>$COMPLETION_PROMISE</promise>"
echo ""
echo "🚀 使用方法:"
echo "   1. 启动 Claude Code"
echo "   2. 发送任何消息开始任务"
echo "   3. Claude 将持续工作直到输出完成标记"
echo ""
echo "🛑 取消循环:"
echo "   rm $STATE_FILE"
echo "   或使用 /cancel-yishan 命令"
echo ""
