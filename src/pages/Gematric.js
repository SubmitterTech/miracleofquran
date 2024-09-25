import React, { useState, useEffect, useMemo, useCallback } from 'react';
import quranData from '../assets/qurantft.json';

function Gematric() {
    const factor = 19;
    const formula = '1-1';

    const [quranMap, setQuranMap] = useState({});


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

    const getGematricalValue = useCallback((text) => {
        let sum = 0;
        text.split('').forEach((letter) => {
            sum += arabicLetterValues[letter] || 0;
        });
        return sum;
    }, [arabicLetterValues]);

    function addStringNumbers(num1, num2) {
        // Function to add two string numbers manually, digit by digit
        let carry = 0;
        let result = '';

        // Pad the shorter string with leading zeros
        let maxLength = Math.max(num1.length, num2.length);
        num1 = num1.padStart(maxLength, '0');
        num2 = num2.padStart(maxLength, '0');

        // Add each digit from right to left
        for (let i = maxLength - 1; i >= 0; i--) {
            let sum = parseInt(num1[i]) + parseInt(num2[i]) + carry;
            carry = Math.floor(sum / 10);
            result = (sum % 10) + result;
        }

        // If there's a carry left at the end, add it to the result
        if (carry > 0) {
            result = carry + result;
        }

        return result;
    }

    const isDivisible = useCallback((largeNumber) => {
        while (largeNumber.length > 2) {
            // Get the last character (digit) and rest of the number
            let lastDigit = parseInt(largeNumber.slice(-1));  // Last digit as number
            let restOfNumber = largeNumber.slice(0, -1);  // The rest as string

            // Multiply last digit by 2 (this is still small enough to handle directly)
            let lastDigitTimes2 = (lastDigit * 2).toString();

            largeNumber = addStringNumbers(restOfNumber, lastDigitTimes2);
        }

        return parseInt(largeNumber) % factor === 0;
    }, []);


    useEffect(() => {
        if (quranMap) {
            const [ss, se] = formula.includes('-') ? formula.split('-').map(Number) : [1, 1];
            let hugeNumber = '';

            for (let si = ss; si <= se; ++si) {
                let verseNumbers = '';

                //let verseNumSum = 0;
                // verseNumbers += (parseInt(si) !== 1 && parseInt(si) !== 9) ? '0' : '';
                if (quranMap[si]) {
                    Object.keys(quranMap[si]).forEach((vi) => {
                        const verse = quranMap[si][vi];
                        const words = verse.split(' ');
                        //let letterCount = 0;
                        words.forEach((word, i) => {
                            const wordIndex = i + 1;
                            //letterCount += word.split('').length;
                            
                            verseNumbers += vi + wordIndex.toString() + getGematricalValue(word).toString();

                            //console.log(si, verseIndex, wordIndex, word)

                        });
                        //verseNumbers += letterCount + getGematricalValue(verse).toString();
                        //verseNumSum = verseIndex;
                    });
                }
                hugeNumber += si.toString();

                //hugeNumber += verseNumbers + si.toString() + verseNumSum.toString();
                hugeNumber += verseNumbers;

            }
            // hugeNumber += '6234';
            console.log(isDivisible(hugeNumber), hugeNumber.length, hugeNumber);
        }

    }, [quranMap, formula, isDivisible, getGematricalValue]);

    return (
        <div className={`w-full h-screen bg-neutral-900`}>
            <div className={`flex flex-col space-y-2 p-2 text-neutral-400`}>

            </div>
        </div>
    );

};
export default Gematric;