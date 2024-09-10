import colorMap from '../utils/ColorMap';

const VerseDetail = ({ quranMap, handleSelectedWord, filter, selectedLetters, arabicLetterValues, surano, verseno, single = true }) => {


    return (
        <div className={`flex flex-col space-y-1 px-1 rounded border border-black relative w-full mx-1`}>
            {/* <div
                    key={"tselected_" + surano + ":" + verseno}
                    className="w-full p-2 px-3 rounded shadow-lg bg-neutral-800 text-start"
                    dir="ltr">
                    {tquranMap && tquranMap[surano] && tquranMap[surano][verseno]?.toString()}
                  </div> */}

            <div className={`absolute -top-2 -left-1 z-10 rounded px-1 border border-black text-sm bg-neutral-600`}>
                {surano + `:` + verseno}
            </div>
            <div dir="rtl" className={`w-full flex ${single ? `flex-wrap` : `overflow-x-auto pb-4`} items-center justify-start rounded pt-1`}>
                {quranMap && quranMap[surano] && quranMap[surano][verseno]?.split(' ').map((word, index) => (
                    <div
                        onClick={() => handleSelectedWord(word.trim())}
                        key={surano + verseno + index + word}
                        className={`p-0.5 rounded text-start ml-1.5 mb-1.5 cursor-pointer ${filter === word.trim() ? "bg-sky-300 text-neutral-900 " : "bg-sky-800 shadow-md shadow-neutral-900 "}`}
                        dir="rtl">
                        <div className={`px-1 text-lg w-full text-center font-semibold ${filter === word.trim() ? "text-orange-600 " : "text-amber-400  "}`}>
                            {index + 1}
                        </div>
                        <div className={`p-1.5 w-full `} >
                            {word}
                        </div>
                    </div>
                ))}
            </div>
            <div dir="rtl" className={`w-full flex ${single ? `flex-wrap` : `overflow-x-auto pb-4`} items-center justify-start rounded pt-0.5`}>
                {quranMap && quranMap[surano] && quranMap[surano][verseno]?.split('').reduce((acc, letter, index) => {
                    const isSpace = letter === ' ';
                    const displayIndex = isSpace ? null : acc.currentIndex + 1;

                    acc.currentIndex = isSpace ? acc.currentIndex : displayIndex;

                    acc.elements.push(
                        <div
                            key={`${surano}${verseno}${index}${letter}`}
                            className={`p-0.5 rounded ml-0.5 mb-1 ${isSpace ? `w-3` : ` bg-neutral-900 ${selectedLetters.includes(letter) ? `ring-sky-500 ring-2` : ``}`}  flex flex-col items-center`}
                            dir="rtl"
                        >
                            {/* Show the index only if the letter is not a space */}
                            {displayIndex && (
                                <div className={`p-1 w-full text-base`}>
                                    {displayIndex}
                                </div>
                            )}
                            {/* Show the letter or an empty div for spaces */}
                            <div className={` text-2xl h-full w-9 mb-2 flex items-center justify-center`} style={{ color: colorMap[letter] }}>
                                {letter}
                            </div>

                            {displayIndex && (
                                <div className={`px-0.5 pt-0.5 text-sm w-full rounded bg-neutral-400/60 text-neutral-900 shadow-neutral-950 shadow-inner`} >
                                    {arabicLetterValues[letter]}
                                </div>
                            )}
                        </div>
                    );

                    return acc;
                }, { currentIndex: 0, elements: [] }).elements}
            </div>

        </div>

    );
};

export default VerseDetail;