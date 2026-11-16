# Gear Autopsy

A curated finder for FCC Equipment Authorization System exhibits. Search by device, manufacturer or FCC ID and filter exhibit types. Review a device record or export visible exhibit links as CSV.

```sh
python3 scripts/build.py
python3 -m http.server --directory dist 8000
```

The build validates reviewed metadata in `data/devices.json`, creates original FCC document links from verified public exhibit identifiers, and publishes a static JSON index. Records link to the FCC Equipment Authorization System and FCC ID's independent index. Each exhibit has an independent reference for when FCC pages are unavailable. The app does not download, proxy or republish exhibit PDFs, manuals, photographs, or diagrams. Device entries are a selection, with no claim of completeness or continuing availability.

To extend the catalogue, verify the product against the FCC ID on the actual filing and list only public exhibits. Keep document identifiers and source links as supplied. A variant, accessory or later hardware revision may have a different FCC ID. The FCC site refused requests from this environment, so direct FCC originals cannot be smoke-tested here. The independent filing indexes can be used to corroborate identities and exhibit links.
