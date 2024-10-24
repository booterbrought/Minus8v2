<template>
  <Suspense>
    <template #default>
      <router-view />
    </template>
    <template #fallback>
      <div class="loading">Loading...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { Suspense } from 'vue';
</script>

<style>
.loading {
  @apply text-center text-gray-200 text-xl mt-8;
}
</style>
