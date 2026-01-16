# ============================================================================
# 愚公移山 Stop Hook (Yishan Stop Hook) - Windows PowerShell 版本
# ============================================================================
# 核心循环控制脚本，实现类似 Ralph Wiggum 的自主持续执行机制
# 当 Claude 想停止时，此 hook 检查任务是否完成，未完成则自动继续
# ============================================================================

$ErrorActionPreference = "Stop"

# 从 stdin 读取 hook 输入
$hookInput = $input | Out-String

# 状态文件路径
$stateFile = ".claude/yishan-loop.local.md"

# 如果状态文件不存在，允许正常退出
if (-not (Test-Path $stateFile)) {
    exit 0
}

# ============================================================================
# 解析状态文件
# ============================================================================

$content = Get-Content $stateFile -Raw
$lines = $content -split "`n"

# 解析 YAML frontmatter
$inFrontmatter = $false
$frontmatterLines = @()
$promptLines = @()
$frontmatterEnded = $false
$dashCount = 0

foreach ($line in $lines) {
    if ($line.Trim() -eq "---") {
        $dashCount++
        if ($dashCount -eq 1) {
            $inFrontmatter = $true
            continue
        }
        if ($dashCount -eq 2) {
            $inFrontmatter = $false
            $frontmatterEnded = $true
            continue
        }
    }

    if ($inFrontmatter) {
        $frontmatterLines += $line
    }
    elseif ($frontmatterEnded) {
        $promptLines += $line
    }
}

# 解析字段
$iteration = 0
$maxIterations = 0
$completionPromise = ""

foreach ($line in $frontmatterLines) {
    if ($line -match "^iteration:\s*(\d+)") {
        $iteration = [int]$Matches[1]
    }
    elseif ($line -match "^max_iterations:\s*(\d+)") {
        $maxIterations = [int]$Matches[1]
    }
    elseif ($line -match '^completion_promise:\s*"?([^"]*)"?') {
        $completionPromise = $Matches[1]
    }
}

# ============================================================================
# 检查最大迭代次数
# ============================================================================

if ($maxIterations -gt 0 -and $iteration -ge $maxIterations) {
    Write-Host "🛑 愚公移山: 已达最大迭代次数 ($maxIterations)"
    Write-Host "   就像愚公移山需要世代相传，有些任务需要分阶段完成。"
    Remove-Item $stateFile -Force
    exit 0
}

# ============================================================================
# 获取 Claude 最后的输出
# ============================================================================

try {
    $hookData = $hookInput | ConvertFrom-Json
    $transcriptPath = $hookData.transcript_path
}
catch {
    Write-Host "⚠️ 愚公移山: 无法解析 hook 输入" -ForegroundColor Yellow
    Remove-Item $stateFile -Force
    exit 0
}

if (-not (Test-Path $transcriptPath)) {
    Write-Host "⚠️ 愚公移山: 找不到会话记录文件" -ForegroundColor Yellow
    Write-Host "  预期路径: $transcriptPath"
    Remove-Item $stateFile -Force
    exit 0
}

# 读取 transcript 并找最后一条 assistant 消息
$transcriptContent = Get-Content $transcriptPath -Raw
$lastOutput = ""

# 解析 JSONL 格式
$transcriptLines = $transcriptContent -split "`n" | Where-Object { $_ -match '"role":"assistant"' }

if ($transcriptLines.Count -eq 0) {
    Write-Host "⚠️ 愚公移山: 会话记录中没有找到助手消息" -ForegroundColor Yellow
    Remove-Item $stateFile -Force
    exit 0
}

$lastLine = $transcriptLines[-1]

try {
    $lastMsg = $lastLine | ConvertFrom-Json
    $textContents = $lastMsg.message.content | Where-Object { $_.type -eq "text" }
    $lastOutput = ($textContents | ForEach-Object { $_.text }) -join "`n"
}
catch {
    Write-Host "⚠️ 愚公移山: 无法解析助手消息" -ForegroundColor Yellow
    Remove-Item $stateFile -Force
    exit 0
}

if ([string]::IsNullOrWhiteSpace($lastOutput)) {
    Write-Host "⚠️ 愚公移山: 助手消息没有文本内容" -ForegroundColor Yellow
    Remove-Item $stateFile -Force
    exit 0
}

# ============================================================================
# 检查完成标记 <promise>...</promise>
# ============================================================================

if (-not [string]::IsNullOrWhiteSpace($completionPromise)) {
    if ($lastOutput -match '<promise>(.*?)</promise>') {
        $promiseText = $Matches[1].Trim()
        if ($promiseText -eq $completionPromise) {
            Write-Host "✅ 愚公移山: 检测到完成标记 <promise>$completionPromise</promise>"
            Write-Host "   🎉 任务完成！愚公精神：坚持就是胜利！"
            Remove-Item $stateFile -Force
            exit 0
        }
    }
}

# ============================================================================
# 未完成 - 继续循环
# ============================================================================

$nextIteration = $iteration + 1
$promptText = $promptLines -join "`n"

if ([string]::IsNullOrWhiteSpace($promptText)) {
    Write-Host "⚠️ 愚公移山: 状态文件不完整，找不到 prompt 内容" -ForegroundColor Yellow
    Remove-Item $stateFile -Force
    exit 0
}

# 更新迭代次数
$newContent = $content -replace "iteration:\s*\d+", "iteration: $nextIteration"
Set-Content -Path $stateFile -Value $newContent -NoNewline

# 构建系统消息
if (-not [string]::IsNullOrWhiteSpace($completionPromise)) {
    $systemMsg = "🏔️ 愚公移山 第 $nextIteration 次搬石 | 完成时输出: <promise>$completionPromise</promise> (仅在任务真正完成时输出，不要虚报！)"
}
else {
    $systemMsg = "🏔️ 愚公移山 第 $nextIteration 次搬石 | 未设置完成标记 - 将持续执行直到取消"
}

# 输出 JSON 阻止退出并重新注入 prompt
$result = @{
    decision = "block"
    reason = $promptText
    systemMessage = $systemMsg
} | ConvertTo-Json -Compress

Write-Output $result
exit 0
