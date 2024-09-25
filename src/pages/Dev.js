import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import quranData from '../assets/qurantft.json';
import counts from '../assets/counts.json';
import '../App.css';
import colorMap from '../utils/ColorMap';
import VerseDetail from '../components/VerseDetail';

function Dev() {
  // const [tquranMap, setTquranMap] = useState({});
  const [quranMap, setQuranMap] = useState({});

  const [selectedSura, setSelectedSura] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [filter, setFilter] = useState(null);


  const [formula, setFormula] = useState('');

  const [filteredVerses, setFilteredVerses] = useState([]);
  const [loadedVerses, setLoadedVerses] = useState([]);
  const [loadedVerseDetails, setLoadedVerseDetails] = useState([]);

  const [occ, setOcc] = useState(0);
  const [sosl, setSosl] = useState(0);

  const observerVerses = useRef();
  const observerVerseDetails = useRef();

  const detailBatchSize = 7;
  const batchSize = 38;
  const factor = 19;

  const alm = counts["ALM"];
  const alr = counts["ALR"];
  const almr = counts["ALMR"];
  const alms = counts["ALMS"];
  const khyas = counts["KHYAS"];
  const ys = counts["YS"];


  const almlist = useMemo(() => (['29', '31']), []);
  const alrlist = useMemo(() => ([]), []);
  const almrlist = useMemo(() => ([]), []);
  const almslist = useMemo(() => ([]), []);
  const khyaslist = useMemo(() => ([]), []);
  const yslist = useMemo(() => ([]), []);
  // const almlist = useMemo(() => (['2', '3', '29', '30', '31', '32']), []);
  // const alrlist = useMemo(() => (['10', '11', '12', '14', '15']), []);
  // const almrlist = useMemo(() => (['13']), []);
  // const almslist = useMemo(() => (['7']), []);
  // const khyaslist = useMemo(() => (['19']), []);
  // const yslist = useMemo(() => (['36']), []);


  const [checkHM, setCheckHM] = useState(true);

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
    'ا', 'ء', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز',
    'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك',
    'ل', 'م', 'ن', 'ه', 'و', 'ي',
    'ئ'
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
        // Object.entries(content.verses).forEach(([vno, verse]) => {
        //   tqmap[sno][vno] = verse;

        // });
      });
    });

    // setTquranMap(tqmap);
    setQuranMap(qmap);
  }, []);

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

  const besmele = (quranMap && quranMap['1']) ? quranMap['1']['1'] : null;
  const verseText = (quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]) || '';

  const lc = useMemo(() => {
    // If a selectedVerse exists, calculate the letter counts for it, regardless of the formula
    if (selectedVerse !== null) {
      return verseText.split('').reduce((counts, letter) => {
        if (letter !== ' ') {
          // if (letter === 'ء') {
          //   letter = 'ا'; // Normalize 'ء' to 'ا'
          // }
          counts[letter] = (counts[letter] || 0) + 1;
        }
        return counts;
      }, {});
    }
    // Helper function to count letters
    const countLetters = (text) => {
      return text.split('').reduce((counts, letter) => {
        if (letter !== ' ') {
          // if (letter === 'ء') {
          //   letter = 'ا'; // Normalize 'ء' to 'ا'
          // }
          counts[letter] = (counts[letter] || 0) + 1;
        }
        return counts;
      }, {});
    };

    // Helper function to check if all verses of a Surah are included
    const isCompleteSurahIncluded = (sno) => {
      const surahVerses = filteredVerses.filter(verseObj => verseObj.sno === sno);
      const totalVersesInSurah = Object.keys(quranMap[sno]).length; // Get total number of verses in the Surah
      return surahVerses.length === totalVersesInSurah;
    };

    // When no selectedVerse and formula is provided, sum up the letter counts from filteredVerses
    if (formula.trim() !== '') {
      // Keep track of surahs that have already had Besmele included
      let includedSurahs = new Set();

      return filteredVerses.reduce((totalCounts, verseObj) => {
        const { sno, verse } = verseObj;
        let fullText = verse;

        // Include "Besmele" only once per Surah (if Surah is not 1 or 9, and all verses of the Surah are included)
        if (sno !== '1' && sno !== '9' && !includedSurahs.has(sno) && isCompleteSurahIncluded(sno)) {
          fullText = besmele + verse;
          includedSurahs.add(sno); // Mark this Surah as having Besmele included
        }

        // Count the letters for this verse (with or without Besmele)
        const verseLetterCounts = countLetters(fullText);

        // Add the verse's letter counts to the total counts
        Object.entries(verseLetterCounts).forEach(([letter, count]) => {
          totalCounts[letter] = (totalCounts[letter] || 0) + count;
        });
        return totalCounts;
      }, {});
    }

    // Default case if no selectedVerse and no formula
    return {};
  }, [filteredVerses, formula, besmele, quranMap, verseText, selectedVerse]);


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
                // if (letter === 'ء') {
                //   letter = 'ا';
                // }
                counts[letter] = (counts[letter] || 0) + 1;
              }
              return counts;
            }, {});
          };

          const getLetterNumericSum = (verse) => {
            // Iterate over each character in the verse and sum up their numerical values
            return [...verse].reduce(
              (sum, char) => sum + (arabicLetterValues[char] || 0),
              0
            );
          };

          let c = getLetterCounts(verse); // Calculate the letter counts

          let ns = getLetterNumericSum(verse);

          if (checkHM) {
            if (almlist.includes(sno)) {
              const letters = Object.keys(alm[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with alm[key][l]
                if (cCount !== alm[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            } else if (alrlist.includes(sno)) {
              const letters = Object.keys(alr[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with alm[key][l]
                if (cCount !== alr[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            } else if (almrlist.includes(sno)) {
              const letters = Object.keys(almr[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with almr[key][l]
                if (cCount !== almr[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            } else if (almslist.includes(sno)) {
              const letters = Object.keys(alms[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with alms[key][l]
                if (cCount !== alms[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            } else if (khyaslist.includes(sno)) {
              const letters = Object.keys(khyas[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with alms[key][l]
                if (cCount !== khyas[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            } else if (yslist.includes(sno)) {
              const letters = Object.keys(ys[sno]);
              let islost = false;
              for (let l of letters) {
                let cCount = 0;

                // If the current letter is Alif, sum both Hamza (ء) and Alif (ا)
                if (l === 'ا') {
                  cCount = (c['ء'] || 0) + (c['ا'] || 0);
                } else {
                  cCount = c[l] || 0;
                }

                // Compare the count of letters with alms[key][l]
                if (cCount !== ys[sno][l][vno]) {
                  islost = true;
                  break; // stop checking further if a mismatch is found
                }

              }
              if (islost) {
                verseList.push({ sno, vno, verse, hc: 0, c, ns });
              }
            }
          } else {
            if (filter) {

              // Normalize only the prefix of the filter and the verse
              //const normalizedFilter = normalizeArabicPrefix(filter);

              // Create the regex with the escaped filter
              //const regex = getRegex(normalizedFilter);

              // Match the normalized verse using the regex
              const matches = verse.match(filter);

              if (verse.includes(filter)) {
                count += matches.length;
                verseList.push({ sno, vno, verse, hc: matches.length, c, ns });
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
                      verseList.push({ sno, vno, verse, hc: 0, c, ns });
                    }
                  } else if (vrange.includes('-')) {
                    const [vstart, vend] = vrange.split('-').map(Number);

                    if (vstart !== 0 && vend === 0) {
                      // Case where start is defined, and the end is open (like "2:5-")
                      if (Number(s) === sn && vstart <= vn) {
                        verseList.push({ sno, vno, verse, hc: 0, c, ns });
                      }
                    } else if (vstart === 0 && vend !== 0) {
                      // Case where start is open, but the end is defined (like "2:-5")
                      if (Number(s) <= sn && sn <= vend) {
                        verseList.push({ sno, vno, verse, hc: 0, c, ns });
                      }
                    } else {
                      // Standard range case (like "2:3-7")
                      if (Number(s) === sn && vstart <= vn && vn <= vend) {
                        verseList.push({ sno, vno, verse, hc: 0, c, ns });
                      }
                    }
                  } else {
                    // Single verse case (like "2:5")
                    if (Number(s) === sn && vn === Number(vrange)) {
                      verseList.push({ sno, vno, verse, hc: 0, c, ns });
                    }
                  }
                }
              });
            } else {
              verseList.push({ sno, vno, verse, hc: 0, c, ns });
            }


          }
        });
      });
    });

    setOcc(count);
    setFilteredVerses(verseList);
  }, [filter, formula, arabicLetterValues, checkHM, alm, alr, almr, alms, khyas, ys, almlist, alrlist, almrlist, almslist, khyaslist, yslist]);


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
      if (!checkHM) {
        setFilter(w);
      }
      //setFormula('');
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
      else if (word.includes(filter)) {
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

  const lastVerseDetailElementRef = useCallback(node => {
    if (observerVerseDetails.current) observerVerseDetails.current.disconnect();
    observerVerseDetails.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && loadedVerseDetails.length < filteredVerses.length) {
        setLoadedVerseDetails(prevLoaded => [
          ...prevLoaded,
          ...filteredVerses.slice(prevLoaded.length, prevLoaded.length + detailBatchSize)
        ]);
      }
    });
    if (node) observerVerseDetails.current.observe(node);
  }, [filteredVerses, loadedVerseDetails]);

  useEffect(() => {
    setLoadedVerses(filteredVerses.slice(0, batchSize));
    setLoadedVerseDetails(filteredVerses.slice(0, detailBatchSize));
  }, [filteredVerses]);

  useEffect(() => {
    if (formula !== '') {
      setSelectedVerse(null);
    }
  }, [formula]);

  useEffect(() => {
    if (selectedLetters.length > 0) {
      let t = 0;
      selectedLetters.forEach((l) => {
        t = t + (lc[l] || 0);
      });
      setSosl(t);
    }
  }, [selectedLetters, lc]);

  const isDivisible = (f, n) => {
    n = Number(n);
    return (n > 0 && n % f === 0);
  };

  const formatDivisible = (count) => {
    if (isDivisible(factor, count)) {
      return `${count} (${factor} x ${count / factor})`;
    }
    return count;
  };

  const formatDivisibleOnlyMultiplier = (count) => {

    if (isDivisible(factor, count)) {
      return `${factor} x ${count / factor}`;
    }
    return count;
  };

  return (
    <div className="App fixed w-screen h-full ">
      <div className={`w-full h-full bg-neutral-600 text-neutral-100 overflow-auto text-xl grid grid-cols-2 grid-rows-12 gap-y-0.5`}>
        <div className={`row-span-10 col-span-2 lg:row-span-11 h-full w-full grid grid-cols-2 grid-rows-8`}>
          <div className="col-span-2 row-span-3 lg:col-span-1 lg:row-span-8 w-full h-full flex flex-col space-y-1 ">
            <div className="flex w-full lg:px-0.5">
              <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg p-2 text-start bg-neutral-400 text-neutral-900 flex flex-wrap justify-between">
                <div>
                  {`Verses: ` + formatDivisible(filteredVerses.length)}
                </div>
                <div>
                  {`Occurance: ` + formatDivisible(occ)}
                </div>
              </div>
            </div>
            <div className={`h-full w-full overflow-auto`}>
              <div className={`text-sm md:text-base text-justify w-full h-full px-1 pb-10`}>
                <div className={`flex flex-col space-y-1 pt-1 text-neutral-600`}>
                  {
                    loadedVerses.map(({ sno, vno, verse, c, ns }, index) => {
                      const isbesmele = parseInt(sno) !== 1 && parseInt(sno) !== 9 && parseInt(vno) === 1;
                      let hastobe;
                      let has;
                      let letters = [];
                      let countsObj = {};
                      // Determine which list the current Surah belongs to
                      if (almlist.includes(sno)) {
                        letters = ['م', 'ل', 'ا'];
                        countsObj = alm[sno];

                      } else if (alrlist.includes(sno)) {
                        letters = ['ر', 'ل', 'ا']; // 'ر' is the Arabic letter 'R'
                        countsObj = alr[sno];

                      } else if (almrlist.includes(sno)) {
                        letters = ['ر', 'م', 'ل', 'ا'];
                        countsObj = almr[sno];

                      } else if (almslist.includes(sno)) {
                        letters = ['ص', 'م', 'ل', 'ا'];
                        countsObj = alms[sno];

                      } else if (khyaslist.includes(sno)) {
                        letters = ['ص', 'ع', 'ي', 'ه', 'ك'];
                        countsObj = khyas[sno];

                      } else if (yslist.includes(sno)) {
                        letters = ['س', 'ي'];
                        countsObj = ys[sno];

                      } else {
                        // If the Surah is not in either list, we don't proceed
                        letters = [];
                        countsObj = {};
                      }

                      if (checkHM && formula) {

                        // Initialize expected and actual counts
                        const ht_counts = {};
                        const actual_counts = {};

                        // Calculate expected and actual counts for each letter
                        letters.forEach((letter) => {
                          // Expected counts from 'countsObj'
                          ht_counts[letter] = countsObj?.[letter]?.[vno] || 0;

                          // Actual counts from 'c'
                          if (letter === 'ا') {
                            // For Alif, sum both Hamza (ء) and Alif (ا)
                            actual_counts['ا'] = (c['ء'] || 0) + (c['ا'] || 0);
                          } else {
                            actual_counts[letter] = c[letter] || 0;
                          }
                        });

                        // Define color classes for styling
                        const over = 'text-rose-600';
                        const under = 'text-orange-500';
                        const equal = 'text-green-500/40';

                        // Create JSX elements with conditional styling
                        hastobe = (
                          <span className="text-neutral-400">
                            {letters.map((letter) => (
                              <span key={`ht-${letter}`}>
                                {letter}: {ht_counts[letter]}{' '}
                              </span>
                            ))}
                          </span>
                        );

                        has = (
                          <span className="text-neutral-400">
                            {letters.map((letter) => (
                              <span key={`has-${letter}`}>
                                {letter}:{' '}
                                <span
                                  className={
                                    actual_counts[letter] > ht_counts[letter]
                                      ? over
                                      : actual_counts[letter] < ht_counts[letter]
                                        ? under
                                        : equal
                                  }
                                >
                                  {actual_counts[letter]}
                                </span>{' '}
                              </span>
                            ))}
                          </span>
                        );
                      }

                      return (
                        <div
                          ref={index === loadedVerses.length - 1 ? lastVerseElementRef : null}
                          key={`verse-${sno}:${vno}-index`}
                        >
                          {isbesmele && !filter && (
                            <div className="text-start w-full flex justify-between space-x-1 mb-1">
                              <div className="w-full p-2 rounded shadow-md bg-gradient-to-r from-cyan-400 to-neutral-950 text-neutral-100">
                                <div className="flex w-full space-x-2">
                                  <div dir="ltr" className="text-neutral-900">
                                    {sno}:{0}
                                  </div>
                                  <div dir="rtl" className="w-full">
                                    {lightMatchWords(besmele)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="text-start w-full flex justify-between space-x-1">
                            <div
                              onClick={() => handleSelectedVerse(sno, vno)}
                              className={`w-full p-1 rounded shadow-md cursor-pointer ${selectedSura === sno && selectedVerse === vno
                                ? 'bg-sky-900 ring-1 ring-sky-200'
                                : 'bg-neutral-900'
                                }`}
                            >
                              <div className="flex w-full space-x-1.5">
                                <div dir="ltr" className="text-sky-500 flex flex-col h-full justify-between w-1/6">
                                  {sno}:{vno}
                                  <div className='text-nowrap text-neutral-400'>{formatDivisible(ns)}</div>
                                </div>
                                <div dir="rtl" className="w-3/4">
                                  {lightMatchWords(verse)}
                                </div>

                                <div
                                  dir="ltr"
                                  className="text-amber-400/70 text-sm flex items-center justify-center w-10"
                                >
                                  {index + 1}
                                </div>
                                {checkHM && (
                                  <div
                                    dir="ltr"
                                    className="w-1/3 flex flex-col space-y-1 text-base"
                                  >
                                    <div className="flex w-full items-center justify-between p-2 bg-neutral-950 rounded ">
                                      <div className="text-neutral-500 text-xs">{`HAS TO BE`}</div>
                                      <div dir="rtl">{hastobe}</div>
                                    </div>
                                    <div className="flex w-full items-center justify-between p-2 bg-neutral-950 rounded ">
                                      <div className="text-neutral-500 text-xs">{`HAS`}</div>
                                      <div dir="rtl">{has}</div>
                                    </div>
                                  </div>
                                )}
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
          <div className="col-span-2 row-span-5 lg:col-span-1 lg:row-span-8 w-full h-full flex flex-col space-y-1 ">
            <div className="flex w-full lg:px-0.5">
              <div className="rounded w-full text-lg md:text-xl lg:text-2xl shadow-lg shadow-neutral-800 text-center px-2 py-1.5 bg-neutral-400 text-neutral-900 flex justify-between ">

                <div className={`flex items-center space-x-2 w-2/3 lg:w-3/4 justify-between`}>
                  <div>Formula:</div>
                  <input
                    type="text"
                    disabled={filter}
                    className=" w-full p-0.5 px-2 text-start bg-neutral-500/80 rounded shadow-inner placeholder:text-neutral-100/50"
                    value={formula || ''}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder={`${selectedVerse ? `${selectedSura}:${selectedVerse}` : `formula e.g. 3:18 33:7 33:40`}`}
                  />
                </div>
                <div className={`flex items-center w-1/2 pl-2`}>
                  <button className={`flex justify-center`} onClick={() => setCheckHM(!checkHM)}>
                    {checkHM ?
                      (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                      </svg>)
                      :
                      (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>)}
                  </button>

                  <button className={`flex justify-center`} onClick={() => setFilter(null)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className=" w-full flex items-center space-x-2">
                    <div>Filter:</div>
                    <input
                      type="text"
                      dir={`rtl`}
                      className=" w-full p-0.5 px-2 text-start bg-neutral-500/80 rounded shadow-inner placeholder:text-neutral-100/50"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder={`N / A`}
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className={`overflow-auto h-full w-full pt-2 pr-0.5 pl-1`}>
              {selectedVerse ?
                (
                  <VerseDetail
                    quranMap={quranMap}
                    handleSelectedWord={handleSelectedWord}
                    filter={filter}
                    selectedLetters={selectedLetters}
                    arabicLetterValues={arabicLetterValues}
                    surano={selectedSura}
                    verseno={selectedVerse}
                  />
                ) : (
                  formula !== '' && (
                    <div className="flex flex-col space-y-2 ">
                      {loadedVerseDetails.map(({ sno, vno, verse }, index) => (
                        <div
                          ref={index === loadedVerseDetails.length - 1 ? lastVerseDetailElementRef : null}
                          key={`${sno}-${vno}-detail`}>
                          <VerseDetail
                            quranMap={quranMap}
                            handleSelectedWord={handleSelectedWord}
                            filter={filter}
                            selectedLetters={selectedLetters}
                            arabicLetterValues={arabicLetterValues}
                            surano={sno}
                            verseno={vno}
                            single={false}
                          />
                        </div>
                      ))}
                    </div>
                  ))
              }

            </div>
          </div>
        </div>
        <div className={`col-span-2 row-span-2 w-full h-full bg-neutral-600 relative `}>
          <div dir={'ltr'} className={`h-full w-full flex flex-wrap p-0.5 gap-0.5 absolute select-none `}>
            {arabicLetters.map((letter, index) => (
              <div
                key={`${index}${letter}`}
                onClick={() => toggleLetterSelection(letter)}
                className={`relative grow rounded cursor-pointer flex flex-col justify-between py-1 transition-transform ${selectedLetters.includes(letter) ? `-translate-y-7 ring-1 ring-sky-500` : ``}  ${lc[letter] ? `bg-neutral-900` : `bg-neutral-800/50`}  ${isDivisible(factor, lc[letter]) || (isDivisible(factor, sosl) && selectedLetters.includes(letter)) ? `border-t-4 border-sky-500` : ``}  `}
                dir="rtl">
                <div className={`text-lg md:text-xl lg:text-3xl min-w-6 w-full flex items-center md:items-end justify-center  ${lc[letter] ? ` brightness-100` : ` brightness-50`}`} style={{ color: colorMap[letter] }}>
                  {letter}
                </div>
                {isDivisible(factor, lc[letter]) &&
                  <div dir="ltr" className={`absolute whitespace-pre-line -top-8 left-0 text-xs text-nowrap w-full py-1  rounded text-neutral-950 ${selectedLetters.includes(letter) ? `bg-sky-500` : `bg-sky-500/40`}`}>
                    {formatDivisibleOnlyMultiplier(lc[letter])}
                  </div>
                }
                <div className={`text-xs w-full ${lc[letter] ? `text-neutral-100` : `text-neutral-500`} `}>
                  {lc[letter] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
        {isDivisible(factor, sosl) ?
          (<div className={`absolute z-20 text-3xl bg-sky-500 p-3 rounded-lg bottom-36 lg:bottom-28 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex select-none items-center justify-center shadow-lg shadow-black`}>
            {formatDivisible(sosl)}
          </div>) :
          (
            <div className={`absolute z-20 text-2xl bg-neutral-500 p-3 rounded-lg top-6 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex select-none items-center justify-center shadow-lg shadow-black`}>
              {sosl}
            </div>)}
      </div>
    </div>
  );
}

export default Dev;