<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useProviderStore } from '@/stores/providerStore'
import { onMounted } from 'vue'

// 初始化存储
const providerStore = useProviderStore()
onMounted(() => {
  providerStore.initializeStore()
})
</script>

<style>
/* 全局样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>