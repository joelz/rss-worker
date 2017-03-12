var marked = require('marked');
var Post = require('../lib/mongo').Post;

var config = require('config-lite');

var ObjectId = require('mongodb').ObjectID;

// 给 post 添加留言数 commentsCount
// 示例函数
Post.plugin('addCommentsCount', {
  afterFind: function (posts) {
    return Promise.all(posts.map(function (post) {
      
      // return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
      //   post.commentsCount = commentsCount;
      //   return post;
      // });

      return post;

    }));
  },
  afterFindOne: function (post) {
    // if (post) {
    //   return CommentModel.getCommentsCount(post._id).then(function (count) {
    //     post.commentsCount = count;
    //     return post;
    //   });
    // }

    return post;
  }
});

// 按pubDate倒序返回一页Posts
function getPosts(author, job, startId, prevOrNext) {
  var query = {};
  if (author) {
    query.author = author;
  }

  if (job) {
    query.job = job;
  }
  
  var sortObj = { pubDate: -1 };
  
  //查询特定页
  if (startId) {
      
    query._id = startId;

    return Post
      .findOne(query).exec()
      .then((post) => {
        query.pubDate = prevOrNext == "prev" ? { "$gt": post.pubDate } : { "$lt": post.pubDate };
        if (prevOrNext == "prev") {
          sortObj.pubDate = 1;
        }

        //query._id 這个条件不需要了
        //没有删除這个，浪费了我半个小时
        delete query._id;

        return Post
          .find(query)
          .limit(config.pageSize)
          .populate({ path: 'author', model: 'User' })
          .populate({ path: 'job', model: 'Job' })
          .sort(sortObj)
          .addCreatedAt()
          .exec().then((posts) => {
            //如果是上一页，需要将所获取的数据倒序排列  
            if (prevOrNext == 'prev') {
              posts.sort((a, b) => a.pubDate < b.pubDate);
            }
            return posts;
          });
      });
    
  }

  return Post
    .find(query)
    .limit(config.pageSize)
    .populate({ path: 'author', model: 'User' })
    .populate({ path: 'job', model: 'Job' })
    .sort(sortObj)
    .addCreatedAt()
    .exec();
}


module.exports = {

  // 通过文章 id 获取一篇文章
  getPostById: function getPostById(postId) {
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User' })
      .populate({ path: 'job', model: 'Job' })
      .addCreatedAt()//這个方法定义在mongo.js中
      .exec();
  },

  // 按pubDate倒序返回一页Posts
  getPosts: getPosts,

  // 按pubDate倒序返回一页Posts，同时返回pagerParam
  getPostsPage: function getPostsPage(author, job, startId, prevOrNext) {
    
    return new Promise(function (resolve, reject) {

      getPosts(author, job, startId, prevOrNext)
        .then(function (posts) {

          var pagerParam = { firstId: -1, lastId: -1 };

          if (posts.length == 0) {
            return resolve({
              data: posts,
              pagerParam: pagerParam
            });
          }

          pagerParam.lastId = posts[posts.length - 1]._id.toString();
          pagerParam.firstId = posts[0]._id.toString();

          Promise.all([
            getPosts(author, null, pagerParam.firstId, 'prev'),
            getPosts(author, null, pagerParam.lastId, 'next'),
          ])
            .then(function (result) {
              var prevPage = result[0];
              var nextPage = result[1];
              
              //不存在上一页
              if (!result[0] || result[0].length == 0) {
                pagerParam.firstId = -1;
              }

              //不存在下一页
              if (!result[1] || result[1].length == 0) {
                pagerParam.lastId = -1;
              }
          
              resolve({
                data: posts,
                pagerParam: pagerParam
              });

            });
        
        })
    });
  },

  //Promise的另一种写法
  //then()返回的也是一个Promise
  getPostsPage2: function getPostsPage(author, job, pubDate, prevOrNext) {
    return getPosts(author, job, pubDate, prevOrNext)
      .then(function (posts) {

        var pagerParam = { firstId: -1, lastId: -1 };

        if (posts.length == 0) {
          return {
            data: posts,
            pagerParam: pagerParam
          };
        }
        
        if (prevOrNext == 'prev') {
          posts.sort((a, b) => a._id < b._id);
        }
      
        pagerParam.lastId = posts[posts.length - 1]._id.toString();
        pagerParam.firstId = posts[0]._id.toString();

        return Promise.all([
          getPosts(author, null, pagerParam.firstId, 'prev'),
          getPosts(author, null, pagerParam.lastId, 'next'),
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
          
            return {
              data: posts,
              pagerParam: pagerParam
            };
          });
      });
  },
  
  // 通过用户 id 和文章 id 删除一篇文章
  delPostById: function delPostById(postId, author) {
    return Post.remove({ author: author, _id: postId })
      .exec();
  },
  create: function create(post) {
    return Post.create(post).exec();
  },
  queryOne: function query(query) {
    return Post
      .findOne(query)
      .populate({ path: 'author', model: 'User' })
      .populate({ path: 'job', model: 'Job' })
      .addCreatedAt()//這个方法定义在mongo.js中
      .exec();
  }

};
