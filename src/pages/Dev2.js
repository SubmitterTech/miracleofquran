import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import quranUtmani from '../assets/quran.json';
import counts from '../assets/counts.json';
import '../App.css';
import colorMap from '../utils/ColorMap';
import VerseDetail from '../components/VerseDetail';

function Dev2() {
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

    const letterMapping = useMemo(() => ({
        ALM: ['م', 'ل', 'ا'],
        ALR: ['ر', 'ل', 'ا'],
        ALMR: ['ر', 'م', 'ل', 'ا'],
        ALMS: ['ص', 'م', 'ل', 'ا'],
        KHYAS: ['ص', 'ع', 'ي', 'ه', 'ك'],
        YS: ['س', 'ي'],
        Q: ['ق'],
        HMASQ: ['ح', 'م', 'ع', 'س', 'ق'],
        N: ['ن'],
    }), []);

    const snoMap = useMemo(() => {
        const m = {};
        Object.entries(letterMapping).forEach(([groupKey, letters]) => {
            const groupCounts = counts[groupKey] || {};
            Object.entries(groupCounts).forEach(([snoKey, letterCounts]) => {
                m[snoKey] = { letters, counts: letterCounts };
            });
        });
        return m;
    }, [ letterMapping]);

    const [checkHM, setCheckHM] = useState(true);
    const [isExactMatchEnabled, setIsExactMatchEnabled] = useState(false);

    const [selectedLetters, setSelectedLetters] = useState([]);

    const toggleLetterSelection = (letter) => {
        setSelectedLetters((prevSelected) =>
            prevSelected.includes(letter)
                ? prevSelected.filter((l) => l !== letter)
                : [...prevSelected, letter]
        );
    };

    const specialCount = (letter, c) => {
        if (letter === 'ا') return ((c['ء'] || 0) + (c['ا'] || 0));
        if (letter === 'ي') return ((c['ى'] || 0) + (c['ي'] || 0) + (c['ئ'] || 0));
        if (letter === 'ه') return ((c['ه'] || 0) + (c['ة'] || 0));
        return c[letter] || 0;
    };

    const arabicLetterValues = useMemo(() =>
    ({
        'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
        'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
        'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900,
        'غ': 1000,
        'ء': 1, 'ئ': 10, 'ى': 10, 'ة': 5, 'ؤ': 6
    }), []);

    const arabicLetters = [
        'ا', 'ء',
        'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'ة', 'و', 'ؤ',
        'ى', 'ئ', 'ي'
    ];

    useEffect(() => {

        setQuranMap(quranUtmani);
    }, []);

    function getRegex(f) {
        const sunLetters = 'تثدذرزسشصضطظن';
        return new RegExp(`(?<![${sunLetters}])(${f})(?![\\u0600-\\u06FF${(f?.slice(-1) === 'ه' || f?.slice(-1) === 'ن') ? '' : '&&[^ا]'}])`, 'g');
    }


    const besmele = (quranMap && quranMap['1']) ? quranMap['1']['1'] : null;
    const verseText = (quranMap && quranMap[selectedSura] && quranMap[selectedSura][selectedVerse]) || '';

    const lc = useMemo(() => {
        if (selectedVerse !== null) {
            return verseText.split('').reduce((counts, letter) => {
                if (letter !== ' ') {
                    counts[letter] = (counts[letter] || 0) + 1;
                }
                return counts;
            }, {});
        }
        // Helper function to count letters
        const countLetters = (text) => {
            return text.split('').reduce((counts, letter) => {
                if (letter !== ' ') {
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
        const getLetterCounts = verse =>
            verse.split('').reduce((counts, l) => {
                if (l !== ' ') counts[l] = (counts[l] || 0) + 1;
                return counts;
            }, {});

        const getLetterNumericSum = verse =>
            [...verse].reduce((sum, ch) => sum + (arabicLetterValues[ch] || 0), 0);

        const isLost = (letters, countsMap, vno, actualCounts) =>
            letters.some(letter =>
                specialCount(letter, actualCounts) !== (countsMap[letter]?.[vno] || 0)
            );

        // Main scan
        const verseList = [];
        let count = 0;
        let exactCount = 0;

        for (const [sno, content] of Object.entries(quranUtmani)) {
            const entry = snoMap[sno];
            for (const [vno, verse] of Object.entries(content)) {
                const c = getLetterCounts(verse);
                const ns = getLetterNumericSum(verse);

                if (checkHM) {
                    if (entry && isLost(entry.letters, entry.counts, vno, c)) {
                        verseList.push({ sno, vno, verse, c, ns });
                    }

                } else if (filter) {
                    const regex = getRegex(filter);
                    const matches = verse.match(regex) || [];
                    const hc = matches.length;

                    if (isExactMatchEnabled) {
                        const ec = verse
                            .split(/\s+/)
                            .filter(w => w.trim().toLowerCase() === filter.toLowerCase())
                            .length;

                        if (ec > 0) {
                            count += hc;
                            exactCount += ec;
                            verseList.push({ sno, vno, verse, hc, ec, c, ns });
                        }
                    } else if (hc > 0) {
                        count += hc;
                        verseList.push({ sno, vno, verse, hc, c, ns });
                    }

                } else if (formula.trim() !== '') {
                    const sn = +sno, vn = +vno;
                    formula.trim().split(' ').forEach(f => {
                        const [s, vr] = f.split(':');
                        const entryExists = verseList.some(v => v.sno === sno && v.vno === vno);

                        if (!entryExists && vr !== undefined) {
                            if (vr === '' && sn === +s) {
                                verseList.push({ sno, vno, verse, hc: 0, c, ns });

                            } else if (vr.includes('-')) {
                                const [start, end] = vr.split('-').map(Number);
                                const okStart = start === 0 ? sn <= end : sn === +s && vn >= start;
                                const okEnd = end === 0 ? vn >= start : sn === +s && vn <= end;
                                if (okStart && okEnd) {
                                    verseList.push({ sno, vno, verse, hc: 0, c, ns });
                                }

                            } else if (sn === +s && vn === +vr) {
                                verseList.push({ sno, vno, verse, hc: 0, c, ns });
                            }
                        }
                    });

                } else {
                    verseList.push({ sno, vno, verse, hc: 0, c, ns });
                }
            }
        }

        setOcc(count);
        if (filter) {
            console.log('----------------------------');
            console.log(
                verseList.map(v => `* ${v.sno}:${v.vno.trim()}`).join('\n'),
                `\n${exactCount} EXACT MATCH`,
                `\n${count} TOTAL`
            );
        }
        setFilteredVerses(verseList);

    }, [
        filter,
        formula,
        arabicLetterValues,
        checkHM,
        isExactMatchEnabled,
        snoMap
    ]);


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
            return verse; // No highlights needed
        }

        // =========================
        // HELPER: highlightLetters
        // =========================
        const highlightLetters = (text, baseColor, parentIndex = 0) => {
            return text.split('').map((char, charIndex) => {
                if (selectedLetters.includes(char)) {
                    return (
                        <span key={`${parentIndex}-${charIndex}`} style={{ color: colorMap[char] }}>
                            {char}
                        </span>
                    );
                } else {
                    return (
                        <span key={`${parentIndex}-${charIndex}`} style={{ color: baseColor }}>
                            {char}
                        </span>
                    );
                }
            });
        };

        // Check if the filter has more than one word
        const filterWords = filter !== null ? filter.trim().split(/\s+/) : [];
        const isMultiWordFilter = filterWords.length > 1;

        if (isMultiWordFilter) {
            // ==============================================================
            // MULTI-WORD FILTER LOGIC (MODIFIED TO DISTINGUISH EXACT vs PARTIAL)
            // ==============================================================
            const parts = [];
            let lastIndex = 0;

            // If you need case-insensitive matching, use /.../gi instead of /.../g
            const regex = new RegExp(filter, 'g');

            verse.replace(regex, (match, offset) => {
                // Push text before this match (per-letter highlighting)
                const beforeMatch = verse.slice(lastIndex, offset);
                if (beforeMatch) {
                    parts.push(highlightLetters(beforeMatch, '', `before-${offset}`));
                }

                // ---- DETERMINE EXACT vs PARTIAL MATCH ----
                const isStartBoundary =
                    offset === 0 || /\s/.test(verse[offset - 1]);
                const isEndBoundary =
                    offset + match.length === verse.length || /\s/.test(verse[offset + match.length] || '');

                // "Exact" means the match is surrounded by whitespace or start/end of string
                const isExactMatch = isStartBoundary && isEndBoundary;

                // Highlight color:
                // - EXACT MATCH => BLUE (#0ea5e9)
                // - PARTIAL MATCH => GREEN (#22c55e)
                const highlightColor = isExactMatch ? '#0ea5e9' : '#22c55e';

                // Highlight the matched substring (per-letter as well)
                parts.push(highlightLetters(match, highlightColor, `match-${offset}`));

                lastIndex = offset + match.length;
                return match;
            });

            // Push leftover text after the last match
            if (lastIndex < verse.length) {
                const remainder = verse.slice(lastIndex);
                if (remainder) {
                    parts.push(highlightLetters(remainder, '', `after-${lastIndex}`));
                }
            }

            return <div dir="rtl">{parts}</div>;

        } else {
            // ==============================================================
            // SINGLE-WORD FILTER LOGIC (YOUR ORIGINAL WORD-BY-WORD APPROACH)
            // ==============================================================
            const words = verse.split(/(\s+)/).map((word, index) => {
                const wordContainsSelectedLetter = selectedLetters.some((letter) =>
                    word.includes(letter)
                );

                // EXACT MATCH
                if (word === filter) {
                    return highlightLetters(word, '#0ea5e9', index); // Blue
                }
                // PARTIAL/STEM MATCH
                else if (word.includes(filter) || (word + ' ').includes(filter) || (' ' + word).includes(filter)) {
                    return highlightLetters(word, '#22c55e', index); // Green
                }
                // WORD CONTAINS A SELECTED LETTER (but no filter match)
                else if (wordContainsSelectedLetter) {
                    return highlightLetters(word, '', index);
                }
                // NO MATCH AT ALL
                else {
                    return <span key={index}>{word}</span>;
                }
            });

            return <div dir="rtl">{words}</div>;
        }
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
        } else {
            setSosl(0);
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
                                <div className={`flex flex-col space-y-1 pt-1 pb-12 text-neutral-600`}>
                                    {
                                        loadedVerses.map(({ sno, vno, verse, c, ns }, index) => {
                                            const isbesmele = parseInt(sno) !== 1 && parseInt(sno) !== 9 && parseInt(vno) === 1;
                                            //let hastobe;
                                            let has;
                                            const entry = snoMap[sno] || { letters: [], counts: {} };
                                            const letters = entry.letters;
                                            const countsObj = entry.counts;        // { '1':42, '2':13, … }
                                            const hasHM = letters.length > 0;

                                            if (formula) {

                                                // Initialize expected and actual counts
                                                const ht_counts = {};
                                                const actual_counts = {};

                                                // Calculate expected and actual counts for each letter
                                                letters.forEach(letter => {
                                                    // Expected count for this letter & verse
                                                    ht_counts[letter] = countsObj?.[letter]?.[vno] || 0;

                                                    // Actual count using the new specialCount logic
                                                    actual_counts[letter] = specialCount(letter, c);
                                                });

                                                // Define color classes for styling
                                                const over = 'text-rose-600 text-xl';
                                                const under = 'text-amber-400 text-xl';
                                                //const equal = 'text-green-400/50';


                                                // hastobe = (
                                                //  <span className="text-neutral-500">
                                                //    {letters.map((letter) => (
                                                //      <span key={`ht-${letter}`}>
                                                //        {letter}: {ht_counts[letter]}{' '}
                                                //      </span>
                                                //    ))}
                                                //  </span>
                                                //); 

                                                has = (() => {
                                                    const allEqual = letters.every((letter) => actual_counts[letter] === ht_counts[letter]);
                                                    // If all are equal, return a single OK logo
                                                    if (allEqual && Object.keys(ht_counts).length > 0) {
                                                        return (
                                                            <svg
                                                                className="w-7 h-7 text-emerald-500"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                viewBox="0 0 24 24"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        );
                                                    }

                                                    // Otherwise, show over/under letters only
                                                    return (
                                                        <span className="text-neutral-400">
                                                            {letters
                                                                .filter((letter) => actual_counts[letter] !== ht_counts[letter])
                                                                .map((letter) => {
                                                                    const countClass = actual_counts[letter] > ht_counts[letter] ? over : under;

                                                                    return (
                                                                        <span key={`has-${letter}`} className={`text-2xl`}>
                                                                            {letter}
                                                                            <span dir={'ltr'} className={`text-xs`}>
                                                                                {'(' + ht_counts[letter] + ')'}
                                                                            </span>
                                                                            :{' '}
                                                                            <span dir={'ltr'} className={countClass}>
                                                                                {(actual_counts[letter] - ht_counts[letter]) > 0 ? `+` + (actual_counts[letter] - ht_counts[letter]) : actual_counts[letter] - ht_counts[letter]}
                                                                            </span>
                                                                            {' '}
                                                                        </span>
                                                                    );
                                                                })}
                                                        </span>
                                                    );
                                                })();
                                            }
                                            return (
                                                <div ref={index === loadedVerses.length - 1 ? lastVerseElementRef : null} key={`verse-${sno}:${vno}-index`}>
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
                                                        <div className={`w-full rounded shadow-md  ${selectedSura === sno && selectedVerse === vno ? 'bg-neutral-950 ring-1 ring-neutral-100' : 'bg-neutral-950'}`}>
                                                            <div className="flex w-full space-x-1.5 h-full items-center">
                                                                <div
                                                                    onClick={() => handleSelectedVerse(sno, vno)}
                                                                    dir="ltr" className="text-sky-500 flex flex-col h-full justify-between w-1/6 p-1 cursor-pointer bg-neutral-900 rounded-l">
                                                                    {sno}:{vno}
                                                                    <div className='text-nowrap text-sm text-neutral-400'>{formatDivisible(ns)}</div>
                                                                </div>
                                                                <div dir="rtl" className={` ${hasHM > 0 ? `w-3/4` : `w-full p-1.5`}  p-1 cursor-auto`}>
                                                                    {lightMatchWords(verse)}
                                                                </div>

                                                                {/* <div dir="ltr" className="text-teal-400/70 text-sm flex items-center justify-center w-10">
                                  {index + 1}
                                </div> */}

                                                                {hasHM > 0 && <div dir="ltr" className={`min-w-24 flex flex-col text-sm `}>
                                                                    {/* <div className="flex w-full items-center justify-between p-2 bg-neutral-950 rounded text-nowrap space-x-1">
                                    <div className="text-neutral-500 text-xs ">{`TO BE`}</div>
                                    <div dir="rtl">{hastobe}</div>
                                  </div> */}
                                                                    <div className="flex w-full items-center justify-between p-1.5 h-full text-nowrap border-l border-neutral-600">
                                                                        {/* <div className="text-neutral-500 text-xs">{`HAS`}</div> */}
                                                                        <div className={`w-full text-base flex justify-center px-1`} dir="rtl">{has}</div>
                                                                    </div>
                                                                </div>
                                                                }
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
                                            (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8`}>
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
                                            value={filter === null ? '' : filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                            placeholder={`N / A`}
                                        />
                                    </div>
                                    <button className={`flex justify-center`} onClick={() => setIsExactMatchEnabled(!isExactMatchEnabled)}>
                                        {isExactMatchEnabled ?
                                            (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8`}>
                                                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                                            </svg>)
                                            :
                                            (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                            </svg>)}
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div className={`overflow-auto h-full w-full pt-2 pr-0.5 pl-1 pb-14`}>
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
                                        lightMatchWords={lightMatchWords}
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
                                                        lightMatchWords={lightMatchWords}
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
                <div className={`col-span-2 row-span-2 w-full h-full bg-neutral-600 relative z-50`}>
                    <div dir={'ltr'} className={`h-full w-full flex flex-wrap p-0.5 gap-0.5 absolute `}>
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
                                    <div dir="ltr" className={`absolute whitespace-pre-line -top-8 left-0 text-xs text-nowrap w-full py-1  rounded text-neutral-950 ${selectedLetters.includes(letter) ? `bg-sky-500` : `bg-sky-500/90`}`}>
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
                    (<div className={`absolute z-10 text-3xl bg-sky-500 p-3 rounded-lg bottom-36 lg:bottom-28 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex select-none items-center justify-center shadow-lg shadow-black`}>
                        {formatDivisible(sosl)}
                    </div>) :
                    (sosl > 0 &&
                        <div className={`absolute z-10 text-xl bg-neutral-500 px-2 py-1.5 rounded-lg top-6 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex select-none items-center justify-center shadow-md shadow-black`}>
                            {sosl}
                        </div>)}
            </div>
        </div>
    );
}

export default Dev2;