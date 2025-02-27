import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { encryptData, decryptData } from '../utils/crypto'

// 提供商存储的键名
const PROVIDERS_STORE_KEY = 'llm-chat-providers'
const ACTIVE_PROVIDER_KEY = 'llm-chat-active-provider'

// 默认提供商配置
const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai-default',
    name: 'OpenAI (默认)',
    baseURL: 'https://api.openai.com',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    capabilities: ['chat', 'image', 'tts'],
    voices: [
      { id: 'alloy', name: 'Alloy (中性)' },
      { id: 'echo', name: 'Echo (男声)' },
      { id: 'fable', name: 'Fable (女声)' },
      { id: 'onyx', name: 'Onyx (男声)' },
      { id: 'nova', name: 'Nova (女声)' }
    ]
  }
]

export const useProviderStore = defineStore('providers', () => {
  // 状态
  const providers = ref<LLMProvider[]>([])
  const activeProviderId = ref<string>('')
  const encryptionKey = ref<string>('')
  const isEncrypted = ref(false)
  
  // 计算属性
  const activeProvider = computed(() => 
    providers.value.find(p => p.id === activeProviderId.value) || providers.value[0]
  )
  
  const providersByCapability = computed(() => {
    const result: Record<string, LLMProvider[]> = {
      chat: [],
      image: [],
      tts: []
    }
    
    for (const provider of providers.value) {
      for (const capability of provider.capabilities) {
        result[capability].push(provider)
      }
    }
    
    return result
  })
  
  // 初始化存储
  async function initializeStore() {
    try {
      // 尝试从localStorage加载提供商列表
      const storedData = localStorage.getItem(PROVIDERS_STORE_KEY)
      
      if (storedData) {
        // 如果数据已加密，需要解密
        if (isEncrypted.value && encryptionKey.value) {
          const decrypted = await decryptData(storedData, encryptionKey.value)
          providers.value = JSON.parse(decrypted)
        } else {
          providers.value = JSON.parse(storedData)
        }
        
        console.log('从本地存储加载的提供商:', providers.value)
        
        // 确保所有提供商都有voices属性
        providers.value = providers.value.map(provider => {
          // 只有在没有任何音色的情况下才添加默认音色
          if (provider.capabilities.includes('tts') && (!provider.voices || provider.voices.length === 0)) {
            // 为支持TTS但没有voices属性或voices为空数组的提供商添加默认音色
            console.log('为提供商添加默认音色:', provider.name)
            return {
              ...provider,
              voices: [
                { id: 'alloy', name: 'Alloy (中性)' },
                { id: 'echo', name: 'Echo (男声)' },
                { id: 'fable', name: 'Fable (女声)' },
                { id: 'onyx', name: 'Onyx (男声)' },
                { id: 'nova', name: 'Nova (女声)' }
              ]
            }
          } else if (provider.voices && provider.voices.length > 0) {
            console.log('提供商已有音色:', provider.name, provider.voices)
          }
          return provider
        })
      } else {
        // 首次使用，设置默认提供商
        providers.value = DEFAULT_PROVIDERS
      }
      
      // 加载上次使用的活跃提供商
      const lastActiveId = localStorage.getItem(ACTIVE_PROVIDER_KEY)
      if (lastActiveId && providers.value.some(p => p.id === lastActiveId)) {
        activeProviderId.value = lastActiveId
      } else if (providers.value.length > 0) {
        activeProviderId.value = providers.value[0].id
      }
    } catch (error) {
      console.error('Failed to initialize provider store:', error)
      providers.value = DEFAULT_PROVIDERS
      activeProviderId.value = providers.value[0].id
    }
  }
  
  // 保存提供商列表
  async function saveProviders() {
    try {
      let dataToStore: string
      
      if (isEncrypted.value && encryptionKey.value) {
        dataToStore = await encryptData(JSON.stringify(providers.value), encryptionKey.value)
      } else {
        dataToStore = JSON.stringify(providers.value)
      }
      
      localStorage.setItem(PROVIDERS_STORE_KEY, dataToStore)
      localStorage.setItem(ACTIVE_PROVIDER_KEY, activeProviderId.value)
    } catch (error) {
      console.error('Failed to save providers:', error)
    }
  }
  
  // 添加新提供商
  function addProvider(provider: LLMProvider) {
    console.log('添加新提供商:', provider)
    
    // 确保ID唯一
    if (providers.value.some(p => p.id === provider.id)) {
      provider.id = `${provider.id}-${Date.now()}`
    }
    
    // 只有在没有任何音色的情况下才添加默认音色
    if (provider.capabilities.includes('tts') && (!provider.voices || provider.voices.length === 0)) {
      console.log('为新提供商添加默认音色:', provider.name)
      provider.voices = [
        { id: 'alloy', name: 'Alloy (中性)' },
        { id: 'echo', name: 'Echo (男声)' },
        { id: 'fable', name: 'Fable (女声)' },
        { id: 'onyx', name: 'Onyx (男声)' },
        { id: 'nova', name: 'Nova (女声)' }
      ]
    } else if (provider.voices && provider.voices.length > 0) {
      console.log('使用用户添加的音色:', provider.voices)
    }
    
    providers.value.push(provider)
    saveProviders()
  }
  
  // 更新提供商
  function updateProvider(id: string, updates: Partial<LLMProvider>) {
    const index = providers.value.findIndex(p => p.id === id)
    if (index !== -1) {
      console.log('更新前的提供商:', providers.value[index])
      console.log('更新内容:', updates)
      
      // 保存原始音色
      const originalVoices = providers.value[index].voices || []
      
      // 合并更新
      const updatedProvider = { ...providers.value[index], ...updates }
      
      // 如果更新内容中包含voices且不为空，使用更新内容中的voices
      if (updates.voices && updates.voices.length > 0) {
        console.log('使用更新内容中的音色:', updates.voices)
        updatedProvider.voices = updates.voices
      }
      // 如果原始提供商有voices且不为空，保留原始voices
      else if (originalVoices.length > 0) {
        console.log('保留原始音色:', originalVoices)
        updatedProvider.voices = originalVoices
      }
      // 只有在没有任何音色的情况下才添加默认音色
      else if (updatedProvider.capabilities.includes('tts')) {
        console.log('为更新的提供商添加默认音色:', updatedProvider.name)
        updatedProvider.voices = [
          { id: 'alloy', name: 'Alloy (中性)' },
          { id: 'echo', name: 'Echo (男声)' },
          { id: 'fable', name: 'Fable (女声)' },
          { id: 'onyx', name: 'Onyx (男声)' },
          { id: 'nova', name: 'Nova (女声)' }
        ]
      }
      
      console.log('更新后的提供商:', updatedProvider)
      providers.value[index] = updatedProvider
      saveProviders()
    }
  }
  
  // 删除提供商
  function removeProvider(id: string) {
    providers.value = providers.value.filter(p => p.id !== id)
    
    // 如果删除的是当前活跃的提供商，切换到第一个可用的提供商
    if (id === activeProviderId.value && providers.value.length > 0) {
      activeProviderId.value = providers.value[0].id
    }
    
    saveProviders()
  }
  
  // 设置活跃提供商
  function setActiveProvider(id: string) {
    if (providers.value.some(p => p.id === id)) {
      activeProviderId.value = id
      localStorage.setItem(ACTIVE_PROVIDER_KEY, id)
    }
  }
  
  // 设置加密
  function setEncryption(key: string, enable: boolean) {
    encryptionKey.value = key
    isEncrypted.value = enable
    saveProviders() // 重新保存以应用加密设置
  }
  
  // 导入提供商配置
  function importProviders(importedProviders: LLMProvider[]) {
    // 合并导入的提供商，避免ID冲突
    for (const provider of importedProviders) {
      if (providers.value.some(p => p.id === provider.id)) {
        provider.id = `${provider.id}-imported-${Date.now()}`
      }
      providers.value.push(provider)
    }
    
    saveProviders()
  }
  
  // 导出提供商配置
  function exportProviders(): LLMProvider[] {
    // 创建深拷贝以避免修改原始数据
    return JSON.parse(JSON.stringify(providers.value))
  }
  
  return {
    providers,
    activeProviderId,
    activeProvider,
    providersByCapability,
    isEncrypted,
    initializeStore,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    setEncryption,
    importProviders,
    exportProviders
  }
})