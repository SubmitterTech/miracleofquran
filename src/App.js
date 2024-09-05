import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import quranData from './assets/qurantft.json';
import './App.css';
import colorMap from './utils/ColorMap';
import Stemmer from 'arabic-stem'


function App() {
  const [tquranMap, setTquranMap] = useState({});
  const [quranMap, setQuranMap] = useState({});

  const [selectedSura, setSelectedSura] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [filter, setFilter] = useState(null);

  const [filteredVerses, setFilteredVerses] = useState([]);
  const [loadedVerses, setLoadedVerses] = useState([]);

  const [occ, setOcc] = useState(0);


  const observerVerses = useRef();
  const stemmer = useMemo(() => new Stemmer(), []);

  void stemmer;

  const batchSize = 38;

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
              console.log(`C:`, count, `O:`, matches.length, sno + `:` + vno);

            }
          } else {
            verseList.push({ sno, vno, verse });
          }
        });
      });
    });

    console.log(filter, normalizeArabicPrefix(filter), count); // Output the filter and its count
    setOcc(count);
    setFilteredVerses(verseList);
  }, [filter]);

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
    <div className="App fixed text-xl w-screen h-screen bg-neutral-500 text-neutral-100 flex ">
      <div className="flex flex-col w-full overflow-auto mb-2 mt-2 space-y-1">

        <div className="rounded text-2xl shadow-lg p-2 text-start mx-2 mb-3 bg-fuchsia-300 text-neutral-900 sticky top-0 flex justify-between">
          <div >
            Filter: {filter ? filter : "N / A"}
          </div>
          <div>
            {`Occurance:${occ}`}
          </div>
          <div>
            {`Verses:` + filteredVerses.length}
          </div>

        </div>


        {/* {Object.entries(quranMap).map(([sura, verses]) => (
          <div key={sura} className="flex flex-col space-y-1 mx-2 ">
            {Object.entries(filterVersesByWord(verses)).map(([vno, verseText]) => (
              <div key={vno} className="text-start w-full flex justify-between space-x-3">
                <div
                  onClick={() => handleSelectedVerse(sura, vno)}
                  className={`w-24 rounded shadow-lg flex items-center justify-center cursor-pointer ${selectedSura === sura && selectedVerse === vno ? "bg-sky-200 text-neutral-900" : "bg-sky-600"}`}>{sura}:{vno}</div>
                <div
                  onClick={() => handleSelectedVerse(sura, vno)}
                  className={`w-full p-2 rounded shadow-lg cursor-pointer ${selectedSura === sura && selectedVerse === vno ? "bg-sky-200 text-neutral-900" : "bg-neutral-800"}`}
                  dir="rtl">
                  {lightMatchWords(verseText)}
                </div>
              </div>
            ))}
          </div>
        ))} */}

        <div>
          <div
            className={`text-sm md:text-base text-justify hyphens-auto w-full text-neutral-100 `}>
            <div className={`flex flex-col space-y-1 mx-2 `}>
              {

                loadedVerses.map(({ sno, vno, verse }, index) => {

                  return (
                    <div
                      ref={index === loadedVerses.length - 1 ? lastVerseElementRef : null}
                      key={`verse-${sno}:${vno}-index`}
                      className={`text-start w-full flex justify-between space-x-3`}>
                      <div
                        onClick={() => handleSelectedVerse(sno, vno)}
                        className={`w-24 rounded shadow-lg flex items-center justify-center cursor-pointer ${selectedSura === sno && selectedVerse === vno ? "bg-sky-200 text-neutral-900" : "bg-sky-600"}`}>
                        {sno}:{vno}
                      </div>
                      <div
                        onClick={() => handleSelectedVerse(sno, vno)}
                        className={`w-full p-2 rounded shadow-lg cursor-pointer ${selectedSura === sno && selectedVerse === vno ? "bg-sky-200 text-neutral-900" : "bg-neutral-800"}`}
                        dir="rtl">
                        {lightMatchWords(verse)}
                      </div>
                    </div>
                  );
                })

              }
            </div>
          </div>
        </div>

      </div>

      <div className="flex flex-col w-full overflow-auto h-full ">
        <div className="w-full p-1">

          <div className="p-1.5 bg-amber-300 text-neutral-900 text-2xl mb-4 mt-1 rounded shadow-lg flex space-x-2 justify-center">
            {/* Input for Sura */}
            <input
              type="number"
              className="w-20 p-0.5 text-center bg-white rounded shadow-md"
              value={selectedSura || ''}
              onChange={(e) => setSelectedSura(e.target.value)}
              placeholder="Sura"
            />

            <span>:</span>

            {/* Input for Verse */}
            <input
              type="number"
              className="w-20 p-0.5 text-center bg-white rounded shadow-md"
              value={selectedVerse || ''}
              onChange={(e) => setSelectedVerse(e.target.value)}
              placeholder="Verse"
            />
          </div>
          {selectedVerse &&
            <div className="flex flex-col space-y-2">
              <div
                key={"selected_" + selectedSura + ":" + selectedVerse}
                className="w-full p-2 rounded shadow-lg bg-neutral-800 text-start"
                dir="rtl">
                {quranMap[selectedSura][selectedVerse]?.toString()}
              </div>
              <div
                key={"tselected_" + selectedSura + ":" + selectedVerse}
                className="w-full p-2 rounded shadow-lg bg-neutral-800 text-start"
                dir="ltr">
                {tquranMap[selectedSura][selectedVerse]?.toString()}
              </div>
              <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3  rounded `}>
                {quranMap[selectedSura][selectedVerse]?.split(' ').map((word, index) => (
                  <div
                    onClick={() => handleSelectedWord(word.trim())}
                    key={selectedSura + selectedVerse + index + word}
                    className={`p-2 shadow-md rounded text-start ml-1 mb-1 cursor-pointer ${filter === word.trim() ? "bg-sky-300 text-neutral-900" : "bg-neutral-800 "}`}
                    dir="rtl">
                    <div className={`p-1 shadow-md rounded mb-1 text-base w-full text-center bg-neutral-600 ${filter === word.trim() ? " text-sky-300" : "text-neutral-100 "}`}>
                      {index + 1}
                    </div>
                    <div className={`p-1 w-full `} >
                      {word}
                    </div>
                  </div>
                ))}
              </div>
              <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3 rounded`}>
                {quranMap[selectedSura][selectedVerse]?.split('').reduce((acc, letter, index) => {
                  // Only increment the displayIndex for non-space characters
                  const isSpace = letter === ' ';
                  const displayIndex = isSpace ? null : acc.currentIndex + 1;

                  acc.currentIndex = isSpace ? acc.currentIndex : displayIndex;

                  acc.elements.push(
                    <div
                      key={`${selectedSura}${selectedVerse}${index}${letter}`}
                      className={`p-1 shadow-md rounded w-11 ml-1 mb-1 cursor-pointer bg-neutral-800 flex flex-col items-center`}
                      dir="rtl"
                    >
                      {/* Show the index only if the letter is not a space */}
                      {displayIndex && (
                        <div className={`p-1 shadow-md rounded mb-1 text-base w-9 bg-neutral-600`}>
                          {displayIndex}
                        </div>
                      )}
                      {/* Show the letter or an empty div for spaces */}
                      <div className={`py-2 w-full`} style={{ color: colorMap[letter] }}>
                        {isSpace ? <div className="w-5 h-9"></div> : letter}
                      </div>
                    </div>
                  );

                  return acc;
                }, { currentIndex: 0, elements: [] }).elements}
              </div>
            </div>
          }

        </div>
      </div>

    </div>
  );
}

export default App;