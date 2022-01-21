const randomBytes = require('random-bytes');
const request = require('request');

const helpers = require('../../helpers/Speedtest');
let cache = null;

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
      res.set('Content-Disposition', 'attachment; filename=random.dat');
      res.set('Content-Transfer-Encoding', 'binary');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.set('Cache-Control', 'post-check=0, pre-check=0', false);
      res.set('Pragma', 'no-cache');
      const requestedSize = (req.query.ckSize || 100);
  
      const send = () => {
          for (let i = 0; i < requestedSize; i++)
              res.write(cache);
          res.end();
      }
  
      if (cache) {
          send();
      } else {
          randomBytes(1048576, (error, bytes) => {
              cache = bytes;
              send();
          });
      }
  
  }
  
  async getIP(req, res) {
      let requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['HTTP_CLIENT_IP'] || req.headers['X-Real-IP'] || req.headers['HTTP_X_FORWARDED_FOR'];
      if (requestIP.substr(0, 7) === "::ffff:") {
          requestIP = requestIP.substr(7)
      }
      request('https://ipinfo.io/' + requestIP + '/json', function (err, body, ipData) {
          ipData = JSON.parse(ipData);
          if (err) res.send(requestIP);
          else {
              request('https://ipinfo.io/json', function (err, body, serverData) {
                  serverData = JSON.parse(serverData);
                  if (err) res.send(`${requestIP} - ${ipData.org}, ${ipData.country}`);
                  else if (ipData.loc && serverData.loc) {
                      const d = helpers.calcDistance(ipData.loc.split(','), serverData.loc.split(','));
                      res.send(`${requestIP} - ${ipData.org || '?'}, ${ipData.country || '?'} (${d}km)`);
                  } else {
                      res.send(`${requestIP} - ${ipData.org || '?'}, ${ipData.country || '?'}`);
                  }
              })
          }
      });
  }
  
}();
