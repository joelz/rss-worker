var config = require('config-lite');
var Mongolass = require('mongolass');
var mongolass = new Mongolass();
mongolass.connect(config.mongodb);

var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');

// 根据 id 生成创建时间 created_at
mongolass.plugin('addCreatedAt', {
  afterFind: function (results) {
    results.forEach(function (item) {
      item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm:ss');
      if(item.pubDate)
        item.pub_at= moment(item.pubDate).format('YYYY-MM-DD HH:mm:ss');
      if(item.lastFetchEnd)
        item.update_at = moment(item.lastFetchEnd).format('YYYY-MM-DD HH:mm:ss');
    });
    return results;
  },
  afterFindOne: function (result) {
    if (result) {
      result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm:ss');
      if(result.pubDate)
        result.pub_at= moment(result.pubDate).format('YYYY-MM-DD HH:mm:ss');
      if(result.lastFetchEnd)
        result.update_at = moment(result.lastFetchEnd).format('YYYY-MM-DD HH:mm:ss');
    }
    return result;
  }
});

exports.User = mongolass.model('User', {
  name: { type: 'string' },
  password: { type: 'string' },
  avatar: { type: 'string' },
  gender: { type: 'string', enum: ['m', 'f', 'x'] },
  bio: { type: 'string' }
});
exports.User.index({ name: 1 }, { unique: true }).exec();// 根据用户名找到用户，用户名全局唯一

exports.Post = mongolass.model('Post', {
  author: { type: Mongolass.Types.ObjectId },
  job: { type: Mongolass.Types.ObjectId },
  title: { type: 'string' },
  content: { type: 'string' },
  pv: { type: 'number' },
  link: { type: 'string' },
  description: { type: 'string' },
  guid: { type: 'string' },
  meta: { type: 'object' },
  pubDate: { type: 'date' },
  new: { type: 'boolean' }
});
exports.Post.index({ author: 1, _id: -1 }).exec();// 按创建时间降序查看用户的文章列表
exports.Post.index({ pubDate: 1, _id: -1 }).exec();// 按创建时间降序查看用户的文章列表

exports.Job = mongolass.model('Job', {
  user: { type: Mongolass.Types.ObjectId },
  title: { type: 'string' },
  url: { type: 'string' },
  actions: { type: 'string' },
  lastFetchStart: { type: 'date' },
  lastFetchEnd: { type: 'date' },
  error: { type: 'string' },
  active: { type: 'boolean' },
});
exports.Job.index({ user: 1, _id: -1 }).exec();// 