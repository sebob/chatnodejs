var express = require('express');
var app = express.app;
var router = express.Router();

/* GET client listing. */
router.get('/', function(req, res, next) {
    res.render('client', { title: 'Express' });
});


module.exports = router;


