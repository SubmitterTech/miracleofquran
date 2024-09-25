import json

# Surahs with their initials in Latin letters and corresponding Arabic letters
surah_initials = {
    '2': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '3': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '7': {'initials': 'ALMS', 'letters': ['ا', 'ل', 'م', 'ص']},
    '10': {'initials': 'ALR', 'letters': ['ا', 'ل', 'ر']},
    '11': {'initials': 'ALR', 'letters': ['ا', 'ل', 'ر']},
    '12': {'initials': 'ALR', 'letters': ['ا', 'ل', 'ر']},
    '13': {'initials': 'ALMR', 'letters': ['ا', 'ل', 'م', 'ر']},
    '14': {'initials': 'ALR', 'letters': ['ا', 'ل', 'ر']},
    '15': {'initials': 'ALR', 'letters': ['ا', 'ل', 'ر']},
    '19': {'initials': 'KHYAS', 'letters': ['ك', 'ه', 'ي', 'ع', 'ص']},
    '20': {'initials': 'TH', 'letters': ['ط', 'ه']},
    '26': {'initials': 'TSM', 'letters': ['ط', 'س', 'م']},
    '27': {'initials': 'TS', 'letters': ['ط', 'س']},
    '28': {'initials': 'TSM', 'letters': ['ط', 'س', 'م']},
    '29': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '30': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '31': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '32': {'initials': 'ALM', 'letters': ['ا', 'ل', 'م']},
    '36': {'initials': 'YS', 'letters': ['ي', 'س']},
    '38': {'initials': 'S', 'letters': ['ص']},
    '40': {'initials': 'HM', 'letters': ['ح', 'م']},
    '41': {'initials': 'HM', 'letters': ['ح', 'م']},
    '42': {'initials': 'HMASQ', 'letters': ['ح', 'م', 'ع', 'س', 'ق']},
    '43': {'initials': 'HM', 'letters': ['ح', 'م']},
    '44': {'initials': 'HM', 'letters': ['ح', 'م']},
    '45': {'initials': 'HM', 'letters': ['ح', 'م']},
    '46': {'initials': 'HM', 'letters': ['ح', 'م']},
    '50': {'initials': 'Q', 'letters': ['ق']},
    '68': {'initials': 'N', 'letters': ['ن']}
}

# Function to count occurrences of specified Arabic letters in a verse, treating 'ء' as 'ا'
def count_letters(verse, letters):
    counts = {char: 0 for char in letters}

    # Normalize 'ء' to 'ا' before counting
    verse = verse.replace('ء', 'ا')

    for letter in verse:
        if letter in counts:
            counts[letter] += 1
    return counts

# Function to generate the counts.json file with reorganized structure
def generate_counts_json(data):
    initials_data = {}

    # Fetch the Basmala text (Surah 1, Verse 1)
    basmala_text = ''
    for page_data in data.values():
        if 'sura' in page_data and '1' in page_data['sura']:
            sura1_data = page_data['sura']['1']
            if 'encrypted' in sura1_data and '1' in sura1_data['encrypted']:
                basmala_text = sura1_data['encrypted']['1']
                break

    if not basmala_text:
        print("Error: Basmala text not found in the data.")
        return

    # Iterate through the surahs and their initials
    for page_number, page_data in data.items():
        if 'sura' in page_data:
            for sura_number, info in surah_initials.items():
                initials = info['initials']
                letters = info['letters']
                if sura_number in page_data['sura']:
                    sura_data = page_data['sura'][sura_number]

                    # Initialize the key for these initials if it doesn't exist
                    if initials not in initials_data:
                        initials_data[initials] = {}

                    # Initialize the sura subkey if it doesn't exist
                    if sura_number not in initials_data[initials]:
                        initials_data[initials][sura_number] = {}

                    # Initialize letter subkeys if they don't exist
                    for letter in letters:
                        if letter not in initials_data[initials][sura_number]:
                            initials_data[initials][sura_number][letter] = {}

                    # Count the initials letters in the Basmala text
                    initial_counts = count_letters(basmala_text, letters)
                    for letter, count in initial_counts.items():
                        initials_data[initials][sura_number][letter]["0"] = count

                    # Count letters for the rest of the verses
                    if 'encrypted' in sura_data:
                        for verse_number, verse_text in sura_data['encrypted'].items():
                            counts = count_letters(verse_text, letters)
                            for letter, count in counts.items():
                                initials_data[initials][sura_number][letter][verse_number] = count

    # Write the final data to counts.json
    with open('newcounts.json', 'w', encoding='utf-8') as json_file:
        json.dump(initials_data, json_file, ensure_ascii=False, indent=4)

# Read the qurantft.json file
with open('qurantft.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Generate the counts.json file with the new structure
generate_counts_json(data)

print("counts.json file has been generated.")
