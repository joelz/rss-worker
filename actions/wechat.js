var request = require('request'),
	FeedParser = require('feedparser'),
	cheerio = require('cheerio');

var PostModel = require('../models/posts');

var baseUrl = "http://chuansong.me";
var options = {
	url: 'http://chuansong.me/account/bitsea',
	headers: {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		/*'Accept-Encoding': 'gzip, deflate',
		'Accept-Language': 'zh-CN,zh;q=0.8',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Host': 'chuansong.me',
		'Pragma': 'no-cache',
		'Referer': 'http://chuansong.me/',
		'Upgrade-Insecure-Requests': '1',*/
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
	}
};

function fetchArticleList(param,callback) {
	var meta = null,
		items = [];
	
	//获取文章列表
	options.url = param.url;
	request(options, function (error, response, body) {
		//console.log('error:', error);
		//console.log('statusCode:', response && response.statusCode);
		
		var $ = cheerio.load(body);
		
		$("div.feed_body div.feed_item_question a.question_link").each(function (idx, element) {
			var $element = $(element);
			items.push({
				link: baseUrl + $element.attr('href'),
				guid: baseUrl + $element.attr('href'),
				title: $element.text()
			});
		});

		param.meta = meta;
		param.items = items;

		console.log("======== " + param.url + " ========");
		console.log(new Date().toString());
		console.log("DONE: wechat.fetchArticleList, get " + items.length + " items");

		callback(param);
	});
};

function removeDuplicate(data,callback) {
	var size = data.items.length;
	var filtered = [];
	data.items.forEach(function (item) {
		
		PostModel.queryOne({guid: item.guid,author:data.userId}).then(function (post) {
			size--;
			if(!post) filtered.push(item);
			if(size===0) return _callback();
		});
	});
	function _callback() {
		data.items = filtered;

		console.log("DONE: wechat.removeDuplicate, get " + data.items.length + " items");

		callback(data);
	}
};

function fetchArticleContent(data, callback) { 

	var items = data.items;
	//递归获取文章内容
	fetchContent(0);
	function fetchContent(x) {
		if (x == items.length) {
			console.log("DONE: wechat.fetchArticleContent, get " + data.items.length + " items' content.");
			callback(data);
			return;
		}

		options.url = items[x].link;
		console.log('wechat.fetchArticleContent:', options.url);
		request(options, function (error, response, body) {
			var $ = cheerio.load(body);
			$("#img-content").each(function (idx, element) {
				var $element = $(element);
				items[x].description = $element.html();
				items[x].pubDate = new Date($element.find("#post-date").text() + "T00:00:00");
			});

			fetchContent(x + 1);
		});
	}
};

function updateArticle(data, callback) {

	console.log("START: wechat.updateArticle, " + data.items.length + " items");
	
	var size = data.items.length;
	if(!size) {
		callback(data);
		return;
	}

	data.items.forEach(function (item) {

		if (data.meta)
			item.meta = { title: data.meta.title };
		item.job = data.jobId;
		item.new = true;
		item.author = data.userId;
		
		PostModel.create(item).then(function () {
			if (--size === 0) callback(data);
		});
	});
};

exports.fetchList = fetchArticleList;
exports.removeDuplicate = removeDuplicate;
exports.fetchContent = fetchArticleContent;
exports.update = updateArticle;
