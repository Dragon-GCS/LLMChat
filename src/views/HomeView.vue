<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h5">
            LLM Chat Web
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="item in menuItems"
                :key="item.title"
                :to="item.route"
                link
              >
                <v-list-item-icon>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-icon>
                
                <v-list-item-content>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
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
const menuItems = [
  {
    title: '文本聊天',
    subtitle: '与AI进行对话',
    icon: 'mdi-chat',
    route: '/chat'
  },
  {
    title: '图像生成',
    subtitle: '根据文本生成图像',
    icon: 'mdi-image',
    route: '/image'
  },
  {
    title: '语音合成',
    subtitle: '将文本转换为语音',
    icon: 'mdi-volume-high',
    route: '/tts'
  },
  {
    title: '设置',
    subtitle: '管理API提供商和偏好',
    icon: 'mdi-cog',
    route: '/settings'
  }
]
</script>

<style scoped>
.v-card {
  margin-top: 2rem;
}
</style>