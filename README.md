# rss-worker


本人订阅了40+的Podcast，每天都有很多Podcast更新。为了方便未来的查询分析，我需要一个工具将这些更新统一存储。


在学习[nswbmw/N-blog: 一起学 Node.js](https://github.com/nswbmw/N-blog)的过程中，看到了[chuck911/Nu-Reader: Reader Reinvented ,Not Only RSS!](https://github.com/chuck911/Nu-Reader)这个项目，正是解决上述问题的好办法。我将两个项目的代码做了些整合和修改，就有了rss-worker这个项目。


[Nu-Reader](https://github.com/chuck911/Nu-Reader)使用了[agenda](https://github.com/rschmukler/agenda)来做定时任务。我原计划将rss-worker部署到Google App Engine上，使用GAE的cron来做定时任务，就把agenda去掉了。后来发现GAE的Node.js环境是没有免费额度的（白白浪费了我30几刀）。最后又改回成使用[agenda](https://github.com/rschmukler/agenda)。


## 系统要求

*	Node 4.2+
*	MongoDB 3.2.9


## 已实现功能

1. 用户的注册
2. 用户的登录和注销
3. 用户可添加Job
4. Job可以定期执行，抓取Posts
5. Posts存储到MongoDB中
6. 支持多用户


## 如何运行

先到`config\default.js`中配置MongoDB连接字符串，然后：

```
cd {project_dir}
npm install
npm run dev
```

使用浏览器打开 http://127.0.0.1:3000 即可。



## TODO

1. 全文搜索功能
2. 添加更多的Actions，并优化新建Job界面的Action选择功能


## License

MIT.


