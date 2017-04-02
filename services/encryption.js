const Tea = {};

Tea.encrypt = (plaintext, password) => {
    if (plaintext.length == 0) return ('');
    let v = Tea.strToLongs(Utf8.encode(plaintext));
    if (v.length <= 1) v[1] = 0;
    let k = Tea.strToLongs(Utf8.encode(password).slice(0, 16));
    let n = v.length;
    let z = v[n - 1],
    y = v[0],
    delta = 0x9E3779B9;
    let mx, e, q = Math.floor(6 + 52 / n),
    sum = 0;

    while (q-- > 0) {
        sum += delta;
        e = sum >>> 2 & 3;
        for (let p = 0; p < n; p++) {
            y = v[(p + 1) % n];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            z = v[p] += mx;
        }
    }

    let ciphertext = Tea.longsToStr(v);

    return Base64.encode(ciphertext);
}

Tea.decrypt = (ciphertext, password) => {
    if (ciphertext.length == 0) return ('');
    let v = Tea.strToLongs(Base64.decode(ciphertext));
    let k = Tea.strToLongs(Utf8.encode(password).slice(0, 16));
    let n = v.length;
    let z = v[n - 1], y = v[0], delta = 0x9E3779B9;
    let mx, e, q = Math.floor(6 + 52 / n), sum = q * delta;

    while (sum != 0) {
        e = sum >>> 2 & 3;
        for (let p = n - 1; p >= 0; p--) {
            z = v[p > 0 ? p - 1 : n - 1];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            y = v[p] -= mx;
        }
        sum -= delta;
    }

    let plaintext = Tea.longsToStr(v);
    plaintext = plaintext.replace(/\0+$/, '');

    return Utf8.decode(plaintext);
}

Tea.strToLongs = (s) => {
    let l = new Array(Math.ceil(s.length / 4));

    for (let i = 0; i < l.length; i++) {
        l[i] = s.charCodeAt(i * 4) + (s.charCodeAt(i * 4 + 1) << 8) + (s.charCodeAt(i * 4 + 2) << 16) + (s.charCodeAt(i * 4 + 3) << 24);
    }

    return l;
}

Tea.longsToStr = (l) => {
    let a = new Array(l.length);

    for (let i = 0; i < l.length; i++) {
        a[i] = String.fromCharCode(l[i] & 0xFF, l[i] >>> 8 & 0xFF, l[i] >>> 16 & 0xFF, l[i] >>> 24 & 0xFF);
    }

    return a.join('');
}

const Base64 = {};
Base64.code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

Base64.encode = (str, utf8encode) => {
    utf8encode = (typeof utf8encode == 'undefined') ? false : utf8encode;
    let o1, o2, o3, bits, h1, h2, h3, h4, e = [],
    pad = '',
    c, plain, coded;
    let b64 = Base64.code;

    plain = utf8encode ? Utf8.encode(str) : str;

    c = plain.length % 3;
    if (c > 0) {
        while (c++ < 3) {
            pad += '=';
            plain += '\0';
        }
    }

    for (c = 0; c < plain.length; c += 3) {
        o1 = plain.charCodeAt(c);
        o2 = plain.charCodeAt(c + 1);
        o3 = plain.charCodeAt(c + 2);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        e[c / 3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    }

    coded = e.join('');
    coded = coded.slice(0, coded.length - pad.length) + pad;

    return coded;
}

Base64.decode = (str, utf8decode) => {
    utf8decode = (typeof utf8decode == 'undefined') ? false : utf8decode;
    let o1, o2, o3, h1, h2, h3, h4, bits, d = [], plain, coded;
    let b64 = Base64.code;
    coded = utf8decode ? Utf8.decode(str) : str;

    for (let c = 0; c < coded.length; c += 4) {
        h1 = b64.indexOf(coded.charAt(c));
        h2 = b64.indexOf(coded.charAt(c + 1));
        h3 = b64.indexOf(coded.charAt(c + 2));
        h4 = b64.indexOf(coded.charAt(c + 3));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >>> 16 & 0xff;
        o2 = bits >>> 8 & 0xff;
        o3 = bits & 0xff;

        d[c / 4] = String.fromCharCode(o1, o2, o3);
        if (h4 == 0x40) d[c / 4] = String.fromCharCode(o1, o2);
        if (h3 == 0x40) d[c / 4] = String.fromCharCode(o1);
    }

    plain = d.join('');
    return utf8decode ? Utf8.decode(plain) : plain;
}

const Utf8 = {};

Utf8.encode = (strUni) => {
    let strUtf = strUni.replace(/[\u0080-\u07ff]/g, (c) => {
        let cc = c.charCodeAt(0);
        return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
    });

    strUtf = strUtf.replace(/[\u0800-\uffff]/g, (c) => {
        let cc = c.charCodeAt(0);
        return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
    });

    return strUtf;
};

Utf8.decode = (strUtf) => {
    let strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, (c) => {
        let cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
        return String.fromCharCode(cc);
    });

    strUni = strUni.replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, (c) => {
        let cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
        return String.fromCharCode(cc);
    });

    return strUni;
};

module.exports = Tea;
