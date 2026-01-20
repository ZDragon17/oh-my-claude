#!/usr/bin/env sh
# ============================================================================
# Tool Output Validator - 工具输出验证器
# ============================================================================
# 验证工具调用的输出是否有效，检测常见错误模式
#
# 功能：
# 1. 检测工具执行错误
# 2. 检测超时和连接问题
# 3. 检测权限和文件系统错误
# 4. 提供修复建议
# ============================================================================

# 获取工具调用信息
tool_name="${CLAUDE_TOOL_NAME:-}"
tool_result="${CLAUDE_TOOL_RESULT:-}"
exit_code="${CLAUDE_TOOL_EXIT_CODE:-0}"

# 如果没有工具结果，直接退出
if [ -z "$tool_result" ]; then
    exit 0
fi

# 错误检测标志
has_error=false
error_type=""
error_details=""
suggestions=""

# 检测常见错误模式

# 1. 权限错误
if echo "$tool_result" | grep -qiE '(permission denied|access denied|EACCES|EPERM|权限|拒绝访问)'; then
    has_error=true
    error_type="权限错误"
    error_details="工具执行遇到权限问题"
    suggestions="1. 检查文件/目录权限\\n2. 尝试使用管理员权限\\n3. 确认目标路径可写"
fi

# 2. 文件不存在
if echo "$tool_result" | grep -qiE '(no such file|not found|ENOENT|does not exist|找不到|不存在)'; then
    has_error=true
    error_type="文件不存在"
    error_details="请求的文件或目录不存在"
    suggestions="1. 验证路径是否正确\\n2. 检查文件是否已创建\\n3. 使用 Glob 工具搜索正确路径"
fi

# 3. 超时错误
if echo "$tool_result" | grep -qiE '(timeout|timed out|ETIMEDOUT|超时)'; then
    has_error=true
    error_type="超时错误"
    error_details="工具执行超时"
    suggestions="1. 增加超时时间\\n2. 将操作拆分为更小的步骤\\n3. 检查网络连接（如适用）"
fi

# 4. 连接错误
if echo "$tool_result" | grep -qiE '(connection refused|ECONNREFUSED|network error|无法连接|连接失败)'; then
    has_error=true
    error_type="连接错误"
    error_details="无法建立连接"
    suggestions="1. 检查目标服务是否运行\\n2. 验证网络配置\\n3. 检查防火墙设置"
fi

# 5. 内存错误
if echo "$tool_result" | grep -qiE '(out of memory|ENOMEM|heap|内存不足)'; then
    has_error=true
    error_type="内存错误"
    error_details="内存不足"
    suggestions="1. 释放系统内存\\n2. 将操作拆分为更小的批次\\n3. 增加可用内存"
fi

# 6. 磁盘空间错误
if echo "$tool_result" | grep -qiE '(no space|disk full|ENOSPC|磁盘空间不足)'; then
    has_error=true
    error_type="磁盘空间错误"
    error_details="磁盘空间不足"
    suggestions="1. 清理不需要的文件\\n2. 扩展磁盘空间\\n3. 使用不同的存储位置"
fi

# 7. 语法/解析错误
if echo "$tool_result" | grep -qiE '(syntax error|parse error|SyntaxError|语法错误|解析错误)'; then
    has_error=true
    error_type="语法错误"
    error_details="代码或配置存在语法错误"
    suggestions="1. 检查相关文件的语法\\n2. 使用 lsp_diagnostics 获取详细错误\\n3. 验证 JSON/YAML 格式"
fi

# 8. 非零退出码
if [ "$exit_code" != "0" ] && [ "$has_error" = "false" ]; then
    has_error=true
    error_type="执行失败"
    error_details="工具以非零退出码 ($exit_code) 结束"
    suggestions="1. 查看详细输出了解原因\\n2. 检查命令参数\\n3. 验证前置条件"
fi

# 如果检测到错误，发送警告
if [ "$has_error" = "true" ]; then
    # 截断过长的结果（保留前 500 字符）
    truncated_result=$(echo "$tool_result" | head -c 500)
    if [ ${#tool_result} -gt 500 ]; then
        truncated_result="${truncated_result}... (truncated)"
    fi
    
    printf '{"systemMessage":"\\n\\n[TOOL OUTPUT VALIDATION]\\n\\n**检测到 %s**\\n\\n工具: %s\\n退出码: %s\\n\\n**问题**: %s\\n\\n**输出摘要**:\\n```\\n%s\\n```\\n\\n**修复建议**:\\n%s\\n"}\n' "$error_type" "$tool_name" "$exit_code" "$error_details" "$truncated_result" "$suggestions"
    exit 0
fi

# 无错误检测到
exit 0
