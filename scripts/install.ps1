# oh-my-claude PowerShell 安装脚本
# 用法: irm https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.ps1 | iex
# 或者: Invoke-WebRequest -Uri "..." -OutFile install.ps1; .\install.ps1

#Requires -Version 5.1

$ErrorActionPreference = "Stop"

# 配置
$Repo = "ZDragon17/oh-my-claude"
$PluginName = "oh-my-claude"
$InstallDir = Join-Path $env:USERPROFILE ".claude\plugins\$PluginName"
$CommandsDir = Join-Path $env:USERPROFILE ".claude\commands"
$SkillsDir = Join-Path $env:USERPROFILE ".claude\skills"

# 输出函数
function Write-Info($msg) { Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Success($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "❌ $msg" -ForegroundColor Red; exit 1 }

# 显示横幅
function Show-Banner {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏔️  oh-my-claude 安装程序" -ForegroundColor Cyan
    Write-Host "   基于中国传统文化的 Claude Code 智能编排插件" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

# 检查依赖
function Test-Dependencies {
    Write-Info "检查依赖..."

    # 检查 git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Err "需要 git，请先安装: https://git-scm.com/"
    }

    # 检查 Claude Code
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
        Write-Warn "未检测到 Claude Code CLI"
        Write-Warn "请先安装 Claude Code: https://claude.ai/code"
        Write-Warn "安装后重新运行此脚本"
        exit 1
    }

    Write-Success "依赖检查通过"
}

# 带重试的 Git 克隆
function Invoke-GitCloneWithRetry {
    param(
        [string]$RepoUrl,
        [string]$DestDir,
        [int]$MaxRetries = 3,
        [int]$DelaySeconds = 5
    )

    $attempt = 0
    $lastError = $null

    while ($attempt -lt $MaxRetries) {
        $attempt++
        Write-Info "下载尝试 $attempt/$MaxRetries..."

        try {
            # 清理目标目录（如果存在）
            if (Test-Path $DestDir) {
                Remove-Item -Path $DestDir -Recurse -Force -ErrorAction SilentlyContinue
            }

            # 尝试克隆（使用 Start-Process 避免 stderr 问题）
            $process = Start-Process -FilePath "git" -ArgumentList "clone", "--depth", "1", $RepoUrl, $DestDir -Wait -PassThru -NoNewWindow -RedirectStandardError "$env:TEMP\git-clone-err.txt" -RedirectStandardOutput "$env:TEMP\git-clone-out.txt"

            if ($process.ExitCode -eq 0) {
                # 验证目录确实创建了
                if (Test-Path $DestDir) {
                    return $true
                }
            }

            # 读取错误输出
            if (Test-Path "$env:TEMP\git-clone-err.txt") {
                $lastError = Get-Content "$env:TEMP\git-clone-err.txt" -Raw -ErrorAction SilentlyContinue
            }
        } catch {
            $lastError = $_.Exception.Message
        }

        if ($attempt -lt $MaxRetries) {
            Write-Warn "下载失败，${DelaySeconds} 秒后重试..."
            Start-Sleep -Seconds $DelaySeconds
            # 指数退避
            $DelaySeconds = $DelaySeconds * 2
        }
    }

    # 所有重试都失败
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "下载失败，请尝试以下解决方案：" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. 检查网络连接" -ForegroundColor Yellow
    Write-Host "   ping github.com"
    Write-Host ""
    Write-Host "2. 检查 Git 配置" -ForegroundColor Yellow
    Write-Host "   git config --global http.sslVerify false  # 临时禁用 SSL 验证"
    Write-Host ""
    Write-Host "3. 使用代理（如有）" -ForegroundColor Yellow
    Write-Host "   git config --global http.proxy http://your-proxy:port"
    Write-Host ""
    Write-Host "4. 手动下载" -ForegroundColor Yellow
    Write-Host "   访问: https://github.com/$Repo/releases"
    Write-Host "   下载 zip 后解压到: $InstallDir"
    Write-Host ""
    if ($lastError) {
        Write-Host "错误详情: $lastError" -ForegroundColor Gray
    }

    return $false
}

