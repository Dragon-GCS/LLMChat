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
      <v-col cols="12">
        <h1 class="text-h4 mb-4">应用设置</h1>

        <v-tabs v-model="tab">
          <v-tab value="providers">API提供商</v-tab>
          <v-tab value="security">安全设置</v-tab>
          <v-tab value="preferences">偏好设置</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="providers">
            <provider-manager />
          </v-window-item>

          <v-window-item value="security">
            <security-settings />
          </v-window-item>

          <v-window-item value="preferences">
            <preference-settings />
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ProviderManager from "../components/settings/ProviderManager.vue";
import SecuritySettings from "../components/settings/SecuritySettings.vue";
import PreferenceSettings from "../components/settings/PreferenceSettings.vue";

// 在setup script中直接定义的变量
const tab = ref("providers");
</script>
