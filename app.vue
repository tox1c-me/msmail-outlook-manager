<script setup lang="ts">
import { theme as antTheme } from 'ant-design-vue'

const route = useRoute()
const isMailboxPage = computed(() => route.path.startsWith('/account/'))
type ColorMode = 'auto' | 'light' | 'dark'

const colorMode = ref<ColorMode>('auto')
const systemPrefersDark = ref(false)
const activeColorMode = computed<'light' | 'dark'>(() => {
  if (colorMode.value === 'auto') {
    return systemPrefersDark.value ? 'dark' : 'light'
  }

  return colorMode.value
})
const isDarkMode = computed(() => activeColorMode.value === 'dark')
const colorModeTitle = computed(() => {
  if (colorMode.value === 'auto') {
    return `跟随系统：当前${isDarkMode.value ? '暗黑' : '浅色'}`
  }

  return isDarkMode.value ? '暗黑模式' : '浅色模式'
})
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
  colorMode.value = isColorMode(savedMode) ? savedMode : 'auto'

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mediaQuery.matches
  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    systemPrefersDark.value = event.matches
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)

  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })
})

watch(
  [colorMode, activeColorMode],
  ([mode, activeMode]) => {
    if (!import.meta.client) {
      return
    }

    document.documentElement.dataset.theme = activeMode
    document.documentElement.dataset.themeMode = mode
    window.localStorage.setItem('msmail-color-mode', mode)
  },
  {
    immediate: true,
  },
)

function toggleColorMode() {
  if (colorMode.value === 'auto') {
    colorMode.value = 'light'
    return
  }

  if (colorMode.value === 'light') {
    colorMode.value = 'dark'
    return
  }

  colorMode.value = 'auto'
}

function isColorMode(value: string | null): value is ColorMode {
  return value === 'auto' || value === 'light' || value === 'dark'
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
        :class="[
          'theme-toggle',
          {
            'theme-toggle--dark': isDarkMode,
            'theme-toggle--auto': colorMode === 'auto',
          },
        ]"
        :aria-pressed="isDarkMode"
        :aria-label="`当前${colorModeTitle}，点击切换主题模式`"
        :title="`当前${colorModeTitle}，点击切换：跟随系统 / 浅色 / 暗黑`"
        @click="toggleColorMode"
      >
        <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☀</span>
        <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
        <span class="theme-toggle__thumb" aria-hidden="true" />
        <span class="theme-toggle__auto-mark" aria-hidden="true">A</span>
      </button>
    </ALayout>
  </AConfigProvider>
</template>
