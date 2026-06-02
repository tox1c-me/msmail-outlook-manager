# MSMail Outlook 邮箱管理系统

## GitHub 仓库简介

基于 Nuxt 4、Microsoft Graph 和 IMAP OAuth2 的本地 Outlook 邮箱管理工作台，支持 OAuth 弹窗登录、账号自动导入、邮件预览、备注标签、暗黑模式和 Windows 一键启动。

## 作品介绍

MSMail 是一个面向个人和小型团队的本地 Outlook 邮箱管理工具。系统支持通过 Microsoft OAuth 2.0 + PKCE 完成账号授权，并将多个邮箱集中展示在同一工作台中。用户可以快速查看最近来信、正文摘要、未读状态和附件状态，也可以通过备注和颜色标签区分不同邮箱的用途。

项目默认使用 SQLite 保存本地数据，适合在 Windows 单机环境中部署。仓库提供启动和停止脚本，双击即可启动服务并自动打开管理页面。

## 核心功能

- Microsoft OAuth 2.0 + PKCE 弹窗登录与账号自动导入
- Microsoft Graph 与 IMAP OAuth2 双协议收件
- 多账号集中管理、搜索、标签筛选和批量导出
- 邮件正文摘要、详情查看、未读状态与附件状态展示
- 邮箱备注与自定义备注字体颜色
- 浅色 / 暗黑主题切换与本地偏好记忆
- Windows 一键启动与停止脚本
- 带 `x-api-key` 鉴权的只读邮件查询接口

## 技术栈

`Nuxt 4`、`Vue 3`、`TypeScript`、`Nitro Server API`、`Prisma`、`SQLite`、`Microsoft Graph`、`IMAP OAuth2`、`Ant Design Vue`、`Zod`

## 简历项目经历

**MSMail Outlook 邮箱管理系统**

基于 Nuxt 4、TypeScript、Prisma 和 SQLite 开发本地 Outlook 多账号邮件管理工作台，接入 Microsoft Graph 与 IMAP OAuth2，实现 OAuth 2.0 + PKCE 弹窗授权、账号自动导入、Token 刷新、最近邮件摘要展示和邮件详情读取。扩展邮箱备注、颜色标签、暗黑模式、本地一键启动脚本及带 API Key 鉴权的只读接口，提升多账号管理效率与本地部署体验。

## 发布前检查

- 不要提交 `.env`
- 不要提交 `prisma/dev.db` 或 `prisma/data/*.db`
- 不要提交真实邮箱、密码、`refresh_token` 或 `APP_API_KEY`
- 截图中仅使用演示账号和脱敏邮件内容
- 如果项目基于其他仓库继续开发，请在发布页中注明来源和二次开发内容
