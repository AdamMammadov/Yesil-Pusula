/* Küçük SHA-256 uygulaması (çevrimdışı ve file:// altında da çalışır) */
(function (root) {
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var bytes = unescape(encodeURIComponent(ascii));
    var K = [], H = [], primes = [], n = 2;
    while (primes.length < 64) {
      var isP = true;
      for (var i = 0; i < primes.length && primes[i] * primes[i] <= n; i++) if (n % primes[i] === 0) { isP = false; break; }
      if (isP) primes.push(n);
      n++;
    }
    for (var j = 0; j < 64; j++) {
      if (j < 8) H[j] = (Math.pow(primes[j], 1 / 2) * 4294967296) | 0;
      K[j] = (Math.pow(primes[j], 1 / 3) * 4294967296) | 0;
    }
    var words = [], bitLen = bytes.length * 8;
    bytes += '\x80';
    while (bytes.length % 64 - 56) bytes += '\x00';
    for (var b = 0; b < bytes.length; b++) {
      var c = bytes.charCodeAt(b);
      words[b >> 2] |= c << ((3 - b) % 4) * 8;
    }
    words[words.length] = (bitLen / 4294967296) | 0;
    words[words.length] = bitLen | 0;
    for (var w = 0; w < words.length; w += 16) {
      var W = words.slice(w, w + 16), old = H.slice(0, 8);
      for (var t = 0; t < 64; t++) {
        var w15 = W[t - 15], w2 = W[t - 2];
        var a = H[0], e = H[4];
        var t1 = H[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & H[5]) ^ (~e & H[6])) + K[t] +
          (W[t] = t < 16 ? W[t] : (W[t - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + W[t - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & H[1]) ^ (a & H[2]) ^ (H[1] & H[2]));
        H = [(t1 + t2) | 0].concat(H);
        H[4] = (H[4] + t1) | 0;
        H.length = 8;
      }
      for (var k = 0; k < 8; k++) H[k] = (H[k] + old[k]) | 0;
    }
    var out = '';
    for (var m = 0; m < 8; m++) for (var s = 3; s + 1; s--) {
      var x = (H[m] >>> (s * 8)) & 255;
      out += (x < 16 ? '0' : '') + x.toString(16);
    }
    return out;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = sha256;
  else root.YP_SHA256 = sha256;
})(this);
