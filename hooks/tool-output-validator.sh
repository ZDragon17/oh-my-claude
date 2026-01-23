#!/usr/bin/env bash
# ============================================================================
# Tool Output Validator - 工具输出验证器 (PostToolUse Hook)
# ============================================================================
# 功能：
# 1. 检测工具执行错误
# 2. 引用 error-guide skill 提供智能引导
# 3. 提供具体的修复建议和 Agent 推荐
#
# 触发条件：PostToolUse
# ============================================================================

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

if [ -z "$input" ]; then
    exit 0
fi

# 提取工具信息
if command -v jq > /dev/null 2>&1; then
    tool_name=$(echo "$input" | jq -r '.tool_name // .toolName // empty' 2>/dev/null)
    tool_output=$(echo "$input" | jq -r '.tool_output // .output // .result // empty' 2>/dev/null)
    tool_error=$(echo "$input" | jq -r '.error // .tool_error // empty' 2>/dev/null)
    exit_code=$(echo "$input" | jq -r '.exit_code // .exitCode // "0"' 2>/dev/null)
else
    tool_output="$input"
    tool_error=""
    tool_name="unknown"
    exit_code="0"
fi

# 合并内容用于检测
content="$tool_output $tool_error"

# 如果内容为空，退出
if [ -z "$content" ] || [ "$content" = " " ]; then
    exit 0
fi

# ============================================================================
# 错误模式检测与智能引导
# ============================================================================

# 检测权限错误
if echo "$content" | grep -qiE '(permission denied|access denied|EACCES|EPERM|权限|拒绝访问)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n⚠️ **权限错误检测**\n\n📁 工具执行遇到权限问题\n\n💡 **快速修复**:\n• 检查文件/目录权限\n• 尝试使用管理员权限运行\n• 确认目标路径可写\n\n🎭 **推荐 Agent**:\n• `/bianque` - 让扁鹊诊断具体权限问题\n• `@扁鹊` - 直接召唤\n"
}
EOF
    exit 0
fi

# 检测文件不存在
if echo "$content" | grep -qiE '(no such file|not found|ENOENT|does not exist|找不到|不存在)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n⚠️ **文件不存在**\n\n📁 请求的文件或目录不存在\n\n💡 **快速修复**:\n• 验证路径是否正确（注意大小写）\n• 检查文件是否已创建\n\n🎭 **推荐 Agent**:\n• `/wukong` - 让悟空快速搜索正确路径\n• `@悟空` - 直接召唤\n"
}
EOF
    exit 0
fi

# 检测超时错误
if echo "$content" | grep -qiE '(timeout|timed out|ETIMEDOUT|超时)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n⏰ **操作超时**\n\n当前操作执行时间过长\n\n💡 **建议**:\n• 将操作拆分为更小的步骤\n• 检查网络连接（如适用）\n• 使用 `/status` 查看当前状态\n\n🔧 如需中断: Ctrl+C 或 `/cancel-yishan`\n"
}
EOF
    exit 0
fi

# 检测语法错误
if echo "$content" | grep -qiE '(SyntaxError|parse error|Unexpected token|语法错误|解析错误)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n❌ **语法错误**\n\n代码或配置存在语法问题\n\n💡 **快速修复**:\n• 检查括号和引号是否匹配\n• 验证 JSON/YAML 格式\n• 查看报错行号附近的代码\n\n🎭 **推荐 Agent**:\n• `/bianque` - 让扁鹊诊断语法问题\n• `/weizheng` - 让魏征检查代码规范\n"
}
EOF
    exit 0
fi

# 检测类型错误
if echo "$content" | grep -qiE '(TypeError|Type.*error|Property.*does not exist|Type.*is not assignable|类型错误)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n❌ **类型错误**\n\nTypeScript/JavaScript 类型不匹配\n\n💡 **快速修复**:\n• 检查变量类型定义\n• 确认接口属性是否完整\n• 验证导入的类型是否正确\n\n🎭 **推荐 Agent**:\n• `/bianque` - 让扁鹊诊断类型问题\n• `/wukong 找到接口定义` - 定位相关类型\n"
}
EOF
    exit 0
fi

# 检测依赖错误
if echo "$content" | grep -qiE '(Cannot find module|Module not found|依赖|package.*not found)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n📦 **依赖错误**\n\n缺少必要的模块或包\n\n💡 **快速修复**:\n• 运行 `npm install` 或 `pip install`\n• 检查 package.json/requirements.txt\n• 验证包名是否正确\n\n🔧 修复后重新运行即可\n"
}
EOF
    exit 0
fi

# 检测内存错误
if echo "$content" | grep -qiE '(out of memory|ENOMEM|heap|内存不足|JavaScript heap)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n💾 **内存不足**\n\n操作消耗内存过大\n\n💡 **建议**:\n• 将操作拆分为更小的批次\n• 释放系统内存\n• 考虑使用流式处理\n\n🎭 **推荐 Agent**:\n• `/sunzi` - 让孙子分析性能瓶颈\n"
}
EOF
    exit 0
fi

# 检测连接错误
if echo "$content" | grep -qiE '(connection refused|ECONNREFUSED|network error|无法连接|连接失败)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🌐 **连接错误**\n\n无法建立网络连接\n\n💡 **检查**:\n• 目标服务是否运行\n• 网络配置是否正确\n• 防火墙是否阻止连接\n"
}
EOF
    exit 0
fi

# 检测一般错误（通过退出码或关键词）
if [ "$exit_code" != "0" ] && [ "$exit_code" != "" ]; then
    cat << EOF
{
  "systemMessage": "\n\n⚠️ **执行失败** (退出码: ${exit_code})\n\n💡 **建议**:\n• 查看上方输出了解具体原因\n• 使用 \`/bianque\` 获取深度诊断\n• 使用 \`@扁鹊\` 直接召唤诊断专家\n"
}
EOF
    exit 0
fi

# 无错误检测到
exit 0
