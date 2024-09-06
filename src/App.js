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

  const arabicLetterValues = useMemo(() =>
  ({
    'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
    'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
    'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900,
    'غ': 1000,
    'ء': 1,
  }), []);

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
    return new RegExp(`(?<![${sunLetters}])(${f})(?![\\u0600-\\u06FF${(f.slice(-1) === 'ه' || f.slice(-1) === 'ن') ? '' : '&&[^ا]'}])`, 'g');
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

  useEffect(() => {
    let verseList = [];
    let count = 0;

    Object.values(quranData).forEach((page) => {
      Object.entries(page.sura).forEach(([sno, content]) => {
        Object.entries(content.encrypted).forEach(([vno, verse]) => {

          if (filter) {
            // Normalize only the prefix of the filter and the verse
            const normalizedFilter = normalizeArabicPrefix(filter);

            // Create the regex with the escaped filter
            const regex = getRegex(normalizedFilter);

            // Match the normalized verse using the regex
            const matches = verse.match(regex);

            if (matches) {
              count += matches.length;
              verseList.push({ sno, vno, verse });
            }
          } else {
            verseList.push({ sno, vno, verse });
          }
        });
      });
    });

    setOcc(count);
    setFilteredVerses(verseList);
  }, [filter, arabicLetterValues]);

  // const countLetterInSura = async (sura, l) => {
  //   let cnt = 0;

  //   // Convert the task to asynchronous using Promise
  //   await new Promise(resolve => {
  //     Object.values(quranMap[sura]).forEach((verse) => {
  //       // Count the occurrences of the letter in each verse
  //       for (const char of verse) {
  //         if (char === l) {
  //           cnt++;
  //         }
  //       }
  //       // console.log(verse, l, cnt)

  //     });
  //     resolve();
  //   });

  //   return cnt;
  // };

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
    console.log(w)
    if (filter === w) {
      setFilter(null);
      setOcc(0);
    } else {
      setFilter(w)
    }
  }

  const lightMatchWords = useCallback((verse) => {
    if (!filter) {
      return verse;
    }

    // Stem the filter word
    const normalizedFilter = normalizeArabicPrefix(filter);


    const regex = getRegex(normalizedFilter);


    // Split the verse into words (preserving spaces)
    const words = verse.split(/(\s+)/).map((word, index) => {

      // Exact match
      if (word === filter) {
        return <span key={index} className="text-sky-500">{word}</span>;
      }

      // Common stem match
      else if (word.match(regex)) {
        return <span key={index} className="text-green-500">{word}</span>;
      }

      // No match
      else {
        return <span key={index}>{word}</span>;
      }
    });

    return <div dir="rtl">{words}</div>;
  }, [filter]);



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

  return (
    <div className="App fixed text-xl w-screen h-screen bg-neutral-400 text-neutral-100 flex ">

      <div className="flex flex-col w-full my-1 space-y-1 ">
        <div className="flex w-full px-0.5">
          <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg p-2 text-start mb-2 bg-cyan-500 text-neutral-900 flex flex-wrap justify-between">
            <div>
              {`Verses: ` + filteredVerses.length}
            </div>
            <div>
              {`Occurance: ${occ}`}
            </div>


          </div>
        </div>
        <div className={`overflow-auto`}>
          <div className={`text-sm md:text-base text-justify w-full h-full text-neutral-100 px-1`}>
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
                        isbesmele &&
                        <div
                          className={`text-start w-full flex justify-between space-x-1 mb-1`}>
                          <div
                            className={`w-full p-2 rounded shadow-lg bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-500 text-neutral-900`}>
                            <div className={`flex w-full`}>
                              <div dir="ltr" className={`text-neutral-900`}>
                                {sno}:{0}
                              </div>
                              <div dir="rtl" className={`w-full`}>
                                {lightMatchWords(besmele)}
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                      <div
                        className={`text-start w-full flex justify-between space-x-1`}>
                        <div
                          onClick={() => handleSelectedVerse(sno, vno)}
                          className={`w-full p-2 rounded shadow-lg cursor-pointer ${selectedSura === sno && selectedVerse === vno ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800"}`}>
                          <div className={`flex w-full`}>
                            <div dir="ltr" className={`text-sky-500`}>
                              {sno}:{vno}
                            </div>
                            <div dir="rtl" className={`w-full`}>
                              {lightMatchWords(verse)}
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

      <div className="flex flex-col w-full my-1 space-y-1 ">
        <div className="flex w-full px-0.5">
          <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg text-center px-2 py-1.5 mb-2 bg-green-500 text-neutral-900 flex flex-wrap justify-between ">

            <div className={`flex items-center space-x-2 w-full md:w-3/4 justify-between`}>
              <div>Formula:</div>
              <input
                type="text"
                className=" w-full p-0.5 px-2 text-start bg-green-600/80 rounded shadow-md placeholder:text-neutral-100/50"
                value={formula || ''}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="formula e.g. 3:18 33:7 33:40"
              />
            </div>
            <div className={`flex items-center`}>
              Filter: {filter ? filter : "N / A"}
            </div>
          </div>

        </div>
        <div className={`overflow-auto `}>
          <div className="flex flex-col space-y-2 px-1">
            {/* <div
                key={"selected_" + selectedSura + ":" + selectedVerse}
                className="w-full p-2 sticky top-12 rounded shadow-lg bg-neutral-100 text-neutral-900 text-start"
                dir="rtl">
                {quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]?.toString()}
              </div> */}
            {selectedVerse &&
              <div
                key={"tselected_" + selectedSura + ":" + selectedVerse}
                className="w-full p-2 px-3 rounded shadow-lg bg-neutral-800 text-start"
                dir="ltr">
                {tquranMap && tquranMap[selectedSura] && tquranMap[selectedSura][selectedVerse]?.toString()}
              </div>}
            <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3  rounded `}>
              {quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]?.split(' ').map((word, index) => (
                <div
                  onClick={() => handleSelectedWord(word.trim())}
                  key={selectedSura + selectedVerse + index + word}
                  className={`p-0.5 shadow-md rounded text-start ml-1 mb-1 cursor-pointer ${filter === word.trim() ? "bg-sky-300 text-neutral-900" : "bg-sky-800 "}`}
                  dir="rtl">
                  <div className={`p-1 shadow-md rounded mb-1 text-base w-full text-center  ${filter === word.trim() ? " text-neutral-100 bg-neutral-700" : "text-neutral-900 bg-neutral-400 "}`}>
                    {index + 1}
                  </div>
                  <div className={`p-1.5 w-full `} >
                    {word}
                  </div>
                </div>
              ))}
            </div>
            <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3 rounded`}>
              {quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]?.split('').reduce((acc, letter, index) => {
                // Only increment the displayIndex for non-space characters
                const isSpace = letter === ' ';
                const displayIndex = isSpace ? null : acc.currentIndex + 1;

                acc.currentIndex = isSpace ? acc.currentIndex : displayIndex;

                acc.elements.push(
                  <div
                    key={`${selectedSura}${selectedVerse}${index}${letter}`}
                    className={`p-0.5 rounded ml-1 mb-1 cursor-pointer h-28 ${isSpace ? `w-4` : ` w-12 bg-neutral-900 shadow-md`}  flex flex-col items-center`}
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
        </div>
      </div>

    </div>
  );
}

export default App;