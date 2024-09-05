import React, { useState, useEffect, useCallback, useRef } from 'react';
import quranData from './assets/qurantft.json';
import './App.css';
import colorMap from './utils/ColorMap';
import { normalizeAlef } from 'arajs';

function App() {
  const [quranMap, setQuranMap] = useState({});

  const [selectedSura, setSelectedSura] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [filter, setFilter] = useState(null);

  const [filteredVerses, setFilteredVerses] = useState([]);
  const [loadedVerses, setLoadedVerses] = useState([]);


  const observerVerses = useRef();

  const batchSize = 19;

  useEffect(() => {
    let qmap = {};

    Object.values(quranData).forEach((page) => {
      Object.entries(page.sura).forEach(([sno, content]) => {
        if (!qmap[sno]) { qmap[sno] = {}; }
        Object.entries(content.encrypted).forEach(([vno, verse]) => {
          qmap[sno][vno] = verse;

        });
      });
    });


    setQuranMap(qmap);
  }, []);

  const normalizeArabic = (text) => {
    return text
      // Remove diacritics
      .replace(/[\u064B-\u065F]/g, "")
      // Normalize common prefixes like "AL" and "AR"
      .replace(/^(ال|أر|آل)/, "")
      // Handle ligatures like Lam-Alef
      .replace(/ﻻ|لا/, "لا");
  };

  useEffect(() => {
    let verseList = [];
    let count = 0;

    Object.values(quranData).forEach((page) => {
      Object.entries(page.sura).forEach(([sno, content]) => {
        Object.entries(content.encrypted).forEach(([vno, verse]) => {

          if (filter) {
            // Normalize the verse and filter using ArabicServices
            const normalizedVerse = normalizeAlef(verse);
            const normalizedFilter = normalizeAlef(filter);

            if (normalizedVerse.includes(normalizedFilter)) {
              verseList.push({ sno, vno, verse });

              // Count occurrences of the normalized filter word in the normalized verse
              const regex = new RegExp(normalizedFilter, 'g');
              const matches = normalizedVerse.match(regex);
              if (matches) {
                console.log(sno + `:` + vno, matches); // Log occurrences for debugging
              }
              count += (matches || []).length; // Add the count of matches
            }
          } else {
            verseList.push({ sno, vno, verse });
          }
        });
      });
    });

    console.log(filter, count); // Output the filter and its count
    setFilteredVerses(verseList);
  }, [filter]);

  const countLetterInSura = async (sura, l) => {
    let cnt = 0;

    // Convert the task to asynchronous using Promise
    await new Promise(resolve => {
      Object.values(quranMap[sura]).forEach((verse) => {
        // Count the occurrences of the letter in each verse
        for (const char of verse) {
          if (char === l) {
            cnt++;
          }
        }
        // console.log(verse, l, cnt)

      });
      resolve();
    });

    return cnt;
  };

  const handleSelectedVerse = (s, v) => {
    if (selectedSura === s && selectedVerse === v) {
      setSelectedSura(null)
      setSelectedVerse(null)
      setFilter(null)
    } else {
      setSelectedSura(s)
      setSelectedVerse(v)
    }
  }

  const handleSelectedWord = (w) => {
    console.log(w)
    if (filter === w) {
      setFilter(null)
    } else {
      setFilter(w)
    }
  }

  const lightMatchWords = useCallback((verse) => {
    if (!filter) {
      return verse;
    }

    // Use a regex to match words, keeping spaces intact
    const regex = new RegExp(`(${filter})|\\s+|\\S+`, 'g');
    const words = verse.match(regex).map((word, index) => {
      if (word === filter) {
        // Apply a different style for the selected word
        return <span key={index} className="text-sky-500">{word}</span>;
      } else {
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
    <div className="App text-xl w-screen h-screen bg-neutral-500 text-neutral-100 flex ">
      <div className="flex flex-col w-full overflow-auto mb-2 mt-2 space-y-1">

        <div className="rounded text-4xl shadow-lg p-2 text-start mx-2 mb-3 bg-fuchsia-300 text-neutral-900 sticky top-0 flex justify-between">
          <div >
            Filter: {filter ? filter : "N / A"}
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

          <div className="p-2 bg-amber-300 text-neutral-900 text-4xl mb-4 mt-1 rounded shadow-lg">
            {selectedSura}:{selectedVerse}
          </div>

          {selectedVerse &&
            <div className="flex flex-col space-y-2">
              <div
                key={"selected_" + selectedSura + ":" + selectedVerse}
                className="w-full p-2 rounded shadow-lg bg-neutral-800 text-start"
                dir="rtl">
                {quranMap[selectedSura][selectedVerse]}
              </div>
              <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3  rounded `}>
                {quranMap[selectedSura][selectedVerse].split(" ").map((word, index) => (
                  <div
                    onClick={() => handleSelectedWord(word.trim())}
                    key={selectedSura + selectedVerse + index + word}
                    className={`p-2 shadow-md rounded text-start ml-1 mb-1 cursor-pointer ${filter === word.trim() ? "bg-sky-300 text-neutral-900" : "bg-neutral-800 "}`}
                    dir="rtl">
                    <div className={`p-1 shadow-md rounded mb-1 text-base w-full text-center bg-neutral-600`}>
                      {index + 1}
                    </div>
                    <div className={`p-1 w-full `} >
                      {word}
                    </div>
                  </div>
                ))}
              </div>
              <div dir="rtl" className={`w-full flex flex-wrap items-center justify-start pb-3 rounded`}>
                {quranMap[selectedSura][selectedVerse].split('').reduce((acc, letter, index) => {
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
                      <div className={`p-1 w-full`} style={{ color: colorMap[letter] }}>
                        {isSpace ? <div className="w-9 h-9"></div> : letter}
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