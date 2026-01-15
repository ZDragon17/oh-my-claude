# oh-my-claude Homebrew Formula
# 用法: brew tap ZDragon17/oh-my-claude && brew install oh-my-claude

class OhMyClaude < Formula
  desc "基于中国传统文化的 Claude Code 智能编排插件"
  homepage "https://github.com/ZDragon17/oh-my-claude"
  url "https://github.com/ZDragon17/oh-my-claude/archive/refs/tags/v0.8.2.tar.gz"
  sha256 "PLACEHOLDER_SHA256"  # 需要在发布时更新
  license "MIT"
  head "https://github.com/ZDragon17/oh-my-claude.git", branch: "main"

  depends_on "node" => :optional  # 可选依赖，用于 npm 方式

  def install
    # 安装到 Homebrew 的 prefix 目录
    prefix.install Dir["*"]
    prefix.install Dir[".*"].reject { |f| f =~ /^\.\.?$/ || f =~ /^\.git/ }

    # 创建 bin 脚本
    (bin/"oh-my-claude").write <<~EOS
      #!/bin/bash
      exec node "#{prefix}/scripts/cli.js" "$@"
    EOS
  end

  def post_install
    # 创建符号链接到 Claude 插件目录
    claude_plugins = "#{Dir.home}/.claude/plugins/oh-my-claude"

    # 如果已存在，先删除
    if File.exist?(claude_plugins) || File.symlink?(claude_plugins)
      FileUtils.rm_rf(claude_plugins)
    end

    # 创建目录结构
    FileUtils.mkdir_p(File.dirname(claude_plugins))

    # 复制文件（而非符号链接，因为 Claude 可能不支持符号链接）
    dirs = %w[agents commands hooks skills .claude-plugin]
    FileUtils.mkdir_p(claude_plugins)

    dirs.each do |dir|
      src = "#{prefix}/#{dir}"
      if File.exist?(src)
        FileUtils.cp_r(src, claude_plugins)
      end
    end

    # 复制其他文件
    %w[README.md README_EN.md LICENSE].each do |file|
      src = "#{prefix}/#{file}"
      FileUtils.cp(src, claude_plugins) if File.exist?(src)
    end

    # 设置权限
    Dir.glob("#{claude_plugins}/hooks/*.sh").each do |f|
      FileUtils.chmod(0o755, f)
    end

    ohai "oh-my-claude 已安装到 #{claude_plugins}"
    ohai "请运行: claude plugins install #{claude_plugins}"
  end

  def caveats
    <<~EOS
      oh-my-claude 已安装!

      请运行以下命令完成插件注册:
        claude plugins install ~/.claude/plugins/oh-my-claude

      快速开始:
        /yishan 或 /愚公  - 愚公移山模式
        /zhuge 或 /诸葛   - 诸葛顾问

      更多信息: https://github.com/ZDragon17/oh-my-claude
    EOS
  end

  test do
    assert_predicate prefix/"agents/yugong.md", :exist?
    assert_predicate prefix/"commands/yishan.md", :exist?
  end
end
