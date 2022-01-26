const randomBytes = require('random-bytes');
const request = require('request');

const helpers = require('../../helpers/Speedtest');
const factory = helpers.decipher('123456');
let cache = null;
randomBytes(1048576, (error, bytes) => {
    cache = bytes;
});

module.exports = new class {
    async index(req, res) {
        res.render('home', {});
    }

    async empty1(req, res) {
        res.status(200).send('');
    }

    async empty2(req, res) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        res.set("Cache-Control", "post-check=0, pre-check=0");
        res.set("Pragma", "no-cache");
        res.status(200).send('');
    }

    async garbage(req, res) {
        res.set('Content-Description', 'File Transfer');
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=speedtest.dat');
        res.set('Content-Transfer-Encoding', 'binary');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.set('Cache-Control', 'post-check=0, pre-check=0', false);
        res.set('Pragma', 'no-cache');
        const requestedSize = (req.query.ckSize || 100);
        for (let i = 0; i < requestedSize; i++) {
            res.write(cache);
        }
        res.end();
    }

    async getIP(req, res) {
        let requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['HTTP_CLIENT_IP'] || req.headers['X-Real-IP'] || req.headers['HTTP_X_FORWARDED_FOR'];
        if (requestIP.substr(0, 7) === "::ffff:") {
            requestIP = requestIP.substr(7);
        }
        request(`https://ipinfo.io/${requestIP}/json`, function (err, body, ipData) {
            ipData = JSON.parse(ipData);
            let ips = helpers.getLocalOrPrivateIpInfo(requestIP);
            if (ipData.org) ips += ` - ${ipData.org}`;
            if (ipData.country) ips += ` - ${ipData.country}`;
            res.send(ips);
        });
    }

    async result(req, res) {
        res.render('home', {});
    }

    async resultimg(req, res) {
        const { code } = req.params;
        const data = JSON.parse(factory(code));
        const svg = await helpers.generateSvgString(data);
        res.writeHead(200, {
            'Content-Type': 'image/svg+xml',
            'Content-Length': svg.length
        });
        res.end(svg);
    }

}();
