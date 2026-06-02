import { fileURLToPath } from 'node:url'

const dayjsEsmRoot = fileURLToPath(new URL('./node_modules/dayjs/esm/', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-03-20',
  devtools: {
    enabled: true,
  },
  css: ['ant-design-vue/dist/reset.css', '~/assets/css/main.css'],
  build: {
    transpile: ['ant-design-vue'],
  },
  vite: {
    resolve: {
      alias: [
        {
          find: /^dayjs$/,
          replacement: `${dayjsEsmRoot}index.js`,
        },
        {
          find: /^dayjs\/plugin\/(.*)$/,
          replacement: `${dayjsEsmRoot}plugin/$1/index.js`,
        },
        {
          find: /^dayjs\/locale\/(.*)$/,
          replacement: `${dayjsEsmRoot}locale/$1.js`,
        },
      ],
    },
  },
  runtimeConfig: {
    appApiKey: process.env.APP_API_KEY,
    msTokenEndpoint:
      process.env.MS_TOKEN_ENDPOINT ??
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    msAuthorizeEndpoint:
      process.env.MS_AUTHORIZE_ENDPOINT ??
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    msClientId: process.env.MS_CLIENT_ID ?? '',
    msRedirectUri:
      process.env.MS_REDIRECT_URI ??
      'http://localhost:3000/api/oauth/microsoft/callback',
    msGraphScope: process.env.MS_GRAPH_SCOPE ?? 'offline_access Mail.Read',
    msImapScope:
      process.env.MS_IMAP_SCOPE ??
      'https://outlook.office.com/IMAP.AccessAsUser.All offline_access',
    msImapHost: process.env.MS_IMAP_HOST ?? 'outlook.office365.com',
    msImapPort: Number(process.env.MS_IMAP_PORT ?? '993'),
    public: {
      appName: '微软邮箱管理系统',
    },
  },
  nitro: {
    routeRules: {
      '/api/**': {
        cors: true,
      },
    },
  },
})
