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
  font-family: 'Exo 2', sans-serif;
  font-size: 32px; /* Doubled base font size */
  aspect-ratio: 1 / 1;
  user-select: none;
  min-height: 0;
  min-width: 0;
  overflow: hidden; /* Prevent content overflow */
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

/* Responsive font sizes - doubled from previous, max 40px */
@media (max-width: 480px) {
  .cell {
    font-size: 24px;
    border-width: 0.5px;
  }
  
  .cell.active {
    border-width: 2px;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .cell {
    font-size: 28px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .cell {
    font-size: 36px;
  }
}

@media (min-width: 1025px) {
  .cell {
    font-size: 40px; /* Max size as requested */
  }
}

/* Remove the 1440px media query since max is 40px */
</style>

