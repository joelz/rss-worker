var sha1 = require('sha1');
var express = require('express');
var router = express.Router();
var config = require('config-lite');
var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;

// GET /pwd 
router.get('/pwd', checkLogin, function(req, res, next) {
    res.render('user_pwd', {});
});

// POST  /pwd
router.post('/pwd', checkLogin, function(req, res, next) {
  var userId = req.session.user._id;

  var oldPassword = req.fields.oldPassword;
  var password = req.fields.password;
  var repassword = req.fields.repassword;

  // 校验参数
  try {
    if (!oldPassword.length) {
      throw new Error('请输入旧密码');
    }
    if (password.length < 6) {
      throw new Error('新密码至少 6 个字符');
    }
    if (password !== repassword) {
      throw new Error('两次输入新密码不一致');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  UserModel.getUserById(userId)
    .then(function (user) {
      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('back');
      }
      // 检查旧密码是否正确
      if (sha1(oldPassword) !== user.password) {
        req.flash('error', '旧密码错误');
        return res.redirect('back');
      }

      UserModel.updatePwdById(userId,sha1(password)).then(function(){
        req.flash('success', '修改密码成功');
        return res.redirect('back');
      }).catch(next);

    })
    .catch(next);

});

module.exports = router;
