<script setup lang="ts">
import DeploymentSettings from './components/deployment-settings.vue'
import LinkSharingSettings from './components/link-sharing-settings.vue'
import UploadProcessingSettings from './components/upload-processing-settings.vue'
</script>

<template>
  <div class="settings-page-container">
    <UploadProcessingSettings />
    <LinkSharingSettings />
    <DeploymentSettings />
  </div>
</template>

<style lang="stylus">
@import "picx-settings.styl"
</style>
