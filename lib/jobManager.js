var async = require('async'),
	crypto = require('crypto');

var config = require('config-lite');

var Job = require('../lib/mongo').Job;
var JobModel = require('../models/jobs');

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
            self.addJob(job._id, job.url, config.jobIntervalInMin + ' minute', job.actions.split(','), job.title, job.user);
        })
    });
};

//url,interval,actions,title
jobManager.prototype.addJob = function (jobId, url, interval, actions, title, userId) {
    var jobname = this.defineJob(jobId, url, actions, userId);
    this.agenda.every(interval, jobname, {
        interval: interval,
        actions: actions,
        url: url,
        title: title
    });
}

jobManager.prototype.defineJob = function (jobId, url, actionConfig, userId) {
    var actions = parseActions(actionConfig);

    var hash = crypto.createHash('md5').update(url + actionConfig.join(',') + userId).digest("hex");
    var jobName = 'feed-' + hash;

    //cb链上的处理结果都挂在這个对象上
    //各个cb里面要取东西也从這里取
    //各个cb要修改东西，也是直接修改它的属性
    var param = { jobId: jobId, url: url, jobName: jobName, userId: userId };

    this.agenda.define(jobName, function (job, done) {

        JobModel.updateJobById(jobId,userId,{"lastFetchStart":new Date()});

        async.waterfall(waterfallCallbacks(param, actions), function (err) {
            if(err){
                JobModel.updateJobById(jobId,userId,{"lastFetchEnd":new Date(),"error":err});
            }else{
                JobModel.updateJobById(jobId,userId,{"lastFetchEnd":new Date(),"error":""});
            }
            console.log(err, 'done!');
            if (done)
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