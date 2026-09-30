import styles from "./QrPlaceholder.module.css";

const SIZE = 25;

/* Patrón determinista para que el servidor y el cliente generen lo mismo. */
function cellOn(row, col, seed) {
  if (row < 8 && col < 8) return false;
  if (row < 8 && col >= SIZE - 8) return false;
  if (row >= SIZE - 8 && col < 8) return false;
  const value = (row * 31 + col * 17 + seed * 7) % 11;
  return value < 5;
}

function Finder({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="0" width="7" height="7" fill="currentColor" />
      <rect x="1" y="1" width="5" height="5" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" fill="currentColor" />
    </g>
  );
}

/* Marcador visual de QR. No codifica datos reales todavía. */
export default function QrPlaceholder({ seed = 1, label = "Código QR simulado" }) {
  const cells = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (cellOn(row, col, seed)) {
        cells.push(
          <rect key={`${row}-${col}`} x={col} y={row} width="1" height="1" />,
        );
      }
    }
  }

  return (
    <svg
      className={styles.qr}
      viewBox={`-1 -1 ${SIZE + 2} ${SIZE + 2}`}
      role="img"
      aria-label={label}
    >
      <rect
        x="-1"
        y="-1"
        width={SIZE + 2}
        height={SIZE + 2}
        fill="#fff"
      />
      <g fill="currentColor">{cells}</g>
      <Finder x={0} y={0} />
      <Finder x={SIZE - 7} y={0} />
      <Finder x={0} y={SIZE - 7} />
    </svg>
  );
}
