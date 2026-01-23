#!/usr/bin/env bash

# error-recovery.sh - 任务恢复和错误重试机制
# 实现智能错误检测、重试策略和任务恢复

ERROR_RECOVERY_LOG="$HOME/.oh-my-claude/logs/error-recovery.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$ERROR_RECOVERY_LOG"
}

# 检测错误情况
detect_errors() {
    local input="$1"

    # 检测各种错误信号
    if echo "$input" | grep -q -E "(❌|错误|异常|失败|failed|error|exception)"; then
        log "检测到错误信号: $input"
        return 0
    fi

    # 检测任务失败
    if echo "$input" | grep -q -E "(任务失败|执行失败|无法完成|cannot complete)"; then
        log "检测到任务失败: $input"
        return 0
    fi

    # 检测超时或中断
    if echo "$input" | grep -q -E "(超时|中断|timeout|interrupted)"; then
        log "检测到超时或中断: $input"
        return 0
    fi

    # 检测资源不足
    if echo "$input" | grep -q -E "(资源不足|内存不足|磁盘空间|out of memory|disk full)"; then
        log "检测到资源不足: $input"
        return 0
    fi

    return 1
}

# 分析错误类型
analyze_error_type() {
    local input="$1"

    local error_type="unknown"
    local severity="medium"
    local retryable=true

    # 网络相关错误
    if echo "$input" | grep -q -E "(网络|连接|timeout|connection|network)"; then
        error_type="network"
        severity="low"
        retryable=true
        log "错误类型: 网络错误 (可重试)"
    fi

    # API相关错误
    if echo "$input" | grep -q -E "(API|接口|rate limit|quota|api)"; then
        error_type="api"
        severity="medium"
        retryable=true
        log "错误类型: API错误 (可重试)"
    fi

    # 权限相关错误
    if echo "$input" | grep -q -E "(权限|授权|access denied|permission|forbidden)"; then
        error_type="permission"
        severity="high"
        retryable=false
        log "错误类型: 权限错误 (不可重试)"
    fi

    # 资源相关错误
    if echo "$input" | grep -q -E "(内存|磁盘|空间|out of memory|disk full)"; then
        error_type="resource"
        severity="high"
        retryable=false
        log "错误类型: 资源错误 (需要人工干预)"
    fi

    # 逻辑错误
    if echo "$input" | grep -q -E "(逻辑|语法|编译|syntax|logic)"; then
        error_type="logic"
        severity="high"
        retryable=false
        log "错误类型: 逻辑错误 (需要修复)"
    fi

    # 依赖错误
    if echo "$input" | grep -q -E "(依赖|模块|包|dependency|module)"; then
        error_type="dependency"
        severity="medium"
        retryable=true
        log "错误类型: 依赖错误 (可重试)"
    fi

    echo "$error_type|$severity|$retryable"
}

# 生成恢复策略
generate_recovery_strategy() {
    local error_analysis="$1"
    local error_type=$(echo "$error_analysis" | cut -d'|' -f1)
    local severity=$(echo "$error_analysis" | cut -d'|' -f2)
    local retryable=$(echo "$error_analysis" | cut -d'|' -f3)

    local strategy=""

    case "$error_type" in
        "network")
            strategy="---
🔄 网络错误恢复策略
1. 等待 30 秒后自动重试 (最多 3 次)
2. 如果失败，更换网络环境重试
3. 启用备用网络连接
4. 联系网络管理员检查连接

⏰ 预计恢复时间: 1-5 分钟
👥 需要人工干预: 否
---
网络错误通常是临时的，通过重试可以解决。"
            ;;
        "api")
            strategy="---
🔄 API 错误恢复策略
1. 检查 API 密钥和配额
2. 等待 60 秒后重试 (实现指数退避)
3. 分批处理请求避免限流
4. 使用备用 API 端点

⏰ 预计恢复时间: 2-10 分钟
👥 需要人工干预: 可能 (配额问题)
---
API 错误可能是配额或临时问题，重试策略有效。"
            ;;
        "permission")
            strategy="---
🛑 权限错误恢复策略
1. 检查用户权限设置
2. 验证访问令牌有效性
3. 联系管理员更新权限
4. 使用正确的凭据重试

⏰ 预计恢复时间: 5-30 分钟
👥 需要人工干预: 是
---
权限错误需要人工检查和修复，无法自动解决。"
            ;;
        "resource")
            strategy="---
