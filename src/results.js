var _ = require('underscore');
var Q = require('q');
module.exports = function (ormy, hidden) {
	'use strict';
	return function (fig) {
	    var results = {};
	    var table = fig.table;
	    var resultData = null;

	    // results.get = function () {
	    // 	return resultData ? Q(resultData) : fig.resultsPromise;
	    // };

	    results.then = function (callback) {
	    	if(resultData) {
	    		return Q(callback.call(results, resultData));
	    	}
	    	else {
	    		return fig.resultsPromise.then(function (data) {
	    			resultData = data;
	    			return callback.call(results, resultData);
	    		});
	    	}
	    };

	    _.each(fig.relationships, function (relationship, name) {
	    	results[name] = function () {
	    		if(!resultData) {
	    			throw 'Must have allready loaded results';
	    		}

	    		var rows = _.isArray(resultData) ? resultData : [resultData];

	    		return hidden.createQuery({
	    			table: hidden.getTable(relationship.tableName)
	    		}).where(
	    			_.map(rows, function (row) {
	    				return relationship.foreignKey + ' = ?';
	    			}).join(' OR '),
	    			_.pluck(rows, relationship.localKey)
	    		);
	    	};
	    });

	    return results;
	};
};