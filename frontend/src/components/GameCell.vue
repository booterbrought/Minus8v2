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

  const colorStops = [
    { value: -8, color: [0, 32, 124] },    // Darker blue
    { value: -3, color: [51, 83, 175] },   // Blue
    { value: -1, color: [102, 178, 255] },  // Light blue
    { value: 1, color: [255, 255, 102] },   // Light yellow
    { value: 3, color: [235, 158, 82] },   // Light orange
    { value: 8, color: [164, 0, 0] }        // Dark red
  ];

  const getInterpolatedColor = (value: number) => {
    if (value <= colorStops[0].value) return colorStops[0].color;
    if (value >= colorStops[colorStops.length - 1].value) return colorStops[colorStops.length - 1].color;

    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (value >= colorStops[i].value && value <= colorStops[i + 1].value) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    const range = upperStop.value - lowerStop.value;
    const valueInRange = value - lowerStop.value;
    const ratio = valueInRange / range;

    return lowerStop.color.map((c, i) => 
      Math.round(c + ratio * (upperStop.color[i] - c))
    );
  };

  const [r, g, b] = getInterpolatedColor(props.value);
  
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

