
var Job = require('../lib/mongo').Job;


module.exports = {

  create: function create(job) {
    return Job.create(job).exec();
  },

  getJobById: function getJobById(jobId) {
    return Job
      .findOne({ _id: jobId })
      .populate({ path: 'user', model: 'User' })
      .addCreatedAt() //這个方法定义在mongo.js中
      .exec();
  },

  getJobs: function getJobs(user) {
    var query = {};
    if (user) {
      query.user = user;
    }
    return Job
      .find(query)
      .populate({ path: 'user', model: 'User' })
      .sort({ _id: -1 })
      .addCreatedAt()
      .exec();
  },

  updateJobById: function updateJobById(jobId, user, data) {
    return Job.update({ user: user, _id: jobId }, { $set: data }).exec();
  },

  disableJobById: function delJobById(jobId, user, flag) {
      return Job.update({ user: user, _id: jobId }, { $set: { "active": flag } }).exec();
  }

};
