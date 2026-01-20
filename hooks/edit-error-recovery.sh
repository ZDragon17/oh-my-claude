#!/bin/bash
# Edit Error Recovery Hook
# 功能：检测编辑工具错误并提供恢复建议
# 处理常见的 Edit 工具失败场景

# 环境变量
HOOK_NAME="edit-error-recovery"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# ============================================================================
# 错误检测函数
# ============================================================================

# 检测 "oldString not found" 错误
detect_old_string_not_found() {
    local output="$1"
    if echo "$output" | grep -qiE '(oldString not found|old string not found|string not found in|未找到|not found in content)'; then
        return 0
    fi
    return 1
}

# 检测多次匹配错误
detect_multiple_matches() {
    local output="$1"
    if echo "$output" | grep -qiE '(multiple times|found multiple|多次匹配|multiple matches|requires more context)'; then
        return 0
    fi
    return 1
}

# 检测文件不存在错误
detect_file_not_found() {
    local output="$1"
    if echo "$output" | grep -qiE '(file not found|文件不存在|no such file|ENOENT|does not exist)'; then
        return 0
    fi
    return 1
}

# 检测权限错误
detect_permission_error() {
    local output="$1"
    if echo "$output" | grep -qiE '(permission denied|权限不足|EACCES|access denied|cannot write)'; then
        return 0
    fi
    return 1
}

# 检测语法错误
detect_syntax_error() {
    local output="$1"
    if echo "$output" | grep -qiE '(syntax error|语法错误|parse error|invalid syntax|unexpected token)'; then
        return 0
    fi
    return 1
}

# ============================================================================
# 恢复建议函数
# ============================================================================

# oldString 未找到的恢复建议
suggest_old_string_recovery() {
    cat << 'EOF'

[Edit Recovery] oldString not found in file.

COMMON CAUSES:
1. The content was already modified or doesn't exist
2. Whitespace/indentation mismatch (tabs vs spaces)
3. Line ending differences (CRLF vs LF)
4. The file path is incorrect

RECOVERY STEPS:
1. Use Read tool to verify current file contents
2. Copy the EXACT text including whitespace from Read output
3. Check if indentation matches (spaces vs tabs)
4. Verify you're editing the correct file path

EXAMPLE:
```
// Instead of guessing, read the file first:
Read("path/to/file.ts")

// Then use the EXACT content from the output
Edit("path/to/file.ts", oldString="[exact content from Read]", newString="[new content]")
```
EOF
}

# 多次匹配的恢复建议
suggest_multiple_matches_recovery() {
    cat << 'EOF'

[Edit Recovery] oldString found multiple times.

SOLUTIONS:
1. Add more context to make oldString unique
2. Use replaceAll=true if you want to replace ALL occurrences
3. Include surrounding lines to make the match unique

EXAMPLE:
```
// Instead of:
Edit(oldString="const x = 1")

// Add context:
Edit(oldString="// Configuration\nconst x = 1\nconst y = 2")

// Or replace all:
Edit(oldString="const x = 1", newString="const x = 2", replaceAll=true)
```
EOF
}

# 文件不存在的恢复建议
suggest_file_not_found_recovery() {
    cat << 'EOF'

[Edit Recovery] File not found.

SOLUTIONS:
1. Verify the file path is correct (case-sensitive on Linux/macOS)
2. Use Glob to find the correct file path
3. Use Write to create the file if it should be new

EXAMPLE:
```
// Find the correct path:
Glob("**/*filename*")

// Or create the file:
Write("correct/path/file.ts", content="...")
```
EOF
}

# 权限错误的恢复建议
suggest_permission_recovery() {
    cat << 'EOF'

[Edit Recovery] Permission denied.

CAUSES:
1. File is read-only
2. File is locked by another process
3. Insufficient user permissions

SOLUTIONS:
1. Check if the file is open in another editor
2. Verify file permissions: ls -la <filepath>
3. For git-managed files, check if they're tracked: git status
EOF
}

# 语法错误的恢复建议
suggest_syntax_recovery() {
    cat << 'EOF'

[Edit Recovery] Syntax error detected after edit.

RECOVERY:
1. Use lsp_diagnostics to identify exact error location
2. Verify your newString is syntactically correct
3. Check for missing brackets, quotes, or semicolons

VERIFICATION:
```
// After edit, always check:
lsp_diagnostics("path/to/file.ts", severity="error")
```
EOF
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 只处理 Edit 工具
    if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "edit" ]; then
        exit 0
    fi
    
    # 检查是否有错误
    if [ -z "$TOOL_OUTPUT" ]; then
        exit 0
    fi
    
    # 检测并提供恢复建议
    if detect_old_string_not_found "$TOOL_OUTPUT"; then
        suggest_old_string_recovery
        exit 0
    fi
    
    if detect_multiple_matches "$TOOL_OUTPUT"; then
        suggest_multiple_matches_recovery
        exit 0
    fi
    
    if detect_file_not_found "$TOOL_OUTPUT"; then
        suggest_file_not_found_recovery
        exit 0
    fi
    
    if detect_permission_error "$TOOL_OUTPUT"; then
        suggest_permission_recovery
        exit 0
    fi
    
    if detect_syntax_error "$TOOL_OUTPUT"; then
        suggest_syntax_recovery
        exit 0
    fi
}

# 执行
main