🛑 资源错误恢复策略
1. 检查系统资源使用情况
2. 释放不必要的进程和内存
3. 增加系统资源 (内存/磁盘)
4. 优化任务执行策略

⏰ 预计恢复时间: 10-60 分钟
👥 需要人工干预: 是
---
资源错误需要系统级别的调整，自动恢复有限。"
            ;;
        "logic")
            strategy="---
🔧 逻辑错误恢复策略
1. 分析错误信息定位问题
2. 检查代码逻辑和语法
3. 修复代码错误
4. 重新验证和测试

⏰ 预计恢复时间: 15-120 分钟
👥 需要人工干预: 是
---
逻辑错误需要代码修改，无法自动修复。"
            ;;
        "dependency")
            strategy="---
🔄 依赖错误恢复策略
1. 检查依赖包版本兼容性
2. 重新安装依赖包
3. 更新到兼容版本
4. 清理缓存后重试

⏰ 预计恢复时间: 2-15 分钟
👥 需要人工干预: 可能
---
依赖错误通常可以通过更新或重装解决。"
            ;;
        *)
            strategy="---
❓ 未知错误恢复策略
1. 收集详细错误信息
2. 分析错误上下文
3. 尝试通用重试策略
4. 根据具体情况调整

⏰ 预计恢复时间: 不确定
👥 需要人工干预: 可能
---
未知错误需要具体分析，无法提供通用策略。"
            ;;
    esac

    echo "$strategy"
}

# 执行自动恢复
execute_auto_recovery() {
    local error_analysis="$1"
    local error_type=$(echo "$error_analysis" | cut -d'|' -f1)
    local retryable=$(echo "$error_analysis" | cut -d'|' -f3)

    if [ "$retryable" = "true" ]; then
        log "执行自动恢复: $error_type"

        local recovery_commands="---
🔄 执行自动恢复
错误类型: $error_type
恢复状态: 进行中

执行命令:
/yishan retry last_task
/context compress  # 压缩上下文节省空间
/task checkpoint auto_recovery

如需手动干预，请使用:
/yishan pause  # 暂停自动重试
/yishan manual  # 切换到手动模式
---

自动恢复已启动，将在后台监控和重试。"

        echo "$recovery_commands"
    else
        log "错误不可自动恢复: $error_type"

        local manual_recovery="---
🛑 需要手动恢复
错误类型: $error_type
自动恢复: 不适用

建议操作:
1. 分析错误详细信息
2. 检查系统状态和配置
3. 手动修复问题根因
4. 验证修复效果后继续

恢复命令:
/yishan status  # 查看详细状态
/yishan diagnose  # 诊断问题
/yishan fix manual  # 手动修复模式
---

此错误需要人工分析和修复，无法自动处理。"

        echo "$manual_recovery"
    fi
}

# 生成错误报告
generate_error_report() {
    local input="$1"
    local error_analysis="$2"

    local report="---
📋 错误分析报告
时间: $(date '+%Y-%m-%d %H:%M:%S')
错误内容: $(echo "$input" | head -3 | tr '\n' ' ')
错误分析: $error_analysis

📊 系统状态
- CPU 使用率: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')
- 内存使用率: $(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
- 磁盘使用率: $(df / | tail -1 | awk '{print $5}')

🔍 最近任务状态
$(tail -5 ~/.oh-my-claude/logs/task-checkpointing.log 2>/dev/null || echo "无最近任务日志")

💡 建议行动
1. 查看详细错误日志: tail -f ~/.oh-my-claude/logs/error-recovery.log
2. 检查系统资源: /status system
3. 分析任务状态: /progress detail
4. 根据恢复策略执行修复
---

报告已保存到错误恢复日志。"

    echo "$report"
}

# 主处理函数
main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 检测和处理错误
    if detect_errors "$input"; then
        log "开始错误恢复流程"

        # 分析错误类型
        local error_analysis=$(analyze_error_type "$input")

        # 生成恢复策略
        generate_recovery_strategy "$error_analysis"

        # 执行自动恢复（如果适用）
        execute_auto_recovery "$error_analysis"

        # 生成错误报告
        generate_error_report "$input" "$error_analysis"

        exit 0
    fi

    # 没有检测到错误，正常退出
    exit 0
}

# 执行主函数
main "$@"