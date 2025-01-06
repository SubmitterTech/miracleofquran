const arabicLetters = 'اءبتثجحخدذرزسشصضطظعغفقكلمنهوئي';

const colors = [
  '#8b5cf6', //elif
  '#f97316', //hemze
  '#a3a3a3', //be
  '#a3a3a3', //te
  '#a3a3a3', //se
  '#a3a3a3', //cim
  '#84cc16', //ha
  '#a3a3a3', //hı
  '#a3a3a3', //dal
  '#a3a3a3', //zel
  '#2563eb', //ra
  '#a3a3a3', //ze
  '#eab308', //sin
  '#a3a3a3', //şın
  '#f59e0b', //sad
  '#a3a3a3', //dad
  '#8b5cf6', //tı
  '#a3a3a3', //zı
  '#06b6d4', //ayn
  '#a3a3a3', //gayn
  '#a3a3a3', //fe
  '#0ea5e9', //gaf
  '#65a30d', //kef
  '#22c55e', //lam
  '#f43f5e', //mim
  '#2dd4bf', //nun
  '#dc2626', //he
  '#a3a3a3', //vav
  '#d946ef', //ye(gizli)
  '#8b5cf6', //ye 
  '#a855f7' //???
];

const colorMap = {};
for (let i = 0; i < arabicLetters.length; i++) {
  let letter = arabicLetters[i];

  colorMap[letter] = colors[i % colors.length];
}

export default colorMap;
