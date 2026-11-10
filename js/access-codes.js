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

   To revoke a code later:
     1. Hash the trimmed, lowercased code the same way.
     2. Append that hash to REVOKED_HASHES (you may also remove it from ACCESS_CODE_HASHES).
     3. Bump the service worker cache name in sw.js, then commit and push.
     Devices that stored that hash in pharmhero.unlockedBy will be locked again.
*/
(function () {
  var ACCESS_CODE_HASHES = [
    '571960b65b7717842ca450114ca18b541c0dccf6d8bfe4d6c07db899492c0831',
    '8ebfeeb203b4325e45b59c36616fdc69fcac7e47965d5bd88ade79fc50b3f131',
    'bc227a498de6c20cba4a38e1285852d5ce22a70c73848183fa0af7cb4dc1590c',
    '10bd48be6383ae42f9f9d973241ceff4293c5c2723ab06714cd6e37303cff839',
    '3ef95058e2e912eb27a38502ec159c45930a23462494abb41e515e1dca6843d0',
    'a85823d07e977c54d4b01cbb7971ee3165cb9deefd45a445c361f47e4069977d',
    '5dc5cea1eb5f98740430ba16fb660a365cda73aad7fa10da9d200679d343546d',
    'aa0d81db79a7824c6863154a7fff832c5adf37e8d592e27767e52dc5aacbb5c2',
    '172192c6059b6eb76dd5999c2b7f3b8b2893f07d000e557a0531fc94eff5248b',
    '41f185c8fda8a8ed5791248e2ad75a1279280b787b51927fbc38f29fcfaec422',
    '1be5cdc5a902d87c46e2af3ea0e148b9221d1238aba6fa0ce2cc67909a99289a',
    'd3f9875465f3a1e0cca6e288569f1f1f2be222d571887b27486d5d39df5ee981',
    '45f055e9687edc0a7edb8242bff219b317df68b87f8d15421428e3497d983665',
    '66f0549e00c0d946f1fd3228fe1e1d5f0cbc291b7f04bcdcc3a84a9cc51a23a6',
    'fe9d8bc3b0823bdb40eab46a709793b24e05a1ecb099113f72654ff214010686',
    '936986d6c247a16d4d7bee92a7f7fcd05751f66f72e7c9c8e76626e071a14559',
    '710db151598340c68689b34344fb11d4e2f5376dd4599c9c80ad2199cb766a28',
    'a66c4dc605f803d387c9083d759111feaade91edd88fa86ca7a5327aa95d3b15',
    'd9fdeff257d9d7666f2fb275c12bca47e381ff43890fe80f3e682ee87e127fe0',
    '1d9574c1d5ed54f4c860e893687480c03f888c65d78221f0f8c3029b28eb1992',
    '8ed083eca8c9f69f91119ba681dd9865abd5ae3d3019c3fbccd47cbd16a1503e',
    '7efad109d744aa5f6fccd249bd00cd8a9d17193aac258dafe8b09692fa46bad2',
    '42d31dc1352c254cfb7d567e9d507c880d92a64fd5bd5a988008915f6a3ad323',
    '5cc81077fe499c17ab48c26e1492d6b08646fdaddd3f6a67dbb654dd6c366c08',
    '273c4872a2df801328845f7bb018dc640c638e28e5f6fc5f50eed3df3c4353d2',
    '409477c35271e32d0ea99ed63fe3a2ef0e44edb71b7b23c41e4c097cee02538b',
    '1a52de6792f5f50e280e9ee96fa3853e9c1c20143fc1bd3fb2c5082ca927f6c3',
    'aefbbdefff57d9d1fcd479e63656fbf74572a3feac8e2c9306476463bf3cda38',
    'b49a17f70a7cc20d67d2994e2ff65db88cc6c5dbc7eb836f700cc0d115644827',
    '1d6df8d30527ecd768d2eebff651def426abb825313525c3f0fff6197adb6ed7',
    '9e5f0f7715a9cdf3dec2f0f0f7320a493e2f483c4407eacdd88ed3aaf0b9eda5',
    'c8449a360b5b2d2708f3a56bb5bc078cbcc80f2b4f21994da45fbeb82b09c72a',
    'f1fcd6e4568fac056684ae24cb7e2f32829ce00515dc5e5d2302ad672feb243c',
    '558b083dbc226e7259c179940e79e4ebc6bc1b0b6d3bc185937c418315327f32',
    'be5f5ed39e118af0746da0f288f54e25d1bf18da96235593177009052d06b054'
  ];
  var REVOKED_HASHES = [
  ];
  var UNLOCK_KEY = 'pharmhero.unlocked.v1';
  var UNLOCK_BY_KEY = 'pharmhero.unlockedBy';

  function isNativeOrDesktopApp() {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return true;
    } catch (e) {}
    if (navigator.userAgent && /Electron/i.test(navigator.userAgent)) return true;
    if (window.process && window.process.versions && window.process.versions.electron) return true;
    if (location.protocol === 'file:') return true;
    return false;
  }

  function inList(list, hex) {
    if (!hex) return false;
    var want = String(hex).toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i]).toLowerCase() === want) return true;
    }
    return false;
  }

  function isRevoked(hex) {
    return inList(REVOKED_HASHES, hex);
  }

  function clearUnlock() {
    try {
      localStorage.removeItem(UNLOCK_KEY);
      localStorage.removeItem(UNLOCK_BY_KEY);
    } catch (e) {}
  }

  function isUnlocked() {
    try {
      if (localStorage.getItem(UNLOCK_KEY) !== '1') return false;
      var by = localStorage.getItem(UNLOCK_BY_KEY) || '';
      if (by && isRevoked(by)) {
        clearUnlock();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function needsGate() {
    return !isNativeOrDesktopApp() && !isUnlocked();
  }

  function markUnlocked(hex) {
    try {
      localStorage.setItem(UNLOCK_KEY, '1');
      if (hex) localStorage.setItem(UNLOCK_BY_KEY, String(hex).toLowerCase());
    } catch (e) {}
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
    return inList(ACCESS_CODE_HASHES, hex) && !isRevoked(hex);
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
        markUnlocked(hex);
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
