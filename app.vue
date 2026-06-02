<script setup lang="ts">
import { theme as antTheme } from 'ant-design-vue'

const route = useRoute()
const isMailboxPage = computed(() => route.path.startsWith('/account/'))
const colorMode = ref<'light' | 'dark'>('light')
const isDarkMode = computed(() => colorMode.value === 'dark')
const showHeader = computed(() => {
  if (route.path === '/') {
    return false
  }

  return !isMailboxPage.value
})

const pageLabel = computed(() => {
  if (route.path === '/') {
    return '账号管理'
  }

  if (route.path.includes('/message/')) {
    return '邮件详情'
  }

  if (route.path.startsWith('/account/')) {
    return '邮件列表'
  }

  return '工作台'
})

const themeConfig = computed(() => ({
  algorithm: isDarkMode.value ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 14,
    colorBgLayout: isDarkMode.value ? '#0f172a' : '#f3f6fb',
    colorTextBase: isDarkMode.value ? '#e5e7eb' : '#1f2937',
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  },
}))

onMounted(() => {
  const savedMode = window.localStorage.getItem('msmail-color-mode')
  colorMode.value = savedMode === 'dark' ? 'dark' : 'light'
})

watch(
  colorMode,
  (mode) => {
    if (!import.meta.client) {
      return
    }

    document.documentElement.dataset.theme = mode
    window.localStorage.setItem('msmail-color-mode', mode)
  },
  {
    immediate: true,
  },
)

function toggleColorMode() {
  colorMode.value = isDarkMode.value ? 'light' : 'dark'
}
</script>

<template>
  <AConfigProvider :theme="themeConfig">
    <ALayout :class="['app-layout', { 'app-layout--mailbox': isMailboxPage }]">
      <ALayoutHeader v-if="showHeader" class="app-header">
        <div class="app-header__inner">
          <NuxtLink to="/" class="app-brand">
            <span class="app-brand__mark">MS</span>
            <span class="app-brand__text">
              <strong>微软邮箱管理系统</strong>
              <small>前端工作台</small>
            </span>
          </NuxtLink>

          <ATag color="blue" class="app-header__tag">
            {{ pageLabel }}
          </ATag>
        </div>
      </ALayoutHeader>

      <ALayoutContent
        :class="[
          'app-content',
          {
            'app-content--no-header': !showHeader,
          },
        ]"
      >
        <div class="app-content__inner">
          <NuxtPage />
        </div>
      </ALayoutContent>

      <button
        type="button"
        :class="['theme-toggle', { 'theme-toggle--dark': isDarkMode }]"
        :aria-pressed="isDarkMode"
        :aria-label="isDarkMode ? '切换为浅色模式' : '切换为暗黑模式'"
        :title="isDarkMode ? '切换为浅色模式' : '切换为暗黑模式'"
        @click="toggleColorMode"
      >
        <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☀</span>
        <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
        <span class="theme-toggle__thumb" aria-hidden="true" />
      </button>
    </ALayout>
  </AConfigProvider>
</template>
