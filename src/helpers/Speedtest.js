const fs = require('fs');
const path = require('path');

function getLocalOrPrivateIpInfo(ip) {
    // ::1/128 is the only localhost ipv6 address. there are no others, no need to strpos this
    if ('::1' === ip) {
        return 'localhost IPv6 access';
    }

    // simplified IPv6 link-local address (should match fe80::/10)
    if (ip.startsWith('fe80:')) {
        return 'link-local IPv6 access';
    }

    // anything within the 127/8 range is localhost ipv4, the ip must start with 127.0
    if (ip.startsWith('127.')) {
        return 'localhost IPv4 access';
    }

    // 10/8 private IPv4
    if (ip.startsWith('10.')) {
        return 'private IPv4 access';
    }

    // 172.16/12 private IPv4
    if ((ip.match('/^172\.(1[6-9]|2\d|3[01])\./'))?.length === 1) {
        return 'private IPv4 access';
    }

    // 192.168/16 private IPv4
    if (ip.startsWith('192.168.')) {
        return 'private IPv4 access';
    }

    // IPv4 link-local
    if (ip.startsWith('169.254.')) {
        return 'link-local IPv4 access';
    }

    return '0.0.0.0';
}

const cipher = (salt) => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a, b) => a ^ b, code);
    return text => text.split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
}

const decipher = (salt) => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g)
        .map(hex => parseInt(hex, 16))
        .map(applySaltToChar)
        .map(charCode => String.fromCharCode(charCode))
        .join('');
}

function getDateString(d) {
    return `${d.getUTCFullYear()}/${(d.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d
            .getUTCDate()
            .toString()
            .padStart(2, "0")}`;
}

function getTimeString(d) {
    return `${d
        .getUTCHours()
        .toString()
        .padStart(2, "0")}:${d
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")} UTC`;
}

function generateSvgString(result) {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path.join('src/helpers/svg', 'result.svg'),
            (err, svgBuffer) => {
                if (err) reject(err);
                let svgString = svgBuffer.toString();
                Object.entries({
                    "{{date}}": getDateString(new Date(result.date)),
                    "{{time}}": getTimeString(new Date(result.date)),
                    "{{latency}}": result.pingStatus || '0',
                    "{{jitter}}": result.jitterStatus || '0',
                    "{{download}}": result.dlStatus || '0',
                    "{{upload}}": result.ulStatus || '0',
                    "{{org}}": result.clientIp || 'IPS',
                }).forEach(([placeholder, value]) => {
                    svgString = svgString.replace(placeholder, value || "");
                });
                resolve(svgString);
            }
        );
    });
}

module.exports = {
    getLocalOrPrivateIpInfo,
    generateSvgString,
    cipher,
    decipher,
    getDateString,
    getTimeString,
};
