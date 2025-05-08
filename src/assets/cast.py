import xml.etree.ElementTree as ET
import json
import sys

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
            verses[ai] = txt
        quran[si] = verses
    return quran

def main():
    xml_in   = sys.argv[1] if len(sys.argv) > 1 else 'quran-uthmani.xml'
    json_out = sys.argv[2] if len(sys.argv) > 2 else 'quranwithdiacritics.json'

    data = parse_quran(xml_in)
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'✓ Written stripped output to {json_out}')

if __name__ == '__main__':
    main()
