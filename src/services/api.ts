import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ref } from 'vue'

export const activeProvider = ref<LLMProvider | null>(null)
export const isProcessing = ref(false)
export const lastError = ref<string | null>(null)

// 创建API客户端实例
export function createApiClient(provider: LLMProvider): AxiosInstance {
  const config: AxiosRequestConfig = {
    baseURL: provider.baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    timeout: 60000 // 60秒超时
  }
  
  return axios.create(config)
}

// 文本聊天API调用
export async function chatCompletion(
  provider: LLMProvider, 
  messages: ChatMessage[]
): Promise<ChatMessage> {
  isProcessing.value = true
  lastError.value = null
  
  try {
    activeProvider.value = provider
    const client = createApiClient(provider)
    
    const response = await client.post('/v1/chat/completions', {
      model: provider.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: provider.temperature,
      max_tokens: provider.maxTokens
    })
    
    const result = response.data.choices[0].message
    const usage = response.data.usage
    
    return {
      id: Date.now().toString(),
      content: result.content,
      role: 'assistant',
      timestamp: Date.now(),
      model: provider.model,
      tokens: usage.completion_tokens
    }
  } catch (error) {
    console.error('Chat API error:', error)
    if (axios.isAxiosError(error)) {
      lastError.value = error.response?.data?.error?.message || error.message
    } else {
      lastError.value = String(error)
    }
    throw error
  } finally {
    isProcessing.value = false
  }
}

// 图像生成API调用
export async function generateImage(
  provider: LLMProvider,
  params: ImageGenerationParams
): Promise<string> {
  isProcessing.value = true
  lastError.value = null
  
  try {
    activeProvider.value = provider
    const client = createApiClient(provider)
    
    const response = await client.post('/v1/images/generations', {
      prompt: params.prompt,
      size: params.size,
      quality: params.quality,
      n: 1
    })
    
    return response.data.data[0].url
  } catch (error) {
    console.error('Image API error:', error)
    if (axios.isAxiosError(error)) {
      lastError.value = error.response?.data?.error?.message || error.message
    } else {
      lastError.value = String(error)
    }
    throw error
  } finally {
    isProcessing.value = false
  }
}

// 文本到语音API调用
export async function textToSpeech(
  provider: LLMProvider,
  text: string,
  options: TTSOptions
): Promise<ArrayBuffer> {
  isProcessing.value = true
  lastError.value = null
  
  try {
    activeProvider.value = provider
    const client = createApiClient(provider)
    
    console.log('TTS请求参数:', {
      model: provider.model, // 使用提供商中设置的模型
      input: text,
      voice: options.voice,
      speed: options.speed,
      pitch: options.pitch
    })
    
    // 创建一个新的客户端实例，专门用于音频请求
    const audioClient = axios.create({
      baseURL: provider.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'Accept': 'audio/mpeg' // 明确指定接受MP3格式
      },
      timeout: 60000 // 60秒超时
    })
    
    const response = await audioClient.post('/v1/audio/speech', {
      model: provider.model, // 使用提供商中设置的模型
      input: text,
      voice: options.voice,
      speed: options.speed,
      pitch: options.pitch
    }, {
      responseType: 'arraybuffer'
    })
    
    console.log('TTS响应状态:', response.status)
    console.log('TTS响应头:', response.headers)
    
    return response.data
  } catch (error) {
    console.error('TTS API error:', error)
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        try {
          const decoder = new TextDecoder()
          const errorData = JSON.parse(decoder.decode(error.response.data))
          lastError.value = errorData.error?.message || error.message
        } catch (parseError) {
          lastError.value = `API错误: ${error.message}`
        }
      } else {
        lastError.value = error.message
      }
    } else {
      lastError.value = String(error)
    }
    throw error
  } finally {
    isProcessing.value = false
  }
}

// 计算令牌成本（CNY）
export function calculateCost(provider: LLMProvider, tokens: number): number {
  // 简化的成本计算，实际应用中应根据不同模型和提供商调整价格
  const pricePerToken = 0.0002 // 假设每1000个令牌0.2元人民币
  return (tokens / 1000) * pricePerToken
}

// 错误处理和故障转移
export async function withFallback<T>(
  primaryProvider: LLMProvider,
  fallbackProviders: LLMProvider[],
  operation: (provider: LLMProvider) => Promise<T>
): Promise<T> {
  try {
    return await operation(primaryProvider)
  } catch (error) {
    console.warn('Primary provider failed, trying fallbacks')
    
    for (const provider of fallbackProviders) {
      try {
        return await operation(provider)
      } catch (fallbackError) {
        console.warn(`Fallback provider ${provider.name} failed`)
      }
    }
    
    throw new Error('All providers failed')
  }
}