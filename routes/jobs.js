var express = require('express');
var router = express.Router();
var config = require('config-lite');

var JobModel = require('../models/jobs');

var checkLogin = require('../middlewares/check').checkLogin;

// GET /jobs 
//   eg: GET /jobs
router.get('/', checkLogin, function(req, res, next) {

  var user = req.session.user._id;

  JobModel.getJobs(user)
    .then(function (jobs) {
      res.render('jobs', {
        jobs: jobs
      });
    })
    .catch(next);
});

// GET 
router.get('/create', checkLogin, function(req, res, next) {
  res.render('job_create');
});

// POST 
router.post('/', checkLogin, function(req, res, next) {
  var user = req.session.user._id;
  var title = req.fields.title;
  var url = req.fields.url;
  var actions = req.fields.actions;
  var active = !(!req.fields.active);
  
  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!url.length) {
      throw new Error('请填写URL');
    }
    if (!actions.length) {
      throw new Error('请填写actions');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  var job = {
    user: user,
    title: title,
    url: url,
    actions: actions,
    active: active
  };

  JobModel.create(job)
    .then(function (result) {
      // 此 job 是插入 mongodb 后的值，包含 _id
      job = result.ops[0];
      req.flash('success', '添加成功');
      // 发表成功后跳转到该文章页
      res.redirect(`/jobs/${job._id}`);
    })
    .catch(next);
});

// GET /jobs/:jobId 单独一个Job的显示页
router.get('/:jobId', checkLogin, function(req, res, next) {
  var jobId = req.params.jobId;
  
  Promise.all([
    JobModel.getJobById(jobId)
  ])
  .then(function (result) {
    var job = result[0];

    if (!job) {
      throw new Error('该Job不存在');
    }

    res.render('job', {
      job: job
    });
  })
  .catch(next);
});

// GET /jobs/:jobId/edit 更新Job页
router.get('/:jobId/edit', checkLogin, function(req, res, next) {
  var jobId = req.params.jobId;
  var user = req.session.user._id;
  
  JobModel.getJobById(jobId)
    .then(function (job) {
      if (!job) {
        throw new Error('该Job不存在');
      }
      if (user.toString() !== job.user._id.toString()) {
        throw new Error('权限不足');
      }
      res.render('job_edit', {
        job: job
      });
    })
    .catch(next);
});

// POST /jobs/:jobId/edit 更新Job
router.post('/:jobId/edit', checkLogin, function(req, res, next) {
  var jobId = req.params.jobId;
  var user = req.session.user._id;

  var title = req.fields.title;
  var url = req.fields.url;
  var actions = req.fields.actions;
  var active = !(!req.fields.active);
  
  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!url.length) {
      throw new Error('请填写URL');
    }
    if (!actions.length) {
      throw new Error('请填写actions');
    }

    if (user.toString() !== jobId.toString()) {
        throw new Error('权限不足');
    }

  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }
  
  JobModel.updateJobById(jobId, user, { title: title, url: url, actions: actions, active: active })
    .then(function () {
      req.flash('success', '编辑Job成功');

      res.redirect(`/jobs/${jobId}`);
    })
    .catch(next);
});

// GET /jobs/:jobId/enable 启用
router.get('/:jobId/enable', checkLogin, function(req, res, next) {
  var jobId = req.params.jobId;
  var author = req.session.user._id;

  JobModel.disableJobById(jobId, author, true)
    .then(function () {
      req.flash('success', '启用成功');

      res.redirect('/jobs');
    })
    .catch(next);
});

// GET /jobs/:jobId/disable 禁用
router.get('/:jobId/disable', checkLogin, function(req, res, next) {
  var jobId = req.params.jobId;
  var author = req.session.user._id;

  JobModel.disableJobById(jobId, author, false)
    .then(function () {
      req.flash('success', '禁用成功');
      
      res.redirect('/jobs');
    })
    .catch(next);
});

module.exports = router;
