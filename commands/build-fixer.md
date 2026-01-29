# 构建修复师命令 - 构建问题修复

> 🌊 禹抑洪水，三过家门而不入

召唤大禹解决构建错误、依赖问题和 CI/CD 故障。

## 命令格式

```bash
# 中文命令
/dayu 修复这个构建错误

# 英文命令
/build-fixer fix this build error

# 简写
/fix-build npm install 失败了
```

## 使用场景

```bash
# 编译错误
/build-fixer TypeScript 编译报错了

# 依赖问题
/build-fixer npm install 有依赖冲突

# CI 失败
/build-fixer GitHub Actions 构建失败

# 环境问题
/build-fixer 本地能构建但 CI 失败

# 配置问题
/build-fixer webpack 配置报错
```

## 专长领域

| 领域 | 能力 |
|------|------|
| 编译错误 | TypeScript、Webpack、Babel |
| 依赖问题 | npm、pnpm、yarn 依赖解决 |
| CI/CD | GitHub Actions、GitLab CI |
| 环境问题 | Node.js、Docker、环境变量 |
| 配置修复 | 构建配置、打包配置 |

## 常见问题速查

| 错误 | 快速修复 |
|------|----------|
| `MODULE_NOT_FOUND` | `npm install` |
| `ERESOLVE` | `npm install --legacy-peer-deps` |
| `TS2307` | 检查 tsconfig paths |
| 缓存问题 | `rm -rf node_modules && npm install` |

## 命令别名

- `/dayu` - 大禹（中文）
- `/build-fixer` - Build Fixer（英文）
- `/fix-build` - 修复构建（简写）
- `/build` - 构建

---

召唤大禹疏导构建问题。
