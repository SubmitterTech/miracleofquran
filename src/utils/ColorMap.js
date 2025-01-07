const arabicLetters = 'اءبتثجحخدذرزسشصضطظعغفقكلمنهوئي';

const colors = [
  '#ef4444', //elif
  '#f97316', //hemze
  '#a3a3a3', //be
  '#a3a3a3', //te
  '#a3a3a3', //se
  '#a3a3a3', //cim
  '#f59e0b', //ha
  '#a3a3a3', //hı
  '#a3a3a3', //dal
  '#a3a3a3', //zel
  '#eab308', //ra
  '#a3a3a3', //ze
  '#f43f5e', //sin
  '#a3a3a3', //şın
  '#22c55e', //sad
  '#a3a3a3', //dad
  '#10b981', //tı
  '#a3a3a3', //zı
  '#06b6d4', //ayn
  '#a3a3a3', //gayn
  '#a3a3a3', //fe
  '#0ea5e9', //gaf
  '#3b82f6', //kef
  '#6366f1', //lam
  '#d946ef', //mim
  '#a855f7', //nun
  '#8b5cf6', //he
  '#a3a3a3', //vav
  '#14b8a6', //ye(gizli)
  '#84cc16', //ye 
  '#a855f7' //???
];

const colorMap = {};
for (let i = 0; i < arabicLetters.length; i++) {
  let letter = arabicLetters[i];

  colorMap[letter] = colors[i % colors.length];
}

export default colorMap;
