var async = require('async'),
	crypto = require('crypto');

var Job = require('../lib/mongo').Job;
var config = require('config-lite');

function jobManager() {

}

jobManager.prototype.restartJobs = function () {
    var self = this;
    var jobsToProcess = [];

    Job.find({ active: true }).exec().then(function (jobs) {
        jobs.forEach(function (job) {
            
            var j = self.defineJob(job._id,job.url, job.actions.split(','));

            jobsToProcess.push(function () { j.exec(j.job); });
        })

        //start        
        async.parallelLimit(jobsToProcess, config.maxParallelLimit);
    });
};

jobManager.prototype.defineJob = function (jobId, url, actionConfig) {
    var actions = parseActions(actionConfig);
    var hash = crypto.createHash('md5').update(url + actionConfig.join(',')).digest("hex");
    var jobName = 'feed-' + hash;

    var exec = function (job, done) {
        
        //cb链上的处理结果都挂在這个对象上
        //各个cb里面要取东西也从這里取
        //各个cb要修改东西，也是直接修改它的属性
        var param = { jobId: jobId, url: url, jobName: jobName };

        async.waterfall(waterfallCallbacks(param, actions), function (err) {
            console.log(err, 'done!');
            if (done)
                done();
        });
    };

    return { job: jobName, exec: exec };
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