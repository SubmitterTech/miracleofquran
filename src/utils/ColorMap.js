const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويء';

const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5',  // Red, Green, Blue, Pink, Cyan
  '#FFC300', '#FF5733', '#C70039', '#900C3F', '#FF57F5',  // Bright Yellow, Red, Maroon, Purple, Bright Pink
  '#FF33F5', '#33FF57', '#33CFFF', '#FF3357', '#57FF33',  // Violet, Green, Light Blue, Salmon, Lime
  '#FF9900', '#50E3C2', '#FF5733', '#FF5733', '#FF6633',  // Orange, Teal, Bright Red, Red-Orange
  '#FF0000', '#00FF00', '#00FFFF', '#FFFF00', '#FF00FF',  // Bright Red, Green, Cyan, Yellow, Magenta
  '#FF6699', '#FF99CC', '#FF3366', '#FF6633', '#FFCC00'   // Bright Pink, Light Pink, Deep Pink, Red-Orange, Gold
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
