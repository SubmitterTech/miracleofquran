import re
import xml.etree.ElementTree as ET
import json
import sys
from pyarabic.araby import (
    strip_lastharaka,   # remove *only* the final vowel mark (tanwīn or ḥaraka)
    strip_tatweel,      # remove kashīda/tatwīl strokes “ـ” used for elongation
    strip_tashkeel,     # remove all vocalization marks: fatḥa, ḍamma, kasra, shadda, sukun, tanwīn
    strip_harakat,      # remove vowels & tanwīn, but **leave** shadda (gemination mark)
    strip_diacritics    # remove *every* combining mark, including small-alef, shadda, vowels, Qur’anic annotations
)

# Qur’ānic annotation/decorative signs (small-high letters, end-of-verse markers, etc.)
QURANIC_ANNOT = re.compile(r'[\u06D6-\u06ED]')

# Mapping all special alifs to plain ا
ALIF_VARIANTS = {
    '\u0622',  # ALEF_MADDA_ABOVE “آ”
    '\u0623',  # ALEF_HAMZA_ABOVE “أ”
    '\u0625',  # ALEF_HAMZA_BELOW “إ”
    '\u0671',  # ALEF_WASLA “ٱ”
}
BARE_ALIF = '\u0627'  # plain “ا”

def normalize_arabic(text: str) -> str:
    """
    Perform a series of Arabic text normalizations to:
      1) Convert combining hamza-above to a standalone hamza.
      2) Strip decorative elongation (tatwīl).
      3) Remove all vowel and diacritic marks.
      4) Remove Qur’anic annotation symbols.
      5) Collapse all alif variants to the bare letter ا.
    """

    # === Step 0: Normalize combining hamza-above ===
    # In Uthmani script, hamza-above can appear as a combining mark (0654).
    # Turn it into a real hamza character (0621) so it survives other stripping.
    #
    #   before: "ـٔ"   (tatwīl + combining hamza)
    #   after : "ـء"
    text = text.replace('\u0654', '\u0621')

    # === Step 1: strip only the last haraka ===
    # Removes one final vowel/tanwīn if present.
    #   "كتابٌ"      → "كتاب"
    #   "مَدرَسَةٌ"  → "مَدرَسَة"
    text = strip_lastharaka(text)

    # === Step 2: strip tatwīl (elongation strokes) ===
    # Deletes every “ـ” character, purely decorative.
    #   "العــــربية" → "العربية"
    text = strip_tatweel(text)

    # === Step 3: strip all tashkīl marks ===
    # Drops every vocalization and shadda:
    #   "مُحَمَّدْ" → "محمد"
    text = strip_tashkeel(text)

    # === Step 4: strip only harakāt (vowels & tanwīn), keep shadda ===
    # If you want to preserve gemination marks (ّ) but drop simple vowels:
    #   "مُحَمَّد" → "محمدّ"
    text = strip_harakat(text)

    # === Step 5: strip every remaining diacritic ===
    # Removes any small-alef, leftover Qur’anic marks, etc.
    #   "الرّحْمٰن" → "الرحمن"
    text = strip_diacritics(text)

    # === Step 6: remove Qur’anic annotation symbols ===
    # Clears glyphs like ۞, ۝, etc., in the range U+06D6–U+06ED
    text = QURANIC_ANNOT.sub('', text)

    # === Step 7: collapse all alif variants to bare alif ===
    # Ensures consistency: 
    #   “آ”/“أ”/“إ”/“ٱ” → “ا”
    for variant in ALIF_VARIANTS:
        text = text.replace(variant, BARE_ALIF)

    return text

def parse_quran(xml_path: str) -> dict:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    quran = {}
    for sura in root.findall('sura'):
        si = sura.get('index')
        verses = {}
        for aya in sura.findall('aya'):
            ai   = aya.get('index')
            txt  = aya.get('text', '')
            verses[ai] = normalize_arabic(txt)
        quran[si] = verses
    return quran

def main():
    xml_in   = sys.argv[1] if len(sys.argv) > 1 else 'quran-uthmani.xml'
    json_out = sys.argv[2] if len(sys.argv) > 2 else 'quran.json'

    data = parse_quran(xml_in)
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'✓ Written stripped output to {json_out}')

if __name__ == '__main__':
    main()
