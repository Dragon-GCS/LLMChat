<template>
  <div class="provider-manager">
    <v-alert
      v-if="showSecurityWarning"
      type="warning"
      closable
      class="mb-4"
    >
      <strong>安全警告:</strong> API密钥将存储在您的浏览器中。请勿在公共计算机上使用此功能。
    </v-alert>
    
    <v-data-table
      :headers="headers"
      :items="providers"
      class="elevation-1 mb-4"
    >
      <template v-slot:item.capabilities="{ item }">
        <v-chip
          v-for="cap in item.capabilities"
          :key="cap"
          class="mr-1"
          size="small"
        >
          {{ capabilityLabels[cap] }}
        </v-chip>
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          variant="text"
          size="small"
          @click="editProvider(item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        
        <v-btn
          icon
          variant="text"
          size="small"
          @click="confirmDelete(item)"
          :disabled="providers.length <= 1"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        
        <v-btn
          icon
          variant="text"
          size="small"
          @click="setActive(item)"
          :disabled="item.id === activeProviderId"
        >
          <v-icon>mdi-check-circle</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    
    <v-btn
      color="primary"
      @click="showAddDialog()"
    >
      添加提供商
    </v-btn>
    
    <!-- 添加/编辑对话框 -->
    <v-dialog
      v-model="showDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          {{ isEditing ? '编辑提供商' : '添加提供商' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveProvider">
            <v-text-field
              v-model="editedProvider.name"
              label="名称"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedProvider.baseURL"
              label="API基础URL"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedProvider.apiKey"
              label="API密钥"
              type="password"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedProvider.model"
              label="默认模型"
              required
            ></v-text-field>
            
            <v-slider
              v-model="editedProvider.temperature"
              label="默认温度"
              min="0"
              max="1"
              step="0.1"
              thumb-label
            ></v-slider>
            
            <v-slider
              v-model="editedProvider.maxTokens"
              label="默认最大令牌数"
              min="100"
              max="4000"
              step="100"
              thumb-label
            ></v-slider>
            
            <v-checkbox
              v-model="editedProvider.capabilities"
              label="文本聊天"
              value="chat"
            ></v-checkbox>
            
            <v-checkbox
              v-model="editedProvider.capabilities"
              label="图像生成"
              value="image"
            ></v-checkbox>
            
            <v-checkbox
              v-model="editedProvider.capabilities"
              label="文本到语音"
              value="tts"
            ></v-checkbox>
            
            <!-- 语音设置部分，仅当选择了TTS功能时显示 -->
            <div v-if="editedProvider.capabilities.includes('tts')">
              <v-divider class="my-4"></v-divider>
              <h3 class="text-subtitle-1 mb-2">语音设置</h3>
              
              <div class="d-flex align-center mb-2">
                <v-text-field
                  v-model="newVoiceName"
                  label="语音名称"
                  class="mr-2"
                ></v-text-field>
                <v-text-field
                  v-model="newVoiceId"
                  label="语音ID"
                  class="mr-2"
                ></v-text-field>
                <v-btn
                  icon
                  @click="addVoice"
                  :disabled="!newVoiceName || !newVoiceId"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
              
              <v-list>
                <v-list-item v-for="(voice, index) in editedProvider.voices" :key="index">
                  <v-list-item-title>{{ voice.name }} ({{ voice.id }})</v-list-item-title>
                  <template v-slot:append>
                    <v-btn icon size="small" @click="removeVoice(index)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="saveProvider"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title>
          确认删除
        </v-card-title>
        
        <v-card-text>
          您确定要删除提供商 "{{ providerToDelete?.name }}" 吗？此操作无法撤销。
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            @click="deleteProvider"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useProviderStore } from '@/stores/providerStore'

// 状态
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const showSecurityWarning = ref(true)
const providerToDelete = ref<LLMProvider | null>(null)
const newVoiceName = ref('')
const newVoiceId = ref('')

// 表格头部
const headers = [
  { title: '名称', key: 'name' },
  { title: '模型', key: 'model' },
  { title: '功能', key: 'capabilities' },
  { title: '操作', key: 'actions', sortable: false }
]

// 功能标签
const capabilityLabels = {
  chat: '聊天',
  image: '图像',
  tts: '语音'
}

// 编辑中的提供商
const editedProvider = reactive<LLMProvider>({
  id: '',
  name: '',
  baseURL: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 1000,
  capabilities: ['chat'],
  voices: []
})

// 获取提供商存储
const providerStore = useProviderStore()
const providers = computed(() => providerStore.providers)
const activeProviderId = computed(() => providerStore.activeProviderId)

// 添加提供商
function showAddDialog() {
  isEditing.value = false
  resetEditedProvider()
  showDialog.value = true
}

// 编辑提供商
function editProvider(provider: LLMProvider) {
  isEditing.value = true
  Object.assign(editedProvider, provider)
  showDialog.value = true
}

// 保存提供商
function saveProvider() {
  console.log('保存提供商，当前音色:', editedProvider.voices)
  
  // 只有在用户没有添加任何音色时才添加默认音色
  if (editedProvider.capabilities.includes('tts') && (!editedProvider.voices || editedProvider.voices.length === 0)) {
    console.log('用户没有添加音色，使用默认音色')
    // 如果用户没有添加任何音色，使用默认音色
    editedProvider.voices = [
      { id: 'alloy', name: 'Alloy (中性)' },
      { id: 'echo', name: 'Echo (男声)' },
      { id: 'fable', name: 'Fable (女声)' },
      { id: 'onyx', name: 'Onyx (男声)' },
      { id: 'nova', name: 'Nova (女声)' }
    ]
  }
  
  if (isEditing.value) {
    console.log('更新提供商:', editedProvider.id, '音色:', editedProvider.voices)
    providerStore.updateProvider(editedProvider.id, editedProvider)
  } else {
    // 生成唯一ID
    editedProvider.id = `provider-${Date.now()}`
    console.log('添加新提供商:', editedProvider.id, '音色:', editedProvider.voices)
    providerStore.addProvider({ ...editedProvider })
  }
  
  showDialog.value = false
}

// 确认删除
function confirmDelete(provider: LLMProvider) {
  providerToDelete.value = provider
  showDeleteDialog.value = true
}

// 删除提供商
function deleteProvider() {
  if (providerToDelete.value) {
    providerStore.removeProvider(providerToDelete.value.id)
    showDeleteDialog.value = false
    providerToDelete.value = null
  }
}

// 设置活跃提供商
function setActive(provider: LLMProvider) {
  providerStore.setActiveProvider(provider.id)
}

// 添加语音
function addVoice() {
  if (!newVoiceName.value || !newVoiceId.value) return
  
  if (!editedProvider.voices) {
    editedProvider.voices = []
  }
  
  editedProvider.voices.push({
    id: newVoiceId.value,
    name: newVoiceName.value
  })
  
  // 清空输入
  newVoiceName.value = ''
  newVoiceId.value = ''
}

// 删除语音
function removeVoice(index: number) {
  if (editedProvider.voices) {
    editedProvider.voices.splice(index, 1)
  }
}

// 重置编辑表单
function resetEditedProvider() {
  Object.assign(editedProvider, {
    id: '',
    name: '',
    baseURL: 'https://api.openai.com',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    capabilities: ['chat'],
    voices: []
  })
  
  // 清空语音输入
  newVoiceName.value = ''
  newVoiceId.value = ''
}
</script>