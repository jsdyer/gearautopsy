"""Validate the curated FCC exhibit metadata and build Gear Autopsy."""
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / 'data/devices.json').read_text())
seen = set()
kinds = {'Internal photos', 'External photos', 'Test report', 'User manual'}
for device in source['devices']:
    identity = device['id']
    if not re.fullmatch(r'[A-Z0-9][A-Z0-9-]{3,18}', identity) or identity in seen:
        raise ValueError(f'Unexpected FCC ID: {identity}')
    seen.add(identity)
    index = urlsplit(device['index'])
    if index.scheme != 'https' or index.netloc != 'fccid.io' or index.path != '/' + identity:
        raise ValueError(f'Unverified source: {device["index"]}')
    for exhibit in device['exhibits']:
        mirror = urlsplit(exhibit['mirror'])
        if (not re.fullmatch(r'\d{6,9}', exhibit['id']) or exhibit['kind'] not in kinds
                or mirror.scheme != 'https' or mirror.netloc != 'fccid.io'
                or not mirror.path.startswith('/' + identity + '/')
                or not mirror.path.endswith('-' + exhibit['id'])):
            raise ValueError(f'Unverified exhibit: {exhibit}')
        exhibit['official'] = 'https://apps.fcc.gov/eas/GetApplicationAttachment.html?id=' + exhibit['id']

dist = ROOT / 'dist'
shutil.rmtree(dist, ignore_errors=True)
shutil.copytree(ROOT / 'web', dist)
(dist / 'catalogue.json').write_text(json.dumps(source, ensure_ascii=False, separators=(',', ':')))
(dist / '.nojekyll').touch()
print(f'{len(seen)} devices, {sum(len(item["exhibits"]) for item in source["devices"])} linked exhibits')
