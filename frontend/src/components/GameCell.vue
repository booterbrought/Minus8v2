<template>
  <div
    class="cell"
    :class="{
      eaten,
      active,
      dimmed,
      last
    }"
    :style="cellStyle"
    @click="$emit('cell-click')"
  >
    {{ value !== null ? value : '' }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { interpolateColor } from '../utils/colorInterpolation';

const props = defineProps<{
  value: number
  row: number
  col: number
  eaten: boolean
  active: boolean
  dimmed: boolean
  last: boolean
}>();

defineEmits<{
  'cell-click': []
}>();

const cellStyle = computed(() => {
  if (props.value === 0) return { backgroundColor: '#3a3a3a', color: '#e0e0e0' };
  const [r, g, b] = interpolateColor(props.value);
  
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: 'white',
  };
});
</script>

<style scoped>
.cell {
  @apply text-shadow-sm shadow-black border border-gray-600 flex items-center justify-center cursor-pointer font-bold transition-all duration-300 rounded-md;
  font-size: 1.6rem;
  aspect-ratio: 1 / 1;
  user-select: none;
}

.cell:hover {
  @apply opacity-80;
}

.cell.eaten:not(.last) {
  @apply bg-transparent border-none opacity-0 cursor-default;
}

.cell.eaten.last {
  @apply opacity-10;
}

.cell.active {
  @apply border-2 border-yellow-500;
}

.cell.dimmed {
  @apply opacity-70 pointer-events-none;
}
</style>

