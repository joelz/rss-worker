var async = require('async'),
	crypto = require('crypto');

var Job = require('../lib/mongo').Job;

function jobManager(agenda) {
    this.agenda = agenda;
}

jobManager.prototype.restartJobs = function () {
    var self = this;
 
    Job.find({ active: true }).exec().then(function (data) {
        var jobCursor = data;
        jobCursor.forEach(function (job) {
            if (!job)
                return;
            self.addJob(job.url, '1 minute', job.actions.split(','), job.title);
        })
    });
};

//url,interval,actions,title
jobManager.prototype.addJob = function (url, interval, actions, title) {
    var jobname = this.defineJob(url, actions);
    this.agenda.every(interval, jobname, {
        interval: interval,
        actions: actions,
        url: url,
        title: title
    });
}

jobManager.prototype.defineJob = function (url, actionConfig) {
    var actions = parseActions(actionConfig);

    //TODO 加上用户uid去判断唯一    

    var hash = crypto.createHash('md5').update(url + actionConfig.join(',')).digest("hex");
    var jobName = 'feed-' + hash;

    this.agenda.define(jobName, function (job, done) {
        async.waterfall(waterfallCallbacks({ url: url, job: jobName }, actions), function (err) {
            console.log(err, 'done!');
            done();
        });
    });
    return jobName;
}

function parseActions(config) {
    var actions = [];
    config.forEach(function (action) {
        if (action.indexOf('.') === -1) {
            actions.push(require('../actions/' + action));
        } else {
            var arr = action.split('.');
            var module = arr[0], func = arr[1];
            actions.push(require('../actions/' + module)[func]);
        }
    });
    return actions;
}

function waterfallCallbacks(firstParam, functions) {
    var callbacks = [];
    functions.forEach(function (func, index) {
        if (index == 0) {
            callbacks.push(functionWrap(func, function (callback) {
                func(firstParam, function (result) {
                    callback(null, result);
                });
            }));
        } else {
            callbacks.push(functionWrap(func, function (data, callback) {
                if (data && !data.job) data.job = firstParam.job;
                func(data, function (result) {
                    callback(null, result);
                });
            }));
        }
    });
    return callbacks;
}

function functionWrap(func, wrapper) {
    return wrapper;
}

module.exports = jobManager;