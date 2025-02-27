<template>
  <div class="security-settings">
    <v-alert
      type="info"
      class="mb-4"
    >
      安全设置可以帮助保护您的API密钥和其他敏感信息。
    </v-alert>
    
    <v-card class="mb-4">
      <v-card-title>会话安全</v-card-title>
      <v-card-text>
        <v-switch
          v-model="autoLock"
          label="自动锁定"
          @change="saveSettings"
        ></v-switch>
        
        <v-slider
          v-if="autoLock"
          v-model="lockTimeout"
          label="不活动超时时间（分钟）"
          min="1"
          max="60"
          step="1"
          thumb-label
          @change="saveSettings"
        ></v-slider>
        
        <v-switch
          v-model="publicComputerWarning"
          label="显示公共计算机警告"
          @change="saveSettings"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title>数据管理</v-card-title>
      <v-card-text>
        <v-btn
          color="error"
          class="mr-2"
          @click="confirmClearData"
        >
          清除所有数据
        </v-btn>
        
        <v-btn
          color="primary"
          @click="exportData"
        >
          导出设置
        </v-btn>
        
        <v-btn
          color="primary"
          class="ml-2"
          @click="showImportDialog = true"
        >
          导入设置
        </v-btn>
      </v-card-text>
    </v-card>
    
    <!-- 确认清除数据对话框 -->
    <v-dialog
      v-model="showClearDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title>
          确认清除数据
        </v-card-title>
        
        <v-card-text>
          此操作将清除所有存储的API密钥、提供商配置和设置。此操作无法撤销。
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showClearDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            @click="clearAllData"
          >
            清除所有数据
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 导入设置对话框 -->
    <v-dialog
      v-model="showImportDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          导入设置
        </v-card-title>
        
        <v-card-text>
          <v-textarea
            v-model="importData"
            label="粘贴导出的JSON数据"
            rows="10"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showImportDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="importSettings"
            :disabled="!importData.trim()"
          >
            导入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProviderStore } from '@/stores/providerStore'

// 状态
const autoLock = ref(false)
const lockTimeout = ref(15)
const publicComputerWarning = ref(true)
const showClearDialog = ref(false)
const showImportDialog = ref(false)
const importData = ref('')

// 获取提供商存储
const providerStore = useProviderStore()

// 初始化
onMounted(() => {
  // 从localStorage加载设置
  const securitySettings = localStorage.getItem('security-settings')
  if (securitySettings) {
    try {
      const settings = JSON.parse(securitySettings)
      autoLock.value = settings.autoLock || false
      lockTimeout.value = settings.lockTimeout || 15
      publicComputerWarning.value = settings.publicComputerWarning !== false
    } catch (e) {
      console.error('加载安全设置失败:', e)
    }
  }
})

// 保存设置
function saveSettings() {
  const settings = {
    autoLock: autoLock.value,
    lockTimeout: lockTimeout.value,
    publicComputerWarning: publicComputerWarning.value
  }
  
  localStorage.setItem('security-settings', JSON.stringify(settings))
}

// 确认清除数据
function confirmClearData() {
  showClearDialog.value = true
}

// 清除所有数据
function clearAllData() {
  localStorage.clear()
  showClearDialog.value = false
  alert('所有数据已清除。页面将刷新。')
  setTimeout(() => {
    window.location.reload()
  }, 1500)
}

// 导出设置
function exportData() {
  const exportObj = {
    providers: providerStore.exportProviders(),
    security: {
      autoLock: autoLock.value,
      lockTimeout: lockTimeout.value,
      publicComputerWarning: publicComputerWarning.value
    }
  }
  
  const dataStr = JSON.stringify(exportObj, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `llm-chat-settings-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

// 导入设置
function importSettings() {
  try {
    const data = JSON.parse(importData.value)
    
    if (data.providers && Array.isArray(data.providers)) {
      providerStore.importProviders(data.providers)
    }
    
    if (data.security) {
      autoLock.value = data.security.autoLock || false
      lockTimeout.value = data.security.lockTimeout || 15
      publicComputerWarning.value = data.security.publicComputerWarning !== false
      
      saveSettings()
    }
    
    showImportDialog.value = false
    alert('设置已导入')
  } catch (error) {
    console.error('导入设置失败:', error)
    alert('导入失败：无效的JSON数据')
  }
}
</script>