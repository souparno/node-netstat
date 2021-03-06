"use strict";

var os = require('os');
var activators = require('./activators');
var utils = require('./utils');
var parsers = require('./parsers');
var filters = require('./filters');
var pkg = require('../package');
var defaultCommands = require("./defaultCommands");

module.exports = function (options, callback) {
    options = options || {};
    callback = callback || utils.callback;
    var done = options.done || utils.noop;
    var platform = options.platform || os.platform();
    var commands = options.command || defaultCommands;
    var command = commands[platform];
    var parser = parsers[platform];
    var handler = options.handler || callback;
    var activator = options.sync ? activators.sync : activators.async;

    var makeLineHandler = function (stopParsing) {
        return function (line, arr) {
            if (parser(line, handler, arr) === false) {
                stopParsing();
            }
        };
    };

    if (!parser || !command) {
        throw new Error('platform is not supported.');
    }

    if (options.limit && options.limit > 0) {
        handler = filters.limit(handler, options.limit, utils.noop);
    }

    if (options.filter) {
        handler = filters.conditional(handler, options.filter);
    }

    if (options.watch) {
        activators.continuous(activator, { 
            cmd: command.cmd, 
            args: command.args, 
            makeLineHandler: makeLineHandler, 
            done: done 
        }, { sync: options.sync });

    } else {
        activator(command.cmd, command.args, makeLineHandler, done);
    }
};

module.exports.defaultCommands = defaultCommands;
module.exports.filters = filters;
module.exports.parsers = parsers;
module.exports.utils = utils;
module.exports.version = pkg.version;
