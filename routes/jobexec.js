var express = require('express');
var router = express.Router();

var JobManagerLite = require('../lib/jobManagerLite');
var checkLogin = require('../middlewares/check').checkLogin;


router.get('/', function (req, res, next) {
  var jm = new JobManagerLite();
  jm.restartJobs();
  res.json("Jobs started by JobManagerLite.restartJobs().");
  next();
});


module.exports = router;
