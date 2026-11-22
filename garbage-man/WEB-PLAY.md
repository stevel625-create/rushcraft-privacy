# The Garbage Man — offline browser prototype

This package contains the 23-scene manuscript adaptation and recurring route game. It is a browser build, not an APK, signed iPhone app or store release. Real payments are disabled.

## Play

The `web/` folder must be served by a static web server. Double-clicking `index.html` as a local file is not supported.

For a local computer preview with Python 3:

```sh
python3 -m http.server 8080 --directory web
```

Open `http://localhost:8080` in that computer’s browser. For a phone, deploy the contents of `web/` to a static HTTPS host and open that address. This chat has not published a public hosting address. An ordinary HTTP LAN address does not enable offline service workers on phones.

Load once while connected and wait for **OFFLINE COPY READY · THIS BROWSER** at the bottom of the game. After that, the same browser and address can reopen without a connection. Supported browsers may offer Install or Add to Home Screen. Browser installation and storage policies vary; iPhone Safari and physical devices still need testing.

## Progress and updates

Progress and the fallback save stay in local device/browser storage. The offline cache stores application files, not a cloud account. Clearing site data, uninstalling a browser/web app or device storage eviction can remove both. Changing the hosting address does not transfer progress.

New builds have revisioned caches. Close all tabs for the game and reopen while connected to allow a waiting update to activate. Updates do not intentionally clear saved progress. Keep `offline-worker.js` and `offline-register.js` at their original paths, and serve JavaScript and manifest files with suitable content types. The build uses relative paths and may be hosted in a subdirectory; `index.html` must remain at that directory’s entry point.

## Validation

The browser build passed automated Chromium checks at a phone-sized viewport: first cache installation, offline reload, offline pickup, preference save, a second offline reload, progress overview and no horizontal overflow. These checks are not signed native builds or physical-device tests.

## Transfer progress manually

Open Progress in the header, then Back up or transfer progress. Generate backup text and copy the entire value to a place you control. On another device/browser, open the same prototype’s transfer screen, paste the text and choose Preview import. Check the position, then explicitly choose Replace with this backup. Cancel leaves the current game intact. Export a separate copy before replacement if you want to retain both games. This works without an account; it does not sync continuously or transfer app-store purchases.
