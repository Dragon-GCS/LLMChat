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
          <v-card-title>图像生成</v-card-title>
          <v-card-text>
            <v-textarea
              v-model="prompt"
              label="描述你想要生成的图像"
              rows="5"
              counter
              :disabled="isProcessing"
            ></v-textarea>
            
            <v-select
              v-model="size"
              :items="sizeOptions"
              label="图像尺寸"
              :disabled="isProcessing"
            ></v-select>
            
            <v-select
              v-model="quality"
              :items="qualityOptions"
              label="图像质量"
              :disabled="isProcessing"
            ></v-select>
            
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
              @click="generateImage"
              :loading="isProcessing"
              :disabled="!prompt.trim()"
            >
              生成图像
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>生成结果</v-card-title>
          <v-card-text class="text-center">
            <div v-if="imageUrl" class="image-result">
              <img :src="imageUrl" alt="生成的图像" class="generated-image" />
              <div class="image-actions mt-4">
                <v-btn color="primary" @click="downloadImage">
                  <v-icon left>mdi-download</v-icon>
                  下载图像
                </v-btn>
              </div>
            </div>
            <div v-else-if="isProcessing" class="image-placeholder">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-4">正在生成图像，请稍候...</p>
            </div>
            <div v-else class="image-placeholder">
              <v-icon size="64" color="grey lighten-1">mdi-image-outline</v-icon>
              <p class="mt-4">填写左侧表单并点击"生成图像"按钮</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProviderStore } from '@/stores/providerStore'
import { generateImage as generateImageApi, isProcessing } from '@/services/api'

// 状态
const prompt = ref('')
const imageUrl = ref('')
const size = ref('1024x1024')
const quality = ref('standard')

// 选项
const sizeOptions = [
  { title: '小 (256x256)', value: '256x256' },
  { title: '中 (512x512)', value: '512x512' },
  { title: '大 (1024x1024)', value: '1024x1024' }
]

const qualityOptions = [
  { title: '标准', value: 'standard' },
  { title: '高清', value: 'hd' }
]

// 获取提供商
const providerStore = useProviderStore()
const providers = computed(() => providerStore.providersByCapability.image)
const selectedProvider = computed({
  get: () => providerStore.activeProvider,
  // @ts-ignore
  set: (provider: any) => {
    if (provider) {
      providerStore.setActiveProvider(provider.id)
    }
  }
})

// 生成图像
async function generateImage() {
  if (!prompt.value.trim() || isProcessing.value) return
  
  try {
    imageUrl.value = ''
    
    const provider = selectedProvider.value
    if (!provider) throw new Error('未选择提供商')
    
    const params: ImageGenerationParams = {
      prompt: prompt.value,
      size: size.value as '256x256' | '512x512' | '1024x1024',
      quality: quality.value as 'standard' | 'hd'
    }
    
    // @ts-ignore
    const url = await generateImageApi(provider, params)
    imageUrl.value = url
  } catch (error) {
    console.error('图像生成失败:', error)
    alert(`生成失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 下载图像
async function downloadImage() {
  if (!imageUrl.value) return
  
  try {
    const response = await fetch(imageUrl.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `image-${Date.now()}.png`
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载图像失败:', error)
    alert('下载失败，请尝试右键图像并选择"保存图像"')
  }
}
</script>

<style scoped>
.image-result {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.generated-image {
  max-width: 100%;
  max-height: 500px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #757575;
}
</style>