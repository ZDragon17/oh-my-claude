#!/usr/bin/env bash
# ============================================================================
# platform.sh — oh-my-claude 跨平台兼容性库
# ============================================================================
# 提供跨 GNU/Linux、macOS、Windows (Git Bash) 的统一 shell 工具函数。
# 所有函数以 `platform_` 为前缀，避免命名冲突。
#
# 使用方式：
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/platform.sh" 2>/dev/null || \
#     source "$(dirname "$0")/hooks/lib/platform.sh" 2>/dev/null
# ============================================================================

# ---- 平台检测 --------------------------------------------------------------

platform_is_linux()  { [[ "$(uname -s)" == Linux ]]; }
platform_is_macos()  { [[ "$(uname -s)" == Darwin ]]; }
platform_is_bsd()    { [[ "$(uname -s)" =~ (Darwin|FreeBSD|OpenBSD|NetBSD) ]]; }
platform_is_gnu()    { [[ "$(uname -s)" =~ (Linux|GNU|GNU/kFreeBSD) ]]; }

# ---- sed -i 跨平台兼容 -------------------------------------------------------
#
# 问题：GNU sed 的 `-i` 不接受备份后缀; BSD sed 要求必须跟后缀
# 用法：platform_sed_i "s/pattern/replacement/" "$file"

platform_sed_i() {
  local expr="$1" file="$2"
  if [ ! -f "$file" ]; then
    return 1
  fi
  if platform_is_bsd; then
    sed -i '' "$expr" "$file"
  else
    sed -i "$expr" "$file"
  fi
}

# ---- 时间戳 ----------------------------------------------------------------
#
# 问题：`date -Iseconds` 是 GNU 扩展，macOS 上不可用
# 用法：ts=$(platform_timestamp)        → 2026-04-29T15:30:45+08:00
#       ts=$(platform_timestamp utc)    → 2026-04-29T07:30:45Z

platform_timestamp() {
  local mode="${1:-}"
  if [ "$mode" = "utc" ]; then
    date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u "+%Y-%m-%dT%H:%M:%SZ" 2>/dev/null
  else
    date -Iseconds 2>/dev/null || date "+%Y-%m-%dT%H:%M:%S%z" 2>/dev/null || date "+%Y-%m-%d %H:%M:%S"
  fi
}

# ---- 文件修改时间 -----------------------------------------------------------
#
# 问题：BSD stat -f %m vs GNU stat -c %Y (两者返回纪元秒)
# 用法：mtime=$(platform_file_mtime "$file")  或  mtime=$(platform_file_mtime "$file" 0)

platform_file_mtime() {
  local file="$1" default="${2:-}"
  if [ ! -f "$file" ]; then
    echo "${default:-0}"
    return 0
  fi
  # macOS: stat -f %m  |  Linux: stat -c %Y
  # 先试当前平台的，出错则换另一个
  local mtime
  if platform_is_bsd; then
    mtime=$(stat -f %m "$file" 2>/dev/null) || mtime=$(stat -c %Y "$file" 2>/dev/null)
  else
    mtime=$(stat -c %Y "$file" 2>/dev/null) || mtime=$(stat -f %m "$file" 2>/dev/null)
  fi
  echo "${mtime:-${default:-0}}"
}

# ---- 文件大小 ---------------------------------------------------------------
#
# 问题：BSD stat -f %z vs GNU stat -c %s
# 用法：size=$(platform_file_size "$file")

platform_file_size() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "0"
    return 0
  fi
  local size
  if platform_is_bsd; then
    size=$(stat -f %z "$file" 2>/dev/null) || size=$(stat -c %s "$file" 2>/dev/null)
  else
    size=$(stat -c %s "$file" 2>/dev/null) || size=$(stat -f %z "$file" 2>/dev/null)
  fi
  echo "${size:-0}"
}

# ---- 平台安全 md5 -----------------------------------------------------------
#
# 问题：Linux 使用 `md5sum`，macOS 使用 `md5`
# 用法：hash=$(platform_md5 "$str" 2>/dev/null || echo "")

