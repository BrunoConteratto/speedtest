const Express = require('express');

const Router = Express.Router();

const home = require('./home.routes');

Router.use('*', (req, res) => {
  res.status(404).render('errors/404', {
    layout: 'error',
    title: 'Erro 404',
    user: null,
  });
});

module.exports = [home, Router];
