/**
 * 版本号同步脚本
 * 自动将 package.json 的版本号同步到 .claude-plugin/plugin.json
 * 在 prepublishOnly 钩子中调用，确保发布前版本一致
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pluginJsonPath = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');

try {
  // 读取 package.json 版本
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  // 读取并更新 plugin.json
  const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));

  if (pluginJson.version !== version) {
    pluginJson.version = version;
    fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n', 'utf-8');
    console.log(`✅ 版本同步完成: plugin.json → ${version}`);
  } else {
    console.log(`✓ 版本已同步: ${version}`);
  }
} catch (error) {
  console.error('❌ 版本同步失败:', error.message);
  process.exit(1);
}
