<template>
  <v-container fluid class="chat-container">
    <!-- 导航栏 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-btn color="primary" prepend-icon="mdi-home" @click="$router.push('/')">
          返回主页
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row class="fill-height">
      <v-col cols="12" md="8" class="d-flex flex-column">
        <!-- 聊天消息区域 -->
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="message in messages" :key="message.id" class="message-container" :class="message.role">
            <div class="message-content">
              <div v-if="message.role === 'assistant'" class="message-header">
                <span class="model-name">{{ message.model }}</span>
                <span class="token-count" v-if="message.tokens">{{ message.tokens }} 令牌</span>
              </div>
              <div class="message-text" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input">
          <v-textarea
            v-model="userInput"
            outlined
            hide-details
            placeholder="输入消息..."
            rows="3"
            auto-grow
            @keydown.enter.prevent="sendMessage"
          ></v-textarea>
          <v-btn color="primary" @click="sendMessage" :loading="isProcessing" :disabled="!userInput.trim()">
            发送
          </v-btn>
        </div>
      </v-col>
      
      <v-col cols="12" md="4">
        <!-- 参数侧边栏 -->
        <v-card>
          <v-card-title>聊天设置</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedProvider"
              :items="providers"
              item-title="name"
              item-value="id"
              label="选择提供商"
              return-object
            ></v-select>
            
            <v-slider
              v-model="temperature"
              label="温度"
              min="0"
              max="1"
              step="0.1"
              thumb-label
            ></v-slider>
            
            <v-slider
              v-model="maxTokens"
              label="最大令牌数"
              min="100"
              max="4000"
              step="100"
              thumb-label
            ></v-slider>
            
            <v-btn-toggle v-model="exportFormat" mandatory>
              <v-btn value="json">JSON</v-btn>
              <v-btn value="md">Markdown</v-btn>
              <v-btn value="txt">文本</v-btn>
            </v-btn-toggle>
            
            <v-btn block class="mt-4" @click="exportChat">
              导出对话
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted } from 'vue'
// @ts-ignore
import { useProviderStore } from '@/stores/providerStore'
// @ts-ignore
import { chatCompletion, isProcessing } from '@/services/api'
// @ts-ignore
import { marked } from 'marked'

// 状态
const userInput = ref('')
const messages = ref<ChatMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const exportFormat = ref('md')

// 参数
const temperature = ref(0.7)
const maxTokens = ref(1000)

// 获取提供商
const providerStore = useProviderStore()
const providers = computed(() => providerStore.providersByCapability.chat)
const selectedProvider = computed({
  get: () => providerStore.activeProvider,
  // @ts-ignore
  set: (provider: any) => {
    if (provider) {
      providerStore.setActiveProvider(provider.id)
    }
  }
})

// 发送消息
async function sendMessage() {
  if (!userInput.value.trim() || isProcessing.value) return
  
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    content: userInput.value,
    role: 'user',
    timestamp: Date.now()
  }
  
  messages.value.push(userMessage)
  userInput.value = ''
  
  try {
    // 准备发送给API的消息历史
    const messageHistory = messages.value.slice(-10) // 最近10条消息作为上下文
    
    // 调用API
    const provider = selectedProvider.value
    if (!provider) throw new Error('未选择提供商')
    
    // 更新提供商参数
    const updatedProvider = {
      ...provider,
      temperature: temperature.value,
      maxTokens: maxTokens.value
    }
    
    const response = await chatCompletion(updatedProvider, messageHistory)
    messages.value.push(response)
    
    // 滚动到底部
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value.push({
      id: Date.now().toString(),
      content: `错误: ${error instanceof Error ? error.message : String(error)}`,
      role: 'assistant',
      timestamp: Date.now()
    })
  }
}

// 渲染Markdown
function renderMarkdown(text: string): string {
  return marked(text)
}

// 滚动到底部
function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 100)
}

// 导出对话
function exportChat() {
  let content = ''
  const filename = `chat-export-${new Date().toISOString().slice(0, 10)}`
  
  switch (exportFormat.value) {
    case 'json':
      content = JSON.stringify(messages.value, null, 2)
      downloadFile(`${filename}.json`, content, 'application/json')
      break
    case 'md':
      content = messages.value.map((msg: any) => {
        return `## ${msg.role === 'user' ? '用户' : '助手'} (${new Date(msg.timestamp).toLocaleString()})\n\n${msg.content}\n\n`
      }).join('---\n\n')
      downloadFile(`${filename}.md`, content, 'text/markdown')
      break
    case 'txt':
      content = messages.value.map((msg: any) => {
        return `${msg.role === 'user' ? '用户' : '助手'} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n\n`
      }).join('')
      downloadFile(`${filename}.txt`, content, 'text/plain')
      break
  }
}

// 下载文件
function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 初始化
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100vh - 200px);
}

.message-container {
  display: flex;
  margin-bottom: 1rem;
}

.message-container.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.user .message-content {
  background-color: #e3f2fd;
}

.assistant .message-content {
  background-color: #f5f5f5;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #eee;
}

.chat-input .v-textarea {
  flex: 1;
}
</style>