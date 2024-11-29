const colorStops = [
    { value: -8, color: [0, 32, 124] },    // Darker blue
    { value: -3, color: [51, 83, 175] },   // Blue
    { value: -1, color: [102, 178, 255] },  // Light blue
    { value: 1, color: [255, 255, 102] },   // Light yellow
    { value: 3, color: [235, 158, 82] },   // Light orange
    { value: 8, color: [164, 0, 0] }        // Dark red
  ];

export function interpolateColor(value: number): number[] {
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
}


