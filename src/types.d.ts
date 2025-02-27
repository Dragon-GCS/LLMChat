declare interface Voice {
  id: string
  name: string
}

declare interface LLMProvider {
  id: string
  name: string
  baseURL: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  capabilities: ('chat' | 'image' | 'tts')[]
  voices?: Voice[]
}

declare interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  model?: string
  tokens?: number
}

declare interface ImageGenerationParams {
  prompt: string
  size: '256x256' | '512x512' | '1024x1024'
  quality: 'standard' | 'hd'
}

declare interface TTSOptions {
  speed: number
  pitch: number
  voice: string
}