const Express = require('express');

const Router = Express.Router();
const Home = require('../controllers/Home');

Router.get('/', Home.index);
Router.get('/empty', Home.empty1);
Router.post('/empty', Home.empty2);
Router.get('/garbage', Home.garbage);
Router.get('/getIP', Home.getIP);
Router.get('/result/:code', Home.result);
Router.get('/resultimg/:code', Home.resultimg);

module.exports = Router;
