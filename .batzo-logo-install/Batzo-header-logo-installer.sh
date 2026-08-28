#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/Batzo"

APP="frontend/src/App.jsx"
CSS="frontend/src/App.css"
LOGO_SRC="$HOME/Batzo/Batzo-3D-Header-Logo.png"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="backups/HEADER-3D-LOGO-$STAMP"

[ -f "$APP" ] || { echo "ERROR: App.jsx NOT FOUND"; exit 1; }
[ -f "$CSS" ] || { echo "ERROR: App.css NOT FOUND"; exit 1; }
[ -f "$LOGO_SRC" ] || { echo "ERROR: Batzo-3D-Header-Logo.png NOT FOUND"; exit 2; }

mkdir -p "$BACKUP" frontend/public/batzo-assets
cp -f "$APP" "$BACKUP/App.jsx"
cp -f "$CSS" "$BACKUP/App.css"
cp -f "$LOGO_SRC" frontend/public/batzo-assets/Batzo-3D-Header-Logo.png

python3 - "$APP" <<'PY'
from pathlib import Path
import re, sys
p=Path(sys.argv[1]); s=p.read_text(errors="ignore")
s=re.sub(r'\s*<div className="batzo-header-3d-logo-wrap">.*?</div>\s*', '\n', s, count=1, flags=re.S)
m=re.search(r'(<header\b[^>]*>)', s)
if not m: raise SystemExit("ERROR: <header> NOT FOUND")
logo='\n          <div className="batzo-header-3d-logo-wrap">\n            <img className="batzo-header-3d-logo" src="/batzo-assets/Batzo-3D-Header-Logo.png" alt="BATZO Cricket Hub" />\n          </div>\n'
s=s[:m.end()]+logo+s[m.end():]
p.write_text(s)
PY

cat >> "$CSS" <<'CSS'

/* BATZO FINAL 3D HEADER LOGO */
.batzo-header-3d-logo-wrap{display:flex;align-items:center;justify-content:center;flex:1;min-width:0;height:58px;overflow:hidden}
.batzo-header-3d-logo{display:block;width:min(205px,58vw);max-width:205px;height:54px;object-fit:contain;object-position:center;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5))}
@media (max-width:480px){.batzo-header-3d-logo-wrap{height:52px}.batzo-header-3d-logo{width:min(175px,52vw);height:48px}}
@media (min-width:768px){.batzo-header-3d-logo{width:230px;max-width:230px;height:58px}}
CSS

cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon

APK="$(find app/build/outputs/apk -type f -name '*.apk' | sort | tail -1)"
[ -f "$APK" ] || { echo "ERROR: APK NOT FOUND"; exit 10; }

mkdir -p ../../apk-final "$HOME/storage/downloads"
cp -f "$APK" ../../apk-final/Batzo-V11-3D-HEADER-FINAL.apk
cp -f ../../apk-final/Batzo-V11-3D-HEADER-FINAL.apk "$HOME/storage/downloads/Batzo-V11-3D-HEADER-FINAL.apk"

echo "=============================================================="
echo "BATZO 3D HEADER LOGO SUCCESS"
echo "APK: $HOME/Batzo/apk-final/Batzo-V11-3D-HEADER-FINAL.apk"
echo "PHONE: $HOME/storage/downloads/Batzo-V11-3D-HEADER-FINAL.apk"
echo "BACKUP: $HOME/Batzo/$BACKUP"
echo "=============================================================="
