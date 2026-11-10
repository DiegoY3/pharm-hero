/* Access codes for the GitHub Pages web app only.
   This gate does not run in Capacitor (Android/iOS app) or Electron (desktop exe).

   Codes are stored as SHA-256 hex digests of the trimmed, lowercased code.
   Never put the plaintext code in this file.

   To add a code later:
     1. Hash the trimmed, lowercased code:
          printf '%s' 'yourcode' | openssl dgst -sha256
        or:
          python3 -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].strip().lower().encode()).hexdigest())" 'yourcode'
     2. Append the 64-character hex string to ACCESS_CODE_HASHES below.
     3. Bump the service worker cache name in sw.js and add this file to PRECACHE if it is not already there.
     4. Commit and push to main so GitHub Pages deploys.
*/
(function () {
  var ACCESS_CODE_HASHES = [
    '571960b65b7717842ca450114ca18b541c0dccf6d8bfe4d6c07db899492c0831'
  ];
  var UNLOCK_KEY = 'pharmhero.unlocked.v1';

  function isNativeOrDesktopApp() {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return true;
    } catch (e) {}
    if (navigator.userAgent && /Electron/i.test(navigator.userAgent)) return true;
    if (window.process && window.process.versions && window.process.versions.electron) return true;
    if (location.protocol === 'file:') return true;
    return false;
  }

  function isUnlocked() {
    try { return localStorage.getItem(UNLOCK_KEY) === '1'; }
    catch (e) { return false; }
  }

  function needsGate() {
    return !isNativeOrDesktopApp() && !isUnlocked();
  }

  function markUnlocked() {
    try { localStorage.setItem(UNLOCK_KEY, '1'); }
    catch (e) {}
    document.documentElement.classList.remove('needs-unlock');
  }

  if (needsGate()) document.documentElement.classList.add('needs-unlock');

  function toHex(buffer) {
    var bytes = new Uint8Array(buffer);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function hashCode(text) {
    var normalized = String(text || '').trim().toLowerCase();
    if (!window.crypto || !crypto.subtle || !crypto.subtle.digest) {
      return Promise.reject(new Error('secure-hash-unavailable'));
    }
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized)).then(toHex);
  }

  function hashOk(hex) {
    if (!hex) return false;
    var want = String(hex).toLowerCase();
    for (var i = 0; i < ACCESS_CODE_HASHES.length; i++) {
      if (String(ACCESS_CODE_HASHES[i]).toLowerCase() === want) return true;
    }
    return false;
  }

  function setHint(text) {
    var hint = document.getElementById('unlock-hint');
    if (!hint) return;
    hint.hidden = !text;
    hint.textContent = text || '';
  }

  function wire() {
    if (isNativeOrDesktopApp()) {
      document.documentElement.classList.remove('needs-unlock');
      return;
    }
    if (isUnlocked()) {
      document.documentElement.classList.remove('needs-unlock');
      return;
    }
    document.documentElement.classList.add('needs-unlock');

    var input = document.getElementById('unlock-code');
    var btn = document.getElementById('unlock-btn');
    if (!input || !btn) return;

    var busy = false;
    var lastPointer = 0;

    function submit() {
      if (busy) return;
      var value = input.value;
      if (!String(value || '').trim()) {
        setHint('Enter your access code.');
        if (input.focus) input.focus();
        return;
      }
      busy = true;
      setHint('');
      hashCode(value).then(function (hex) {
        busy = false;
        if (!hashOk(hex)) {
          setHint("That code didn't work.");
          input.select && input.select();
          return;
        }
        markUnlocked();
      }).catch(function () {
        busy = false;
        setHint("That code didn't work.");
      });
    }

    btn.addEventListener('pointerup', function (e) {
      if ((e.pointerType || 'mouse') === 'mouse') return;
      lastPointer = Date.now();
      submit();
    });
    btn.addEventListener('click', function () {
      if (Date.now() - lastPointer < 700) return;
      submit();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    try { input.focus(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
