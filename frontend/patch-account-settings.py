import os, glob, json, shutil, sys

files = glob.glob("dist/assets/App-*.js")
if not files:
    print("❌ App bundle नहीं मिला")
    sys.exit(1)

target = None
for f in files:
    try:
        s = open(f, encoding="utf-8").read()
        if "ACCOUNT SETTINGS" in s and "GOOGLE CONNECTED" in s:
            target = f
            break
    except:
        pass

if not target:
    print("❌ Account Settings वाला JS bundle नहीं मिला")
    sys.exit(1)

s = open(target, encoding="utf-8").read()

# -------------------------------------------------
# 1. GOOGLE LOGOUT FUNCTION
# -------------------------------------------------
if "BATZO_GOOGLE_LOGOUT" not in s:
    marker = "async function N(){"

    logout_fn = r'''async function ZG(){
try{
console.log(`[BATZO_GOOGLE_LOGOUT] Starting Google logout`);
try{
if(e.isNativePlatform()){
try{await o.signOut()}catch(x){console.warn(`[BATZO_GOOGLE_LOGOUT] Native signOut:`,x)}
}else{
try{await l.signOut()}catch(x){console.warn(`[BATZO_GOOGLE_LOGOUT] Web signOut:`,x)}
}
}catch(x){console.warn(`[BATZO_GOOGLE_LOGOUT] Firebase signOut:`,x)}
try{localStorage.removeItem(`batzo_token`)}catch{}
try{localStorage.removeItem(`batzo_auth_token`)}catch{}
try{localStorage.removeItem(`batzo_firebase_user`)}catch{}
try{localStorage.removeItem(`batzo_account_settings`)}catch{}
c(null);
T(`Google account logged out successfully.`);
setTimeout(()=>{try{window.location.reload()}catch{}},300);
}catch(x){
console.error(`[BATZO_GOOGLE_LOGOUT]`,x);
T(x?.message||`Google logout failed.`);
}
}
'''

    if marker not in s:
        print("❌ Logout insertion point नहीं मिला")
        sys.exit(1)

    s = s.replace(marker, logout_fn + marker, 1)
    print("✅ Google Logout function added")
else:
    print("ℹ️ Google Logout function पहले से मौजूद है")

# -------------------------------------------------
# 2. GOOGLE LOGOUT BUTTON
# -------------------------------------------------
if "BATZO_GOOGLE_LOGOUT" not in s:
    print("❌ Internal logout marker error")
    sys.exit(1)

if "GOOGLE LOGOUT" not in s:
    pos = s.find("ADD GOOGLE ACCOUNT")
    if pos < 0:
        print("❌ Google Account button नहीं मिला")
        sys.exit(1)

    end = s.find("})]}", pos)
    if end < 0:
        print("❌ Google section closing point नहीं मिला")
        sys.exit(1)

    button = r''',
(0,_.jsx)(`button`,{
type:`button`,
onClick:ZG,
style:{
width:`100%`,
marginTop:10,
padding:14,
border:0,
borderRadius:12,
background:`#b3261e`,
color:`#fff`,
fontWeight:900
},
children:`GOOGLE LOGOUT`
})'''

    s = s[:end] + button + s[end:]
    print("✅ GOOGLE LOGOUT button added")
else:
    print("ℹ️ GOOGLE LOGOUT button पहले से मौजूद है")

# -------------------------------------------------
# 3. ANDROID SYSTEM BACK → CLOSE ACCOUNT SETTINGS
# -------------------------------------------------
back_old = "if(i.current.length>0){let e=i.current.pop();"

if "r(false)" not in s[s.find("function q(){"):s.find("function q(){")+2500]:
    if back_old not in s:
        print("❌ Android Back insertion point नहीं मिला")
        sys.exit(1)

    back_fix = "if(r){r(false);i.current=[];o.current=e;t(e);window.scrollTo({top:0,behavior:`smooth`});return}"
    s = s.replace(back_old, back_fix + back_old, 1)
    print("✅ Android Back → Account Settings fix added")
else:
    print("ℹ️ Android Back Account Settings fix पहले से मौजूद है")

# -------------------------------------------------
# 4. MARKER
# -------------------------------------------------
s = s.replace(
    "async function ZG(){",
    "async function ZG(){/*BATZO_GOOGLE_LOGOUT*/",
    1
)

open(target, "w", encoding="utf-8").write(s)
print("✅ Bundle patched:", target)
