<template>
  <v-container>
    <!-- 导航栏 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-btn color="primary" prepend-icon="mdi-home" @click="$router.push('/')">
          返回主页
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>文本转语音</v-card-title>
          <v-card-text>
            <v-textarea
              v-model="text"
              label="输入要转换为语音的文本"
              rows="6"
              counter
              :disabled="isProcessing"
            ></v-textarea>
            
            <v-select
              v-model="voice"
              :items="voiceOptions"
              label="选择语音"
              :disabled="isProcessing"
            ></v-select>
            
            <v-slider
              v-model="speed"
              label="语速"
              min="0.5"
              max="2.0"
              step="0.1"
              thumb-label
              :disabled="isProcessing"
            ></v-slider>
            
            <v-slider
              v-model="pitch"
              label="音调"
              min="0.5"
              max="2.0"
              step="0.1"
              thumb-label
              :disabled="isProcessing"
            ></v-slider>
            
            <v-select
              v-model="selectedProvider"
              :items="providers"
              item-title="name"
              item-value="id"
              label="选择提供商"
              return-object
              :disabled="isProcessing"
            ></v-select>
            
            <v-btn
              block
              color="primary"
              @click="convertToSpeech"
              :loading="isProcessing"
              :disabled="!text.trim()"
            >
              转换为语音
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>语音播放</v-card-title>
          <v-card-text class="text-center">
            <div v-if="audioBuffer" class="audio-result">
              <audio ref="audioPlayer" controls class="audio-player" style="width: 100%;"></audio>
              <div class="audio-actions mt-4">
                <v-btn color="primary" @click="downloadAudio">
                  <v-icon left>mdi-download</v-icon>
                  下载音频
                </v-btn>
              </div>
            </div>
            <div v-else-if="isProcessing" class="audio-placeholder">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-4">正在生成语音，请稍候...</p>
            </div>
            <div v-else class="audio-placeholder">
              <v-icon size="64" color="grey lighten-1">mdi-volume-high</v-icon>
              <p class="mt-4">填写左侧表单并点击"转换为语音"按钮</p>
            </div>
          </v-card-text>
        </v-card>
        
        <v-card class="mt-4">
          <v-card-title>历史记录</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(item, index) in history"
                :key="index"
                @click="loadFromHistory(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ truncateText(item.text, 30) }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(item.timestamp) }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, watch } from 'vue'
// @ts-ignore
import { useProviderStore } from '@/stores/providerStore'
// @ts-ignore
import { textToSpeech, isProcessing } from '@/services/api'

// 状态
const text = ref('')
const voice = ref('')
const speed = ref(1.0)
const pitch = ref(1.0)
const audioBuffer = ref<ArrayBuffer | null>(null)
const audioPlayer = ref<HTMLAudioElement | null>(null)
const history = ref<Array<{text: string, timestamp: number}>>([])

// 获取提供商
const providerStore = useProviderStore()
const providers = computed(() => providerStore.providersByCapability.tts)
const selectedProvider = computed({
  get: () => providerStore.activeProvider,
  // @ts-ignore
  set: (provider: any) => {
    if (provider) {
      providerStore.setActiveProvider(provider.id)
    }
  }
})

// 默认音色选项 - 当提供商没有定义音色时使用
const defaultVoiceOptions = [
  { title: 'Alloy (中性)', value: 'alloy' },
  { title: 'Echo (男声)', value: 'echo' },
  { title: 'Fable (女声)', value: 'fable' },
  { title: 'Onyx (男声)', value: 'onyx' },
  { title: 'Nova (女声)', value: 'nova' }
]

// 使用计算属性获取音色选项
const voiceOptions = computed(() => {
  // 调试信息
  console.log('当前提供商:', selectedProvider.value)
  console.log('提供商音色:', selectedProvider.value?.voices)
  
  // 如果提供商定义了音色，使用提供商的音色
  if (selectedProvider.value && selectedProvider.value.voices && selectedProvider.value.voices.length > 0) {
    console.log('使用提供商音色')
    return selectedProvider.value.voices.map(v => ({
      title: v.name,
      value: v.id
    }))
  }
  
  // 否则使用默认音色
  console.log('使用默认音色')
  return defaultVoiceOptions
})

// 当提供商变化时更新默认音色
watch(selectedProvider, (newProvider) => {
  if (newProvider && newProvider.voices && newProvider.voices.length > 0) {
    // 如果新提供商有音色，选择第一个
    voice.value = newProvider.voices[0].id
  } else {
    // 否则使用默认音色
    voice.value = 'alloy'
  }
}, { immediate: true })

