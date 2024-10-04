export function generateBoard(): number[][] {
  const board: number[][] = [];
  const size = 8;

  for (let row = 0; row < size; row++) {
    const currentRow: number[] = [];
    for (let col = 0; col < size; col++) {
      currentRow.push(generateRandomNonZero());
    }
    board.push(currentRow);
  }

  return board;
}

function generateRandomNonZero(): number {
  let num = 0;
  while (num === 0) {
    num = Math.floor(Math.random() * 17) - 8; // Generates numbers from -8 to 8
  }
  return num;
}
