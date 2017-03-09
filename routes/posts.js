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
  
  PostModel.getPosts(author,null,startId,prevOrNext)
    .then(function (posts) {
      
      var pagerParam = { firstId: -1, lastId: -1 };

      if (posts.length == 0) { 
        res.render('posts', {
          posts: posts,
          pagerParam: pagerParam
        });

        return;
      }
      
      if (prevOrNext == 'prev') {
        posts.sort((a, b) => a._id < b._id);
      }      
      
      pagerParam.lastId = posts[posts.length - 1]._id.toString();
      pagerParam.firstId = posts[0]._id.toString();      

      Promise.all([
        PostModel.getPosts(author, null, pagerParam.firstId, 'prev'),
        PostModel.getPosts(author,null,pagerParam.lastId,'next'),
      ])
        .then(function (result) {
          var prevPage = result[0];
          var nextPage = result[1];
          
          if (!result[0] || result[0].length == 0) { 
            pagerParam.firstId = -1;
          }

          if (!result[1] || result[1].length == 0) { 
            pagerParam.lastId = -1;
          }          
          
          res.render('posts', {
            posts: posts,
            pagerParam: pagerParam
          });
        })
        .catch(next);   
      
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