// 转换为语音
async function convertToSpeech() {
  if (!text.value.trim() || isProcessing.value) return
  
  try {
    audioBuffer.value = null
    
    const provider = selectedProvider.value
    if (!provider) throw new Error('未选择提供商')
    
    const options: TTSOptions = {
      voice: voice.value,
      speed: speed.value,
      pitch: pitch.value
    }
    
    const buffer = await textToSpeech(provider, text.value, options)
    audioBuffer.value = buffer
    
    // 创建音频URL并播放
    console.log('创建音频Blob，buffer大小:', buffer.byteLength)
    
    // 尝试使用更通用的MIME类型
    const blob = new Blob([buffer], { type: 'audio/mp3' })
    const url = URL.createObjectURL(blob)
    console.log('创建的音频URL:', url)
    
    // 确保音频播放器已初始化
    console.log('播放前重新初始化音频播放器')
    initAudioPlayer()
    
    // 使用setTimeout确保有足够的时间初始化音频播放器
    setTimeout(() => {
      if (audioPlayer.value) {
        console.log('设置音频源并播放')
        
        // 添加事件监听器
        audioPlayer.value.onloadedmetadata = () => console.log('音频元数据已加载')
        audioPlayer.value.oncanplay = () => console.log('音频可以播放')
        audioPlayer.value.onplay = () => console.log('音频开始播放')
        audioPlayer.value.onerror = (e) => console.error('音频播放错误:', e)
        
        // 设置源并播放
        audioPlayer.value.src = url
        
        // 使用try-catch包装播放操作
        try {
          const playPromise = audioPlayer.value.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('音频播放成功'))
              .catch(err => {
                console.error('音频播放失败:', err)
                // 如果自动播放失败，提示用户手动播放
                alert('自动播放失败，请点击播放按钮手动播放')
              })
          }
        } catch (playError) {
          console.error('播放音频时出错:', playError)
        }
      } else {
        console.error('音频播放器元素未找到，尝试直接创建')
        
        // 如果仍然找不到音频播放器，尝试直接创建一个
        const audioElement = document.createElement('audio')
        audioElement.controls = true
        audioElement.src = url
        audioElement.className = 'audio-player'
        
        // 找到音频结果容器并添加音频元素
        const audioResult = document.querySelector('.audio-result')
        if (audioResult) {
          // 清空现有内容
          audioResult.innerHTML = ''
          // 添加新的音频元素
          audioResult.appendChild(audioElement)
          console.log('已创建新的音频元素:', audioElement)
          
          // 尝试播放
          try {
            const playPromise = audioElement.play()
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log('新创建的音频播放成功'))
                .catch(err => {
                  console.error('新创建的音频播放失败:', err)
                  alert('自动播放失败，请点击播放按钮手动播放')
                })
            }
          } catch (playError) {
            console.error('播放新创建的音频时出错:', playError)
          }
        } else {
          console.error('找不到音频结果容器')
        }
      }
    }, 1000)
    
    // 添加到历史记录
    history.value.unshift({
      text: text.value,
      timestamp: Date.now()
    })
    
    // 限制历史记录数量
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  } catch (error) {
    console.error('语音生成失败:', error)
    alert(`生成失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 下载音频
function downloadAudio() {
  if (!audioBuffer.value) return
  
  console.log('下载音频，buffer大小:', audioBuffer.value.byteLength)
  
  // 使用与播放相同的MIME类型
  const blob = new Blob([audioBuffer.value], { type: 'audio/mp3' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `speech-${Date.now()}.mp3`
  a.click()
  
  URL.revokeObjectURL(url)
}

// 从历史记录加载
function loadFromHistory(item: {text: string, timestamp: number}) {
  text.value = item.text
}

// 辅助函数
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

// 初始化音频播放器
function initAudioPlayer() {
  console.log('尝试初始化音频播放器')
  // 使用setTimeout确保DOM已完全渲染
  setTimeout(() => {
    audioPlayer.value = document.querySelector('.audio-player')
    console.log('音频播放器元素 (setTimeout):', audioPlayer.value)
    
    if (!audioPlayer.value) {
      console.warn('无法通过类选择器找到音频播放器，尝试其他方法')
      // 尝试获取所有audio元素
      const audioElements = document.querySelectorAll('audio')
      console.log('页面中的audio元素数量:', audioElements.length)
      if (audioElements.length > 0) {
        audioPlayer.value = audioElements[0]
        console.log('使用第一个audio元素:', audioPlayer.value)
      }
    }
  }, 500)
}

// 初始化
onMounted(() => {
  // 确保audioPlayer引用已初始化
  initAudioPlayer()
  
  // 从localStorage加载历史记录
  const savedHistory = localStorage.getItem('tts-history')
  if (savedHistory) {
    try {
      history.value = JSON.parse(savedHistory)
    } catch (e) {
      console.error('加载历史记录失败:', e)
    }
  }
})

// 监听audioBuffer变化，当有新的音频时重新初始化播放器
watch(audioBuffer, (newBuffer) => {
  if (newBuffer) {
    console.log('检测到新的音频缓冲区，重新初始化播放器')
    initAudioPlayer()
  }
})
</script>

<style scoped>
.audio-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.audio-player {
  width: 100%;
}

.audio-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #757575;
}
</style>