platform_md5() {
  local input="$1"
  if command -v md5sum >/dev/null 2>&1; then
    echo "$input" | md5sum | cut -d' ' -f1
  elif command -v md5 >/dev/null 2>&1; then
    echo "$input" | md5
  elif command -v shasum >/dev/null 2>&1; then
    echo "$input" | shasum -a 256 | cut -d' ' -f1
  else
    echo ""
    return 1
  fi
}

# ---- 安全 JSON 字段读取（不使用 sed）-----------------------------------------
#
# 问题：用 sed 从 JSON 提取字段会破坏结构化数据，无法正确转义。
# 用法：value=$(platform_read_json_field "tool_name" < "$file")
#       value=$(echo "$json" | platform_read_json_field "tool_name")

platform_read_json_field() {
  local field="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".${field} // empty" 2>/dev/null
  else
    # fallback: grep-based extraction，仅用于简单字符串值
    grep -o "\"${field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" 2>/dev/null | \
      sed "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\\1/" | \
      head -1
  fi
}

# ---- 原子文件写入 -----------------------------------------------------------
#
# 先写到 .tmp 再 mv，避免部分写入
# 用法：platform_atomic_write "$content" "$file"

platform_atomic_write() {
  local content="$1" dest="$2" tmp="${dest}.tmp.$$"
  printf '%s\n' "$content" > "$tmp" 2>/dev/null && mv "$tmp" "$dest" 2>/dev/null
}

# ---- 文件锁 -----------------------------------------------------------------
#
# 跨平台文件锁。使用 mkdir 作为原子操作（在所有文件系统上都是原子的）。
# 用法：
#   platform_acquire_lock "my-resource" 30     # 最多等 30 秒
#   # ... 临界区 ...
#   platform_release_lock "my-resource"

_LOCK_DIR="${HOME}/.oh-my-claude/locks"

platform_acquire_lock() {
  local name="$1" timeout="${2:-10}" lock_dir="${_LOCK_DIR}/${name}.lock"
  mkdir -p "$_LOCK_DIR" 2>/dev/null
  local waited=0
  while ! mkdir "$lock_dir" 2>/dev/null; do
    if [ "$waited" -ge "$timeout" ]; then
      return 1
    fi
    sleep 0.1 2>/dev/null || sleep 1
    waited=$((waited + 1))  # 每 0.1s 一次，timeout 对应十分之一秒近似
  done
  # 记录 PID 方便调试
  echo "$$" > "${lock_dir}/pid" 2>/dev/null
  return 0
}

platform_release_lock() {
  local name="$1" lock_dir="${_LOCK_DIR:-${HOME}/.oh-my-claude/locks}/${name}.lock"
  if [ -d "$lock_dir" ]; then
    rm -rf "$lock_dir" 2>/dev/null
  fi
}

# ---- JSON 布尔字段读取（不用 sed）--------------------------------------------

platform_read_json_bool() {
  local field="$1"
  if command -v jq >/dev/null 2>&1; then
    local val
    val=$(jq -r ".${field} // false" 2>/dev/null)
    [ "$val" = "true" ] && return 0 || return 1
  else
    grep -q "\"${field}\"[[:space:]]*:[[:space:]]*true" 2>/dev/null && return 0 || return 1
  fi
}

# ---- 数值字段读取 -----------------------------------------------------------

platform_read_json_number() {
  local field="$1" default="${2:-0}"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".${field} // ${default}" 2>/dev/null
  else
    local val
    val=$(grep -o "\"${field}\"[[:space:]]*:[[:space:]]*[0-9]*" 2>/dev/null | grep -o '[0-9]*$' | head -1)
    echo "${val:-${default}}"
  fi
}

# ---- JavaScript 风格 sleep（毫秒级，不依赖外部命令）--------------------------

platform_msleep() {
  local ms="$1"
  if [ "$ms" -le 0 ] 2>/dev/null; then
    return 0
  fi
  # 尝试使用内置 sleep（现代 bash、zsh）
  local sec
  sec=$(awk "BEGIN {printf \"%.3f\", ${ms}/1000}" 2>/dev/null) || sec=$((ms / 1000))
  sleep "$sec" 2>/dev/null || sleep 1
}

echo "platform.sh loaded" >/dev/null
