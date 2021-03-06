const Express = require('express');
const ExpressHandlebars = require('express-handlebars');
var cors = require('cors');
const { config, path } = require('./configs');
const appRoutes = require('./app/routes');
const handlebars = require('./helpers/Handlebars');

const ExpressApp = Express();

ExpressApp.use(cors());
ExpressApp.use(config.publicPath, Express.static(path.public));
ExpressApp.use(Express.json());
ExpressApp.use(Express.urlencoded({ extended: true }));

// ExpressApp.use((req, res, next) => {
//   if (!req.secure) {
//     return res.redirect('https://' + req.headers.host + req.url);
//   }
//   next();
// });
ExpressApp.use('/sw.js', async function(req, res, next) {
  return res.sendFile(path.public + '/js/sw.js');
});

ExpressApp.engine(config.viewExtension, ExpressHandlebars({
  extname: config.viewExtension,
  layoutsDir: path.layout,
  defaultLayout: config.defaultLayout,
  helpers: handlebars,
  partialsDir: [path.partial],
}));
ExpressApp.set('views', path.view);
ExpressApp.set('view engine', config.viewExtension);
ExpressApp.enable('view cache');
ExpressApp.use(appRoutes);

module.exports = ExpressApp;
