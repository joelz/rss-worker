var rss = require('rss');
var express = require('express');
var router = express.Router();

var config = require('config-lite');
var PostModel = require('../models/posts');
var UserModel = require('../models/users');

var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /jjooeell 
router.get('/:user', checkNotLogin, function (req, res, next) {
  var name = req.params.user;

  UserModel.getUserByName(name)
    .then(function (user) {

      if (!user) {
        var feed = new rss({
          title: "用户名不存在！"
        });
        res.contentType("application/rss+xml");
        return res.send(feed.xml());
      }
      
      var author = user._id;
      PostModel.getPostsForRss(author)
        .then(function (obj) {

          //准备feed          
          var feed = new rss({
            title: user.name + "关注的公众号文章"
          });

          obj.forEach(function (post) {
            feed.item({
              title: post.title,
              description: post.description,
              guid: post.guid,
              url: post.link,
              date: post.pubDate
            });
          });

          //输出feed
          res.contentType("application/rss+xml");
          res.send(feed.xml());
        })
        .catch(next);
    })
    .catch(next);
});

module.exports = router;
