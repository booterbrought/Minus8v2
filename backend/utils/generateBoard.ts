export function generateBoard(): number[][] {
  return Array.from({ length: 8 }, () => 
    Array.from({ length: 8 }, () => generateRandomNonZero())
  );
}

function generateRandomNonZero(): number {
  let num = 0;
  while (num === 0) {
    num = Math.floor(Math.random() * 17) - 8; // Generates numbers from -8 to 8
  }
  return num;
}
