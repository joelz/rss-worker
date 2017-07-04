
module.exports = {
  port: 3000,
  session: {
    secret: 'rss-worker',
    key: 'rss-worker-key-34oufv',
    maxAge: 2592000000
  },
  mongodb: 'mongodb://user:passWord@localhost:27017/myblog',
  maxParallelLimit: 3,
  jobIntervalInMin: 10,
  pageSize: 10
};
