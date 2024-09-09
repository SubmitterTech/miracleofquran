const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويء';

const colors = [
  '#64748b', '#e11d48', '#c026d3', '#ea580c', '#d97706',
  '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#22d3ee',
  '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc',
  '#e879f9', '#c084fc', '#e879f9', '#f472b6', '#fb7185',
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#a855f7'
];

const colorMap = {};
for (let i = 0; i < arabicLetters.length; i++) {
  let letter = arabicLetters[i];

  // Normalize 'ء' to 'ا'
  if (letter === 'ء') {
    letter = 'ا';
  }

  colorMap[letter] = colors[i % colors.length];
}

export default colorMap;
