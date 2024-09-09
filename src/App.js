import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import quranData from './assets/qurantft.json';
import './App.css';
import colorMap from './utils/ColorMap';

function App() {
  const [tquranMap, setTquranMap] = useState({});
  const [quranMap, setQuranMap] = useState({});

  const [selectedSura, setSelectedSura] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [filter, setFilter] = useState(null);

  const [formula, setFormula] = useState('');

  const [filteredVerses, setFilteredVerses] = useState([]);
  const [loadedVerses, setLoadedVerses] = useState([]);

  const [occ, setOcc] = useState(0);

  const observerVerses = useRef();

  const batchSize = 38;

  const [selectedLetters, setSelectedLetters] = useState([]);

  const toggleLetterSelection = (letter) => {
    setSelectedLetters((prevSelected) =>
      prevSelected.includes(letter)
        ? prevSelected.filter((l) => l !== letter)
        : [...prevSelected, letter]
    );
  };

  const arabicLetterValues = useMemo(() =>
  ({
    'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
    'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
    'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900,
    'غ': 1000,
    'ء': 1,
  }), []);

  const arabicLetters = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز',
    'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك',
    'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];

  useEffect(() => {
    let qmap = {};
    let tqmap = {};

    Object.values(quranData).forEach((page) => {
      Object.entries(page.sura).forEach(([sno, content]) => {
        if (!qmap[sno]) { qmap[sno] = {}; }
        if (!tqmap[sno]) { tqmap[sno] = {}; }
        Object.entries(content.encrypted).forEach(([vno, verse]) => {
          qmap[sno][vno] = verse;

        });
        Object.entries(content.verses).forEach(([vno, verse]) => {
          tqmap[sno][vno] = verse;

        });
      });
    });

    setTquranMap(tqmap);
    setQuranMap(qmap);
  }, []);

  const besmele = (quranMap && quranMap['1']) ? quranMap['1']['1'] : null;

  function getRegex(f) {
    const sunLetters = 'تثدذرزسشصضطظن';
    return new RegExp(`(?<![${sunLetters}])(${f})(?![\\u0600-\\u06FF${(f?.slice(-1) === 'ه' || f?.slice(-1) === 'ن') ? '' : '&&[^ا]'}])`, 'g');
  }

  function normalizeArabicPrefix(text) {
    // Normalize Alef variations only at the start of the word


    // // Normalize Ta Marbuta to Ha only at the end of the word
    // text = text.replace(/ة$/, 'ه');

    // // Normalize Hamza variations (keep them only at the beginning)
    // text = text.replace(/^ؤ/, 'ء');
    // text = text.replace(/^ئ/, 'ء');

    // // Remove Tashkeel (diacritics) entirely
    // text = text.replace(/[\u064B-\u0652]/g, ''); // Unicode range for diacritics

    // Handle common Arabic prefixes


    if (text) {
      if (text.length > 4) {
        const prefixes = ['ب', 'ل', 'ال', 'و', 'ف', 'ك'];
        const prefixRegex = new RegExp(`^(${prefixes.join('|')})`, 'g');
        text = text.replace(prefixRegex, '');
      }

      if (text.split('')[0] === 'ا') {
        text = text.slice(1)
      }
    }

    // // Handle sun letters (ignore assimilation but retain normalization)
    // const sunLetters = 'تثدذرزسشصضطظلن';
    // const sunRegex = new RegExp(`^ال([${sunLetters}])`, 'g');
    // text = text.replace(sunRegex, '$1'); // Drop "ال" but keep the assimilated letter

    return text;
  }

  const verseText = (quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]) || '';

  const lc = useMemo(() => {
    // If a selectedVerse exists, calculate the letter counts for it, regardless of the formula
    if (selectedVerse !== null) {
      return verseText.split('').reduce((counts, letter) => {
        if (letter !== ' ') {
          if (letter === 'ء') {
            letter = 'ا'; // Normalize 'ء' to 'ا'
          }
          counts[letter] = (counts[letter] || 0) + 1;
        }
        return counts;
      }, {});
    }

    // When no selectedVerse and formula is provided, sum up the letter counts from filteredVerses
    if (formula.trim() !== '') {
      return filteredVerses.reduce((totalCounts, verseObj) => {
        Object.entries(verseObj.c).forEach(([letter, count]) => {
          totalCounts[letter] = (totalCounts[letter] || 0) + count;
        });
        return totalCounts;
      }, {});
    }

    // Default case if no selectedVerse and no formula
    return {};
  }, [verseText, filteredVerses, formula, selectedVerse]);


  useEffect(() => {
    let verseList = [];
    let count = 0;

    Object.values(quranData).forEach((page) => {
      Object.entries(page.sura).forEach(([sno, content]) => {
        Object.entries(content.encrypted).forEach(([vno, verse]) => {

          // Function to calculate letter counts
          const getLetterCounts = (verse) => {
            return verse.split('').reduce((counts, letter) => {
              if (letter !== ' ') {
                // Normalize the letter "ء" to "ا"
                if (letter === 'ء') {
                  letter = 'ا';
                }
                counts[letter] = (counts[letter] || 0) + 1;
              }
              return counts;
            }, {});
          };

          let letterCounts = getLetterCounts(verse); // Calculate the letter counts

          if (filter) {
            // Normalize only the prefix of the filter and the verse
            const normalizedFilter = normalizeArabicPrefix(filter);

            // Create the regex with the escaped filter
            const regex = getRegex(normalizedFilter);

            // Match the normalized verse using the regex
            const matches = verse.match(regex);

            if (matches) {
              count += matches.length;
              verseList.push({ sno, vno, verse, hc: matches.length, c: letterCounts });
            }
          } else if (formula.trim() !== '') {
            const sf = formula.trim().split(' ');
            const sn = Number(sno);
            const vn = Number(vno);

            sf.forEach((f) => {
              const [s, vrange] = f.split(':');

              // Define the condition to check for duplicate entries
              const entryExists = verseList.some((v) => v.sno === sno && v.vno === vno);

              // Only proceed if the entry doesn't already exist
              if (!entryExists && vrange !== undefined) {
                if (vrange === '') {
                  // Single verse case (like "2:"), meaning all verses of surah 2
                  if (Number(s) === sn) {
                    verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
                  }
                } else if (vrange.includes('-')) {
                  const [vstart, vend] = vrange.split('-').map(Number);

                  if (vstart !== 0 && vend === 0) {
                    // Case where start is defined, and the end is open (like "2:5-")
                    if (Number(s) === sn && vstart <= vn) {
                      verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
                    }
                  } else if (vstart === 0 && vend !== 0) {
                    // Case where start is open, but the end is defined (like "2:-5")
                    if (Number(s) <= sn && sn <= vend) {
                      verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
                    }
                  } else {
                    // Standard range case (like "2:3-7")
                    if (Number(s) === sn && vstart <= vn && vn <= vend) {
                      verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
                    }
                  }
                } else {
                  // Single verse case (like "2:5")
                  if (Number(s) === sn && vn === Number(vrange)) {
                    verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
                  }
                }
              }
            });
          } else {
            verseList.push({ sno, vno, verse, hc: 0, c: letterCounts });
          }
        });
      });
    });

    setOcc(count);
    setFilteredVerses(verseList);
  }, [filter, formula]);


  const handleSelectedVerse = (s, v) => {
    if (selectedSura === s && selectedVerse === v) {
      setSelectedSura(null);
      setSelectedVerse(null);
      setFilter(null);
      setOcc(0);
    } else {
      setSelectedSura(s);
      setSelectedVerse(v);
    }
  }

  const handleSelectedWord = (w) => {
    if (filter === w) {
      setFilter(null);
      setOcc(0);
    } else {
      setFilter(w);
      setFormula('');
    }
  }

  const lightMatchWords = useCallback((verse) => {
    if (!filter && selectedLetters.length === 0) {
      return verse;
    }
    // Stem the filter word
    const normalizedFilter = normalizeArabicPrefix(filter);
    const regex = getRegex(normalizedFilter);
    // Split the verse into words (preserving spaces)
    const words = verse.split(/(\s+)/).map((word, index) => {
      const wordContainsSelectedLetter = selectedLetters.some((letter) =>
        word.includes(letter)
      );
      // Highlight individual letters
      const highlightLetters = (word, baseColor) => {
        return word.split('').map((char, charIndex) => {
          if (selectedLetters.includes(char)) {
            return (
              <span key={`${index}-${charIndex}`} style={{ color: colorMap[char] }}>
                {char}
              </span>
            );
          } else {
            return (
              <span key={`${index}-${charIndex}`} style={{ color: baseColor }}>
                {char}
              </span>
            );
          }
        });
      };
      // Exact match
      if (word === filter) {
        return (
          highlightLetters(word, '#0ea5e9')
        );
      }
      // Common stem match
      else if (word.match(regex)) {
        return (
          highlightLetters(word, '#22c55e')
        );
      }
      // Word contains a selected letter
      else if (wordContainsSelectedLetter) {
        return (
          highlightLetters(word, '')
        );
      }
      // No match
      else {
        return <span key={index}>{word}</span>;
      }
    });
    return <div dir="rtl">{words}</div>;
  }, [filter, selectedLetters]);

  const lastVerseElementRef = useCallback(node => {
    if (observerVerses.current) observerVerses.current.disconnect();
    observerVerses.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && loadedVerses.length < filteredVerses.length) {
        setLoadedVerses(prevLoaded => [
          ...prevLoaded,
          ...filteredVerses.slice(prevLoaded.length, prevLoaded.length + batchSize)
        ]);
      }
    });
    if (node) observerVerses.current.observe(node);
  }, [filteredVerses, loadedVerses]);

  useEffect(() => {
    setLoadedVerses(filteredVerses.slice(0, batchSize));
  }, [filteredVerses]);

  useEffect(() => {
    if (formula !== '') {
      setSelectedVerse(null);
    }
  }, [formula]);

  const formatDivisibility = (count) => {
    const factor = 19;
    if (count % factor === 0 && count !== 0) {
      return `${count} (${factor} x ${count / factor})`;
    }
    return count;
  };

  return (
    <div className="App fixed w-screen h-full ">
      <div className={`w-full h-full bg-neutral-700 text-neutral-100 overflow-auto text-xl grid grid-cols-2 grid-rows-12 gap-y-0.5`}>
        <div className={`row-span-10 lg:row-span-11 col-span-2 h-full w-full grid grid-cols-2 grid-rows-2`}>
          <div className="col-span-2 row-span-1 lg:col-span-1 lg:row-span-2 w-full h-full flex flex-col space-y-1 ">
            <div className="flex w-full lg:px-0.5">
              <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg p-2 text-start bg-cyan-500 text-neutral-900 flex flex-wrap justify-between">
                <div>
                  {`Verses: ` + formatDivisibility(filteredVerses.length)}
                </div>
                <div>
                  {`Occurance: ` + formatDivisibility(occ)}
                </div>
              </div>
            </div>
            <div className={`h-full w-full overflow-auto`}>
              <div className={`text-sm md:text-base text-justify w-full h-full px-1 `}>
                <div className={`flex flex-col space-y-1 `}>
                  {
                    loadedVerses.map(({ sno, vno, verse }, index) => {
                      const isbesmele = parseInt(sno) !== 1 && parseInt(sno) !== 9 && parseInt(vno) === 1;
                      return (
                        <div
                          ref={index === loadedVerses.length - 1 ? lastVerseElementRef : null}
                          key={`verse-${sno}:${vno}-index`}
                        >
                          {
                            isbesmele && !filter &&
                            <div
                              className={`text-start w-full flex justify-between space-x-1 mb-1`}>
                              <div
                                className={`w-full p-2 rounded shadow-md bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-500 text-neutral-900`}>
                                <div className={`flex w-full space-x-2`}>
                                  <div dir="ltr" className={`text-neutral-900`}>
                                    {sno}:{0}
                                  </div>
                                  <div dir="rtl" className={`w-full`}>
                                    {besmele}
                                  </div>
                                </div>
                              </div>
                            </div>
                          }
                          <div
                            className={`text-start w-full flex justify-between space-x-1`}>
                            <div
                              onClick={() => handleSelectedVerse(sno, vno)}
                              className={`w-full p-2 rounded shadow-md cursor-pointer ${selectedSura === sno && selectedVerse === vno ? `bg-sky-900` : `bg-neutral-900`}`}>
                              <div className={`flex w-full space-x-1.5`}>
                                <div dir="ltr" className={`text-sky-500`}>
                                  {sno}:{vno}
                                </div>
                                <div dir="rtl" className={`w-full`}>
                                  {lightMatchWords(verse)}
                                </div>
                                <div dir="ltr" className={`text-amber-400 text-xs flex items-center`}>
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-2 row-span-1 lg:col-span-1 lg:row-span-2 w-full h-full flex flex-col space-y-1 ">
            <div className="flex w-full lg:px-0.5">
              <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg text-center px-2 py-1.5 bg-green-500 text-neutral-900 flex flex-wrap justify-between ">

                <div className={`flex items-center space-x-2 w-2/3 lg:w-3/4 justify-between`}>
                  <div>Formula:</div>
                  <input
                    type="text"
                    disabled={filter}
                    className=" w-full p-0.5 px-2 text-start bg-green-600/80 rounded shadow-inner placeholder:text-neutral-100/50"
                    value={formula || ''}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder={`${selectedVerse ? `${selectedSura}:${selectedVerse}` : `formula e.g. 3:18 33:7 33:40`}`}
                  />
                </div>
                <div className={`flex items-center`}>
                  Filter: {filter ? filter : "N / A"}
                </div>
              </div>

            </div>
            <div className={`overflow-auto h-full w-full`}>
              {selectedVerse &&
                <div className={`flex flex-col space-y-2 px-1`}>
                  <div
                    key={"tselected_" + selectedSura + ":" + selectedVerse}
                    className="w-full p-2 px-3 rounded shadow-lg bg-neutral-800 text-start"
                    dir="ltr">
                    {tquranMap && tquranMap[selectedSura] && tquranMap[selectedSura][selectedVerse]?.toString()}
                  </div>
                  <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start rounded `}>
                    {quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]?.split(' ').map((word, index) => (
                      <div
                        onClick={() => handleSelectedWord(word.trim())}
                        key={selectedSura + selectedVerse + index + word}
                        className={`p-0.5 shadow-md rounded text-start ml-1 mb-1 cursor-pointer ${filter === word.trim() ? "bg-sky-300 text-neutral-900" : "bg-sky-900 "}`}
                        dir="rtl">
                        <div className={`p-1 shadow-md rounded mb-1 text-base w-full text-center  ${filter === word.trim() ? "text-neutral-100 bg-neutral-700" : "text-neutral-900 bg-neutral-400 "}`}>
                          {index + 1}
                        </div>
                        <div className={`p-1.5 w-full `} >
                          {word}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start rounded`}>
                    {quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]?.split('').reduce((acc, letter, index) => {
                      // Only increment the displayIndex for non-space characters
                      const isSpace = letter === ' ';
                      const displayIndex = isSpace ? null : acc.currentIndex + 1;

                      acc.currentIndex = isSpace ? acc.currentIndex : displayIndex;

                      acc.elements.push(
                        <div
                          key={`${selectedSura}${selectedVerse}${index}${letter}`}
                          className={`p-0.5 rounded ml-0.5 mb-1 h-24 ${isSpace ? `w-3` : ` w-12 shadow-md bg-neutral-900 ${selectedLetters.includes(letter) ? `ring-sky-500 ring-2` : ``}`}  flex flex-col items-center`}
                          dir="rtl"
                        >
                          {/* Show the index only if the letter is not a space */}
                          {displayIndex && (
                            <div className={`p-1 w-full rounded text-base bg-neutral-700`}>
                              {displayIndex}
                            </div>
                          )}
                          {/* Show the letter or an empty div for spaces */}
                          <div className={` text-2xl w-full h-full flex items-center justify-center`} style={{ color: colorMap[letter] }}>
                            {letter}
                          </div>

                          {displayIndex && (
                            <div className={`p-0.5 text-sm w-full`} >
                              {arabicLetterValues[letter]}
                            </div>
                          )}
                        </div>
                      );

                      return acc;
                    }, { currentIndex: 0, elements: [] }).elements}
                  </div>

                </div>
              }
              {formula !== '' &&
                <div className="flex flex-col space-y-2 px-1">
                </div>
              }
            </div>
          </div>
        </div>
        <div className={`col-span-2 row-span-2 w-full h-full bg-neutral-600 relative`}>
          <div dir={'ltr'} className={`h-full w-full flex flex-wrap p-0.5 gap-0.5 absolute select-none`}>
            {arabicLetters.map((letter, index) => (
              <div
                key={`${index}${letter}`}
                onClick={() => toggleLetterSelection(letter)}
                className={`grow rounded cursor-pointer flex flex-col justify-between py-1 transition-transform ${selectedLetters.includes(letter) ? `-translate-y-7 ring-1 ring-sky-500` : ``}  ${lc[letter] ? `bg-neutral-900` : `bg-neutral-800`}`}
                dir="rtl"
              >
                <div className={`text-lg md:text-xl lg:text-2xl min-w-6 w-full flex items-center md:items-end justify-center brightness-75`} style={{ color: colorMap[letter] }}>
                  {letter}
                </div>
                <div className={`pb-0.5 text-xs md:text-sm w-full ${lc[letter] ? `text-neutral-100` : `text-neutral-500`} `}>
                  {lc[letter] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;