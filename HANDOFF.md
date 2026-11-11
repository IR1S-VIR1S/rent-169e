# 169-E Rent: hand-over notes

- Phone app: this folder (GitHub Pages). Build from the private working copy with `node app/build.js`.
- Sheet: Loader.gs + appsscript.json pasted once into the Sheet's Apps Script. Menu "Install update" downloads `script/Rent.gs` from this repo.
- No rent data lives here. Payment history was imported into the owner's Sheet by version 1.x and is not in any published file.

| Version | App build | What changed | Tests |
|---|---|---|---|
| Script 2.1 | 66816356 | Tenant page (private link, this year only); balance picture; receipt in reminder layout with PAID stamp; arrears switch in pictures and text; Face ID unlock; Lahore and Madrid clocks; maintenance note; sync and typing fixes | script 124/124, loader 22/22, phone 68/68 x6 |
| Script 2.0 | 39aca701 | Loader updates; Arabic greeting/closing, "Bhai"; due by the 3rd, late after the 10th; maintenance claims; contact log with red flags; EME visit timer; receipt photos in Drive; tenant WhatsApp number; receipt, reminder, statement and log pictures | script 101/101, loader 22/22, phone 48/48 x3 |
| Script 1.1 | 8727e14e | Pairing uses the pasted /exec address; logo | script 71/71, phone 37/37 |
| Script 1.0 | 152fc8a4 | First version | script 66/66, phone 35/35 |

Not verified on a real iPhone: Face ID (tested with a virtual authenticator), photo picking from Photos/camera, share sheet to WhatsApp, Arabic font in pictures (Geeza Pro expected).
