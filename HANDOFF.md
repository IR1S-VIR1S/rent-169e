# 169-E Rent: hand-over notes

- Phone app: this folder (GitHub Pages). Build from the private working copy with `node app/build.js`.
- Sheet: Loader.gs + appsscript.json pasted once into the Sheet's Apps Script. Menu "Install update" downloads `script/Rent.gs` from this repo.
- No rent data lives here. Payment history was imported into the owner's Sheet by version 1.x and is not in any published file.

| Version | App build | What changed | Tests |
|---|---|---|---|
| App only | 73ea54db | Tenant link carries only the deployment id (about 227 to 148 characters); old long links keep working | phone 79/79 x6 |
| App only | 44d2ca84 | Tenant page loads its code from tp/, so an old offline copy of the phone app in the same browser cannot break it (fixed "Can't find variable: ordinal_" in Safari); automatic Face ID no longer clears a message or starts once typing has begun | phone 74/74 x12 |
| Script 2.2 | 52df60e0 | PIN pad with automatic Face ID on opening; tenant page loads with a plain web request, retries, and shows error details; background sync no longer clears a PIN being typed | script 127/127, loader 22/22, phone 74/74 x10 |
| Script 2.1 | 66816356 | Tenant page (private link, this year only); balance picture; receipt in reminder layout with PAID stamp; arrears switch in pictures and text; Face ID unlock; Lahore and Madrid clocks; maintenance note; sync and typing fixes | script 124/124, loader 22/22, phone 68/68 x6 |
| Script 2.0 | 39aca701 | Loader updates; Arabic greeting/closing, "Bhai"; due by the 3rd, late after the 10th; maintenance claims; contact log with red flags; EME visit timer; receipt photos in Drive; tenant WhatsApp number; receipt, reminder, statement and log pictures | script 101/101, loader 22/22, phone 48/48 x3 |
| Script 1.1 | 8727e14e | Pairing uses the pasted /exec address; logo | script 71/71, phone 37/37 |
| Script 1.0 | 152fc8a4 | First version | script 66/66, phone 35/35 |

Not verified on a real iPhone: Face ID (tested with a virtual authenticator), photo picking from Photos/camera, share sheet to WhatsApp, Arabic font in pictures (Geeza Pro expected).
