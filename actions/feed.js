var request = require('request'),
	FeedParser = require('feedparser');

var Post = require('../lib/mongo').Post;

function fetchFeed(param,callback) {
	var meta = null,
		items = [];
	request(param.url)
		.pipe(new FeedParser())
		.on('error', function(error) {
			console.log(error);
		})
		.on('meta', function (metaInfo) {
			meta = metaInfo;
		})
		.on('readable', function () {
			var stream = this, item;
			while (item = stream.read()) {
				items.unshift({
					link:item.link,
					guid:item.guid,
					title:item.title,
					description:item.description,
					pubDate:item.pubDate
				});
			}
		})
		.on('end', function () {
			param.meta = meta;
			param.items = items;

			console.log("DONE: feed.fetchFeed, get " + items.length + " items");

			callback(param);
		});
}

function removeDuplicate(data,callback) {
	var size = data.items.length;
	var filtered = [];
	data.items.forEach(function(item){
		Post.findOne({guid: item.guid}).exec().then(function (post) {
			size--;
			if(!post) filtered.push(item);
			if(size===0) return _callback();
		});
	});
	function _callback() {
		data.items = filtered;

		console.log("DONE: feed.removeDuplicate, get " + data.items.length + " items");

		callback(data);
	}
}

function updateFeed(data, callback) {

	console.log("START: feed.updateFeed, " + data.items.length + " items");
	
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
		
		Post.create(item).exec().then(function () {
			if (--size === 0) callback(data);
		});
	});
}

exports.fetch = fetchFeed;
exports.update = updateFeed;
exports.removeDuplicate = removeDuplicate;