# 下载并安装
function Install-Plugin {
    Write-Info "正在下载 oh-my-claude..."

    # 创建临时目录
    $TmpDir = Join-Path $env:TEMP "oh-my-claude-$(Get-Random)"
    New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null

    try {
        # 带重试的克隆
        if (-not (Invoke-GitCloneWithRetry -RepoUrl "https://github.com/$Repo.git" -DestDir $TmpDir)) {
            exit 1
        }

        Write-Success "下载完成"

        # 创建安装目录
        Write-Info "正在安装插件..."
        $ParentDir = Split-Path $InstallDir -Parent
        if (-not (Test-Path $ParentDir)) {
            New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
        }

        # 备份变量（用于回滚）
        $BackupDir = $null

        # 如果已存在，先备份（而不是直接删除）
        if (Test-Path $InstallDir) {
            Write-Warn "检测到已有安装，正在备份..."
            $BackupDir = "$InstallDir.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
            Move-Item -Path $InstallDir -Destination $BackupDir -Force
        }

        $InstallSuccess = $false

        try {
            # 复制文件
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

            $Dirs = @("agents", "commands", "hooks", "skills", ".claude-plugin")
            foreach ($Dir in $Dirs) {
                $Src = Join-Path $TmpDir $Dir
                $Dest = Join-Path $InstallDir $Dir
                if (Test-Path $Src) {
                    Copy-Item -Path $Src -Destination $Dest -Recurse -Force -ErrorAction Stop
                }
            }

            # 复制其他文件（可选）
            $Files = @("README.md", "README_EN.md", "LICENSE")
            foreach ($File in $Files) {
                $Src = Join-Path $TmpDir $File
                $Dest = Join-Path $InstallDir $File
                if (Test-Path $Src) {
                    Copy-Item -Path $Src -Destination $Dest -Force -ErrorAction SilentlyContinue
                }
            }

            # Windows 不需要设置执行权限

            # 安装 slash commands 到 ~/.claude/commands/
            Write-Info "正在安装 slash commands..."
            if (-not (Test-Path $CommandsDir)) {
                New-Item -ItemType Directory -Path $CommandsDir -Force | Out-Null
            }
            $CommandsSrc = Join-Path $TmpDir "commands"
            if (Test-Path $CommandsSrc) {
                Get-ChildItem -Path $CommandsSrc -Filter "*.md" | ForEach-Object {
                    Copy-Item -Path $_.FullName -Destination $CommandsDir -Force -ErrorAction Stop
                }
                Write-Success "Slash commands 安装完成"
                Write-Info "Commands 位置: $CommandsDir"
            }

            # 安装 skills 到 ~/.claude/skills/
            Write-Info "正在安装 skills..."
            $SkillsSrc = Join-Path $TmpDir "skills"
            if (Test-Path $SkillsSrc) {
                Get-ChildItem -Path $SkillsSrc -Directory | ForEach-Object {
                    $SkillName = $_.Name
                    $SkillDestDir = Join-Path $SkillsDir $SkillName

                    # 创建 skill 目录
                    if (-not (Test-Path $SkillDestDir)) {
                        New-Item -ItemType Directory -Path $SkillDestDir -Force | Out-Null
                    }

                    # 复制 SKILL.md (如果存在)
                    $SkillMdSrc = Join-Path $_.FullName "SKILL.md"
                    if (Test-Path $SkillMdSrc) {
                        Copy-Item -Path $SkillMdSrc -Destination $SkillDestDir -Force -ErrorAction Stop
                    }

                    # 复制其他支持文件
                    Get-ChildItem -Path $_.FullName -File | Where-Object { $_.Name -ne "skill.json" } | ForEach-Object {
                        Copy-Item -Path $_.FullName -Destination $SkillDestDir -Force -ErrorAction SilentlyContinue
                    }
                }
                Write-Success "Skills 安装完成"
                Write-Info "Skills 位置: $SkillsDir"
            }

            $InstallSuccess = $true
            Write-Success "插件文件安装完成"
            Write-Info "插件位置: $InstallDir"

        } catch {
            # 安装失败
            Write-Err "安装文件复制失败: $_"
        }

        # 根据安装结果处理备份
        if ($InstallSuccess) {
            # 安装成功，删除备份
            if ($BackupDir -and (Test-Path $BackupDir)) {
                Remove-Item -Path $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
            }
            # 注意：不再需要 claude plugins install，因为 commands 和 skills 已安装到标准目录
        } else {
            # 安装失败，回滚
            if (Test-Path $InstallDir) {
                Write-Warn "正在清理失败的安装..."
                Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
            }

            if ($BackupDir -and (Test-Path $BackupDir)) {
                Write-Info "正在恢复之前的安装..."
                Move-Item -Path $BackupDir -Destination $InstallDir -Force
                Write-Success "已恢复之前的安装"
            }

            exit 1
        }
    }
    finally {
        # 清理临时目录
        if (Test-Path $TmpDir) {
            Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# 验证安装
function Test-Installation {
    Write-Info "验证安装..."
    $errors = 0

    # 检查关键命令文件
    $yishanPath = Join-Path $CommandsDir "yishan.md"
    if (Test-Path $yishanPath) {
        Write-Success "✓ yishan.md 已安装"
    } else {
        Write-Warn "✗ yishan.md 未找到"
        $errors++
    }

    # 检查命令数量
    $cmdFiles = Get-ChildItem -Path $CommandsDir -Filter "*.md" -ErrorAction SilentlyContinue
    $cmdCount = ($cmdFiles | Measure-Object).Count
    if ($cmdCount -gt 0) {
        Write-Success "✓ 已安装 $cmdCount 个命令"
    } else {
        Write-Warn "✗ 未检测到任何命令文件"
        $errors++
    }

    if ($errors -gt 0) {
        Write-Warn "安装可能不完整，请检查上述警告"
    }
}

# 显示完成信息
function Show-Success {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🎉 安装完成!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  重要：请完全退出并重新启动 Claude Code 以加载新命令" -ForegroundColor Yellow
    Write-Host "   (仅关闭窗口可能不够，需要完全退出应用)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "快速开始:" -ForegroundColor Cyan
    Write-Host "  /yishan  - 愚公移山模式（大规模任务）"
    Write-Host "  /zhuge   - 诸葛顾问（架构设计）"
    Write-Host "  /bianque - 扁鹊诊断（调试问题）"
    Write-Host "  /luban   - 鲁班巧工（前端开发）"
    Write-Host "  /wukong  - 悟空探索（代码搜索）"
    Write-Host ""
    Write-Host "查看所有 Agent:" -ForegroundColor Cyan
    Write-Host "  https://github.com/$Repo#-agent-列表"
    Write-Host ""
    Write-Host "安装位置:" -ForegroundColor Cyan
    Write-Host "  Commands: $CommandsDir"
    Write-Host "  Skills:   $SkillsDir"
    Write-Host "  Plugin:   $InstallDir"
    Write-Host ""
}

# 主程序
Show-Banner
Test-Dependencies
Install-Plugin
Test-Installation
Show-Success
