<template>
  <div class="preference-settings">
    <v-card class="mb-4">
      <v-card-title>界面设置</v-card-title>
      <v-card-text>
        <v-switch
          v-model="darkMode"
          label="深色模式"
          @change="saveSettings"
        ></v-switch>
        
        <v-select
          v-model="fontSize"
          :items="fontSizeOptions"
          label="字体大小"
          @update:model-value="saveSettings"
        ></v-select>
        
        <v-select
          v-model="language"
          :items="languageOptions"
          label="界面语言"
          @update:model-value="saveSettings"
        ></v-select>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-4">
      <v-card-title>聊天设置</v-card-title>
      <v-card-text>
        <v-switch
          v-model="autoScroll"
          label="自动滚动到最新消息"
          @change="saveSettings"
        ></v-switch>
        
        <v-switch
          v-model="sendOnEnter"
          label="按Enter键发送消息"
          @change="saveSettings"
        ></v-switch>
        
        <v-slider
          v-model="maxMessages"
          label="最大显示消息数"
          min="10"
          max="100"
          step="10"
          thumb-label
          @change="saveSettings"
        ></v-slider>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title>令牌监控</v-card-title>
      <v-card-text>
        <v-switch
          v-model="showTokenCount"
          label="显示令牌计数"
          @change="saveSettings"
        ></v-switch>
        
        <v-switch
          v-model="showCostEstimate"
          label="显示成本估算"
          @change="saveSettings"
        ></v-switch>
        
        <v-text-field
          v-if="showCostEstimate"
          v-model="tokenCostRate"
          label="每千令牌成本（CNY）"
          type="number"
          step="0.01"
          min="0"
          @change="saveSettings"
        ></v-text-field>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 状态
const darkMode = ref(false)
const fontSize = ref('medium')
const language = ref('zh-CN')
const autoScroll = ref(true)
const sendOnEnter = ref(true)
const maxMessages = ref(50)
const showTokenCount = ref(true)
const showCostEstimate = ref(true)
const tokenCostRate = ref(0.2) // 每千令牌0.2元人民币

// 选项
const fontSizeOptions = [
  { title: '小', value: 'small' },
  { title: '中', value: 'medium' },
  { title: '大', value: 'large' }
]

const languageOptions = [
  { title: '简体中文', value: 'zh-CN' },
  { title: '英文', value: 'en-US' }
]

// 初始化
onMounted(() => {
  // 从localStorage加载设置
  const preferenceSettings = localStorage.getItem('preference-settings')
  if (preferenceSettings) {
    try {
      const settings = JSON.parse(preferenceSettings)
      darkMode.value = settings.darkMode || false
      fontSize.value = settings.fontSize || 'medium'
      language.value = settings.language || 'zh-CN'
      autoScroll.value = settings.autoScroll !== false
      sendOnEnter.value = settings.sendOnEnter !== false
      maxMessages.value = settings.maxMessages || 50
      showTokenCount.value = settings.showTokenCount !== false
      showCostEstimate.value = settings.showCostEstimate !== false
      tokenCostRate.value = settings.tokenCostRate || 0.2
    } catch (e) {
      console.error('加载偏好设置失败:', e)
    }
  }
})

// 保存设置
function saveSettings() {
  const settings = {
    darkMode: darkMode.value,
    fontSize: fontSize.value,
    language: language.value,
    autoScroll: autoScroll.value,
    sendOnEnter: sendOnEnter.value,
    maxMessages: maxMessages.value,
    showTokenCount: showTokenCount.value,
    showCostEstimate: showCostEstimate.value,
    tokenCostRate: tokenCostRate.value
  }
  
  localStorage.setItem('preference-settings', JSON.stringify(settings))
  
  // 触发主题变更事件
  document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : 'light')
  document.documentElement.style.fontSize = getFontSizeValue(fontSize.value)
}

// 获取字体大小值
function getFontSizeValue(size: string): string {
  switch (size) {
    case 'small': return '14px'
    case 'large': return '18px'
    default: return '16px'
  }
}
</script>