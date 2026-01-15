---
name: zhenghe
description: 召唤郑和 API 远航家
aliases:
  - xiyang
  - api
  - integrate
  - 郑和
  - 西洋
  - 接口
---

# /zhenghe 命令

召唤 **郑和 API 远航家** 处理 API 集成和外部服务对接任务。

## 使用方式

```bash
# 基础用法
/zhenghe <API 集成需求>

# 使用别名
/xiyang <需求>
/api <需求>
/integrate <需求>
/接口 <需求>
```

## 示例

```bash
# 集成第三方 API
/zhenghe 集成微信支付 API

# 设计 API 客户端
/api 为这个 OpenAPI 规范设计一个 TypeScript SDK

# 调试接口问题
/接口 这个 API 返回 401，帮我排查原因

# 数据对接
/integrate 对接 Stripe 支付网关
```

## 郑和的专长

1. **API 集成** - REST、GraphQL、WebSocket、gRPC
2. **SDK 封装** - 将 API 封装为易用的客户端库
3. **错误处理** - 重试、熔断、降级策略
4. **数据转换** - 格式转换、数据映射

## 触发关键词

在消息中包含以下关键词会自动提示使用郑和：

- API、接口、集成、对接
- integrate、webhook、sdk
- REST、GraphQL、gRPC
- 第三方、外部服务
