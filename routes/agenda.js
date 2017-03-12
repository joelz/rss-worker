var express = require('express');
var router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;


router.get('/start', function (req, res, next) {
  req.jobManager.restartJobs();
  res.json("Jobs started by JobManager.restartJobs().");
  next();
});


module.exports = router;
