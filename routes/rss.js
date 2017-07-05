var rss = require('rss');
const Feed = require('feed');

var express = require('express');
var router = express.Router();

var config = require('config-lite');
var PostModel = require('../models/posts');
var UserModel = require('../models/users');

// GET /jjooeell 
router.get('/:user', function (req, res, next) {
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

/*          //准备feed          
          var feed = new rss({
            title: user.name + "关注的公众号文章",
            feed_url: config.siteUrl + "/rss/" + user.name,
            site_url: config.siteUrl
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
          res.send(feed.xml());*/


          let feed = new Feed({
            title: user.name + "关注的公众号文章",
            description: 'This is my personal feed!',
            id: config.siteUrl + "/rss/" + user.name,
            link: config.siteUrl + "/rss/" + user.name,
            image: 'http://example.com/image.png',
            favicon: 'http://example.com/favicon.ico',
            copyright: '',

            feedLinks: {
              json: 'https://example.com/json',
              atom: 'https://example.com/atom',
            },
            author: {
              name: 'John Doe',
              email: 'johndoe@example.com',
              link: config.siteUrl
            }
          });
          


          obj.forEach(function (post) {
            feed.addItem({
              title: post.title,
              id: post.link,
              link: post.link,
              description: post.title,
              content: post.description,
              author: [],
              contributor: [],
              date: post.pubDate
            });
          });
          
          res.contentType("text/xml; charset=utf-8");
          res.send(feed.rss2());

        })
        .catch(next);
    })
    .catch(next);
});

module.exports = router;
