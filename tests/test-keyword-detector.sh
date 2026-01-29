#!/usr/bin/env bash
# 关键词检测器测试脚本
# 用于验证四大执行模式的自动触发功能

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECTOR="$SCRIPT_DIR/../hooks/keyword-detector.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0

# 测试函数
test_prompt() {
    local prompt="$1"
    local expected_mode="$2"
    local description="$3"

    # 调用检测器
    result=$(echo "{\"prompt\": \"$prompt\"}" | bash "$DETECTOR" 2>/dev/null)

    # 检查结果
    if [ -z "$result" ]; then
        actual_mode="none"
    elif echo "$result" | grep -q "ultrapilot-mode"; then
        actual_mode="ultrapilot"
    elif echo "$result" | grep -q "swarm-mode"; then
        actual_mode="swarm"
    elif echo "$result" | grep -q "ecomode"; then
        actual_mode="ecomode"
    elif echo "$result" | grep -q "ultrawork-mode"; then
        actual_mode="yishan"
    elif echo "$result" | grep -q "auto-mode"; then
        actual_mode="auto"
    else
        actual_mode="other"
    fi

    if [ "$actual_mode" = "$expected_mode" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $description"
        echo "  输入: \"$prompt\""
        echo "  期望: $expected_mode, 实际: $actual_mode"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}: $description"
        echo "  输入: \"$prompt\""
        echo "  期望: $expected_mode, 实际: $actual_mode"
        ((FAIL++))
    fi
    echo ""
}

echo "=================================="
echo "  关键词检测器测试"
echo "=================================="
echo ""

# ---- /auto 命令测试 ----
echo -e "${YELLOW}=== /auto 命令测试 ===${NC}"
test_prompt "/auto 构建一个应用" "auto" "/auto 显式命令"
test_prompt "/smart 实现功能" "auto" "/smart 别名"
test_prompt "/zhineng 任务" "auto" "/zhineng 中文别名"

# ---- 超级模式测试 ----
echo -e "${YELLOW}=== 超级模式测试 ===${NC}"
test_prompt "/chaoji 构建应用" "ultrapilot" "/chaoji 显式命令"
test_prompt "构建全栈 Todo 应用" "ultrapilot" "全栈应用"
test_prompt "实现前端和后端" "ultrapilot" "前端和后端"
test_prompt "开发多模块系统" "ultrapilot" "多模块系统"
test_prompt "构建完整的电商系统" "ultrapilot" "完整系统"
test_prompt "微服务架构设计" "ultrapilot" "微服务架构"
test_prompt "monorepo 项目开发" "ultrapilot" "monorepo 项目"

# ---- 蜂群模式测试 ----
echo -e "${YELLOW}=== 蜂群模式测试 ===${NC}"
test_prompt "/fengqun 5:luban 修复错误" "swarm" "/fengqun 显式命令"
test_prompt "修复所有 TypeScript 错误" "swarm" "修复所有错误"
test_prompt "为每个组件添加测试" "swarm" "为每个组件"
test_prompt "批量处理文件" "swarm" "批量处理"
test_prompt "给所有服务添加日志" "swarm" "给所有服务"

# ---- 节俭模式测试 ----
echo -e "${YELLOW}=== 节俭模式测试 ===${NC}"
test_prompt "/jiejian 修复 bug" "ecomode" "/jiejian 显式命令"
test_prompt "省 token 完成任务" "ecomode" "省 token"
test_prompt "简单任务修改按钮" "ecomode" "简单任务"
test_prompt "用 haiku 完成" "ecomode" "用 haiku"
test_prompt "别用 opus" "ecomode" "别用 opus"

# ---- 标准愚公模式测试 ----
echo -e "${YELLOW}=== 标准愚公模式测试 ===${NC}"
test_prompt "/yishan 实现功能" "yishan" "/yishan 显式命令"
test_prompt "实现用户登录功能" "yishan" "实现功能"
test_prompt "重构认证模块" "yishan" "重构模块"

# ---- 不应触发的测试 ----
echo -e "${YELLOW}=== 不应触发模式的测试 ===${NC}"
test_prompt "你好" "none" "简单问候"
test_prompt "这个函数返回什么" "none" "简单问题"

# ---- 总结 ----
echo "=================================="
echo "  测试结果"
echo "=================================="
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}有 $FAIL 个测试失败${NC}"
    exit 1
fi
