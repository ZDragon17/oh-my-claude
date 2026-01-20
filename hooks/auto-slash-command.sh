#!/bin/bash
# Auto Slash Command Hook
# 功能：检测用户输入中的隐式斜杠命令意图，并提供建议
# 例如：用户输入"帮我debug这个问题" → 建议使用 /bianque

# 环境变量
HOOK_NAME="auto-slash-command"
PROMPT="${CLAUDE_PROMPT:-}"

# ============================================================================
# 命令映射表
# ============================================================================

# 定义意图到命令的映射
declare -A INTENT_COMMANDS=(
    # 调试相关
    ["debug"]="/bianque"
    ["fix bug"]="/bianque"
    ["fix error"]="/bianque"
    ["报错"]="/bianque"
    ["调试"]="/bianque"
    ["诊断"]="/bianque"
    
    # 架构设计
    ["architecture"]="/zhuge"
    ["设计"]="/zhuge"
    ["架构"]="/zhuge"
    ["strategy"]="/zhuge"
    
    # 代码实现
    ["implement"]="/luban"
    ["实现"]="/luban"
    ["开发"]="/luban"
    ["构建"]="/luban"
    
    # 代码探索
    ["explore"]="/wukong"
    ["find"]="/wukong"
    ["search"]="/wukong"
    ["找到"]="/wukong"
    ["搜索"]="/wukong"
    
    # 安全审计
    ["security"]="/mozi"
    ["安全"]="/mozi"
    ["漏洞"]="/mozi"
    ["audit"]="/mozi"
    
    # 性能优化
    ["performance"]="/sunzi"
    ["性能"]="/sunzi"
    ["优化"]="/sunzi"
    ["slow"]="/sunzi"
    
    # 文档编写
    ["document"]="/simaqian"
    ["文档"]="/simaqian"
    ["readme"]="/simaqian"
    ["changelog"]="/simaqian"
    
    # API 相关
    ["api"]="/zhenghe"
    ["接口"]="/zhenghe"
    ["integration"]="/zhenghe"
    
    # 监控相关
    ["monitor"]="/zhangheng"
    ["监控"]="/zhangheng"
    ["logging"]="/zhangheng"
    ["日志"]="/zhangheng"
    
    # DevOps
    ["devops"]="/libing"
    ["部署"]="/libing"
    ["ci/cd"]="/libing"
    ["docker"]="/libing"
    
    # 代码简化
    ["simplify"]="/laozi"
    ["简化"]="/laozi"
    ["重构"]="/laozi"
    ["clean"]="/laozi"
    
    # 测试
    ["test"]="/baozheng"
    ["测试"]="/baozheng"
    ["tdd"]="/baozheng"
    
    # 代码审查
    ["review"]="/weizheng"
    ["审查"]="/weizheng"
    ["code review"]="/weizheng"
    
    # 数据库
    ["database"]="/cangjie"
    ["数据库"]="/cangjie"
    ["sql"]="/cangjie"
    
    # 需求分析
    ["requirement"]="/libai"
    ["需求"]="/libai"
    ["用户故事"]="/libai"
    
    # UI/UX
    ["ui"]="/gukaizhi"
    ["ux"]="/gukaizhi"
    ["界面"]="/gukaizhi"
    ["设计稿"]="/gukaizhi"
    
    # 云服务
    ["cloud"]="/change"
    ["云"]="/change"
    ["serverless"]="/change"
    
    # 多模态
    ["image"]="/huitu"
    ["图片"]="/huitu"
    ["pdf"]="/huitu"
    ["screenshot"]="/huitu"
    
    # 持续执行
    ["persist"]="/yishan"
    ["移山"]="/yishan"
    ["ultrawork"]="/yishan"
)

# ============================================================================
# 核心函数
# ============================================================================

# 检测用户意图
detect_intent() {
    local prompt="$1"
    local prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    
    # 检查是否已经是斜杠命令
    if echo "$prompt" | grep -qE '^\s*/[a-zA-Z]'; then
        return  # 已经是斜杠命令，不需要建议
    fi
    
    # 遍历意图映射
    for intent in "${!INTENT_COMMANDS[@]}"; do
        if echo "$prompt_lower" | grep -qi "$intent"; then
            echo "${INTENT_COMMANDS[$intent]}"
            return
        fi
    done
}

# 获取命令描述
get_command_description() {
    local cmd="$1"
    
    case "$cmd" in
        "/bianque") echo "扁鹊 - Bug 诊断和修复专家" ;;
        "/zhuge") echo "诸葛 - 架构设计和战略顾问" ;;
        "/luban") echo "鲁班 - 精工巧匠，代码实现" ;;
        "/wukong") echo "悟空 - 代码侦察，快速探索" ;;
        "/mozi") echo "墨子 - 安全审计专家" ;;
        "/sunzi") echo "孙子 - 性能优化策略" ;;
        "/simaqian") echo "司马迁 - 文档编写史官" ;;
        "/zhenghe") echo "郑和 - API 集成航海家" ;;
        "/zhangheng") echo "张衡 - 系统监控观测家" ;;
        "/libing") echo "李冰 - DevOps 水利专家" ;;
        "/laozi") echo "老子 - 代码简化大师" ;;
        "/baozheng") echo "包拯 - 测试专家，TDD" ;;
        "/weizheng") echo "魏征 - 代码审查谏臣" ;;
        "/cangjie") echo "仓颉 - 数据库设计专家" ;;
        "/libai") echo "李白 - 需求分析炼金师" ;;
        "/gukaizhi") echo "顾恺之 - UI/UX 美学师" ;;
        "/change") echo "嫦娥 - 云端服务仙子" ;;
        "/huitu") echo "绘图 - 多模态分析专家" ;;
        "/yishan") echo "愚公移山 - 持续执行模式" ;;
        *) echo "专业 Agent" ;;
    esac
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 只在有提示时运行
    if [ -z "$PROMPT" ]; then
        exit 0
    fi
    
    # 检测意图
    local suggested_cmd=$(detect_intent "$PROMPT")
    
    if [ -n "$suggested_cmd" ]; then
        local description=$(get_command_description "$suggested_cmd")
        
        cat << EOF

[Auto-Slash] Detected intent matching command: $suggested_cmd
Description: $description

TIP: You can directly invoke "$suggested_cmd [your request]" for specialized assistance.
EOF
    fi
}

# 执行
main
