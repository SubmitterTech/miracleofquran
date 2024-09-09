import json

# Mapping of Arabic letters to their corresponding values
arabic_letter_values = {
    1: 'ا', 2: 'ب', 3: 'ج', 4: 'د', 5: 'ه', 6: 'و', 7: 'ز', 8: 'ح', 9: 'ط',
    10: 'ي', 20: 'ك', 30: 'ل', 40: 'م', 50: 'ن', 60: 'س', 70: 'ع', 80: 'ف', 90: 'ص',
    100: 'ق', 200: 'ر', 300: 'ش', 400: 'ت', 500: 'ث', 600: 'خ', 700: 'ذ', 800: 'ض', 900: 'ظ',
    1000: 'غ',
    # Handle exceptional values for the hamza
    #1301: 'ء',  # handling 'ء' in the data if exists
}

# Function to convert a numeric value to corresponding Arabic letters
def convert_number_to_arabic(num_str):
    arabic_text = ""
    num_len = len(num_str)
    i = 0

    while i < num_len:
        # Look ahead to identify valid multi-digit numbers starting with the largest possible number
        if i + 3 <= num_len and int(num_str[i:i+4]) in arabic_letter_values:
            # Handle four-digit number like 1000
            num_part = int(num_str[i:i+4])
            i += 4
        elif i + 2 <= num_len and int(num_str[i:i+3]) in arabic_letter_values:
            # Handle three-digit number like 100, 200, ..., 900
            num_part = int(num_str[i:i+3])
            i += 3
        elif i + 1 <= num_len and int(num_str[i:i+2]) in arabic_letter_values:
            # Handle two-digit number like 10, 20, ..., 90
            num_part = int(num_str[i:i+2])
            i += 2
        elif int(num_str[i]) in arabic_letter_values:
            # Handle single-digit number like 1, 2, ..., 9
            num_part = int(num_str[i])
            i += 1
        else:
            # If unrecognized number part, warn and move on
            print(f"Warning: Unrecognized number part {num_str[i]} in {num_str}")
            i += 1
            continue

        # Convert the numeric part to Arabic letter
        if num_part in arabic_letter_values:
            arabic_text += arabic_letter_values[num_part]

    return arabic_text


# Function to find the correct page for a given sura:verse
def find_page_for_sura_verse(data, sura, verse):
    for page_number, page_data in data.items():
        if 'sura' in page_data and str(sura) in page_data['sura']:
            sura_data = page_data['sura'][str(sura)]
            if 'verses' in sura_data and str(verse) in sura_data['verses']:
                return page_number
    return None

# Function to process the numeric Quran file and update the quran.json file
def process_numeric_quran_file(filename, data):
    with open(filename, 'r', encoding='latin-1') as file:
        for line in file:
            line = line.strip()
            if not line:
                continue  # Skip empty lines
            
            # Extract sura:verse key and the rest of the numeric content
            sura_verse, *numeric_parts = line.split(' ')
            sura, verse = map(int, sura_verse.strip('()').split(':'))
            
            # Convert each numeric part to Arabic letters
            arabic_parts = [convert_number_to_arabic(part) for part in numeric_parts]
            arabic_text = " ".join(arabic_parts)
            
            # Reverse the final Arabic text to ensure RTL output
            #arabic_text = arabic_text[::-1]
            
            # Find the correct page for this sura and verse
            page_number = find_page_for_sura_verse(data, sura, verse)
            if page_number:
                # Update the corresponding encrypted key in quran.json
                if 'sura' in data[page_number]:
                    sura_data = data[page_number]['sura'].get(str(sura), {})
                    encrypted_data = sura_data.get('encrypted', {})
                    encrypted_data[str(verse)] = arabic_text
                    sura_data['encrypted'] = encrypted_data
                    data[page_number]['sura'][str(sura)] = sura_data
            else:
                print(f"Warning: Could not find page for Sura {sura}, Verse {verse}")

# Read the qurantft.json file
with open('qurantft.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Process the numericquran.txt file and inject the Arabic text into quran.json
process_numeric_quran_file('numericquran.txt', data)

# Write the updated quran.json data to a new file
with open('quran.json', 'w', encoding='utf-8') as new_file:
    json.dump(data, new_file, ensure_ascii=False, indent=4)