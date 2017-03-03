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

  // 按创建时间降序获取所有用户文章或者某个特定用户的所有文章
  getPosts: function getPosts(author,job,lastId,prevOrNext) {
    var query = {};
    if (author) {
      query.author = author;
    }

    if (job) {
      query.job = job;
    }

    var sortObj = { _id: -1 };
    
    if (lastId) {
      query._id = prevOrNext == "prev" ? { "$gt": ObjectId(lastId) } : { "$lt": ObjectId(lastId) };

      if (prevOrNext == "prev") {
        sortObj._id = 1;
      }
    }

    return Post
      .find(query)
      .limit(config.pageSize)
      .populate({ path: 'author', model: 'User' })
      .populate({ path: 'job', model: 'Job' })
      .sort(sortObj)
      .addCreatedAt()
      .exec();
  },

  // 通过用户 id 和文章 id 删除一篇文章
  delPostById: function delPostById(postId, author) {
    return Post.remove({ author: author, _id: postId })
      .exec();
  }


};
