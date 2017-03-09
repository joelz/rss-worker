var express = require('express');
var router = express.Router();
var config = require('config-lite');
var PostModel = require('../models/posts');
var checkLogin = require('../middlewares/check').checkLogin;

// GET /posts 当前用户的post页
//   eg: GET /posts
router.get('/', checkLogin, function (req, res, next) {
  
  var author = req.session.user._id;
  var startId = null;
  var prevOrNext = null;

  if (req.query.next) { 
    startId = req.query.next;
    prevOrNext = "next";
  }

  else if (req.query.prev) { 
    startId = req.query.prev;
    prevOrNext = "prev";
  }
  
  PostModel.getPostsPage(author,null,startId,prevOrNext)
    .then(function (obj) {
        res.render('posts', {
          posts: obj.data,
          pagerParam: obj.pagerParam
        });
    })
    .catch(next);
});

// GET /posts/:postId 
router.get('/:postId', checkLogin, function(req, res, next) {
  var postId = req.params.postId;
  
  Promise.all([
    PostModel.getPostById(postId)
  ])
  .then(function (result) {
    var post = result[0];
    
    if (!post) {
      throw new Error('该Post不存在');
    }

    res.render('post', {
      post: post
    });
  })
  .catch(next);
});


/*

// POST /posts 
//示例代码，没用到
router.post('/', checkLogin, function(req, res, next) {
  var author = req.session.user._id;
  var title = req.fields.title;
  var content = req.fields.content;

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!content.length) {
      throw new Error('请填写内容');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  var post = {
    author: author,
    title: title,
    content: content,
    pv: 0
  };

  PostModel.create(post)
    .then(function (result) {
      // 此 post 是插入 mongodb 后的值，包含 _id
      post = result.ops[0];
      req.flash('success', '发表成功');
      // 发表成功后跳转到该文章页
      res.redirect(`/posts/${post._id}`);
    })
    .catch(next);
});

*/

module.exports = router;
