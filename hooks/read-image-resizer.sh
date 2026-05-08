#!/usr/bin/env bash
# ============================================================================
# Read Image Resizer - 图片自动裁剪
# 对标 oh-my-opencode read-image-resizer
# ============================================================================
# 在 Read 工具读取图片文件前，自动裁剪大图（最大 2048x2048）
# ============================================================================

set -euo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo '')
if [ "$TOOL_NAME" != "Read" ] && [ "$TOOL_NAME" != "read" ]; then
    exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo '')

# 检查是否为图片文件
if ! echo "$FILE_PATH" | grep -qiE '\.(png|jpg|jpeg|gif|webp|bmp)$' 2>/dev/null; then
    exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# 检查尺寸并裁剪
RESIZE_TOOL=""
if command -v convert &>/dev/null; then
    RESIZE_TOOL="imagemagick"
elif command -v ffmpeg &>/dev/null; then
    RESIZE_TOOL="ffmpeg"
elif command -v sips &>/dev/null; then
    RESIZE_TOOL="sips"  # macOS
fi

if [ -z "$RESIZE_TOOL" ]; then
    exit 0  # 无可用工具，跳过
fi

CACHE_DIR="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude}/cache/resized"
mkdir -p "$CACHE_DIR"

FILE_HASH=$(md5sum "$FILE_PATH" 2>/dev/null | cut -d' ' -f1 || md5 "$FILE_PATH" 2>/dev/null | cut -d' ' -f4 || echo '0')
EXT="${FILE_PATH##*.}"
CACHE_FILE="$CACHE_DIR/${FILE_HASH}.${EXT}"

MAX_DIM=2048

case "$RESIZE_TOOL" in
    imagemagick)
        # 获取当前尺寸
        DIMS=$(identify -format "%w %h" "$FILE_PATH" 2>/dev/null || echo "0 0")
        W=$(echo "$DIMS" | cut -d' ' -f1)
        H=$(echo "$DIMS" | cut -d' ' -f2)

        if [ "$W" -gt "$MAX_DIM" ] || [ "$H" -gt "$MAX_DIM" ]; then
            convert "$FILE_PATH" -resize "${MAX_DIM}x${MAX_DIM}>" "$CACHE_FILE" 2>/dev/null || exit 0
            printf '{"systemMessage":"\\n\\n📷 **图片已自动裁剪**: %sx%s → 最大 %s (缓存: %s)\\n"}\n' \
                "$W" "$H" "$MAX_DIM" "$CACHE_FILE"
        fi
        ;;
    ffmpeg)
        DIMS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$FILE_PATH" 2>/dev/null || echo "0x0")
        W=$(echo "$DIMS" | cut -d'x' -f1)
        H=$(echo "$DIMS" | cut -d'x' -f2)

        if [ "$W" -gt "$MAX_DIM" ] || [ "$H" -gt "$MAX_DIM" ]; then
            ffmpeg -y -i "$FILE_PATH" -vf "scale='min($MAX_DIM,iw)':'min($MAX_DIM,ih)':force_original_aspect_ratio=decrease" "$CACHE_FILE" 2>/dev/null || exit 0
            printf '{"systemMessage":"\\n\\n📷 **图片已自动裁剪**: %sx%s → 最大 %s (缓存: %s)\\n"}\n' \
                "$W" "$H" "$MAX_DIM" "$CACHE_FILE"
        fi
        ;;
    sips)
        DIMS=$(sips -g pixelWidth -g pixelHeight "$FILE_PATH" 2>/dev/null | grep -oE '[0-9]+' | tr '\n' ' ')
        W=$(echo "$DIMS" | cut -d' ' -f1)
        H=$(echo "$DIMS" | cut -d' ' -f2)

        if [ "$W" -gt "$MAX_DIM" ] || [ "$H" -gt "$MAX_DIM" ]; then
            cp "$FILE_PATH" "$CACHE_FILE" 2>/dev/null
            sips --resampleWidth "$MAX_DIM" --resampleHeight "$MAX_DIM" "$CACHE_FILE" 2>/dev/null || exit 0
            printf '{"systemMessage":"\\n\\n📷 **图片已自动裁剪**: %sx%s → 最大 %s (缓存: %s)\\n"}\n' \
                "$W" "$H" "$MAX_DIM" "$CACHE_FILE"
        fi
        ;;
esac

exit 0
