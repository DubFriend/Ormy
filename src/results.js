var _ = require('underscore');
var Q = require('q');
module.exports = function (ormy, hidden) {
	'use strict';
	return function (fig) {
	    var results = {};
	    var table = fig.table;
	    var resultData = null;

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
	    			throw new Error('Must have allready loaded results');
	    		}

	    		var uniqueKeys = _.unique(_.pluck(
	    			_.isArray(resultData) ? resultData : [resultData],
	    			relationship.localKey)
	    		);

	    		return hidden.createQuery({
	    			table: hidden.getTable(relationship.tableName)
	    		}).where(
	    			_.map(uniqueKeys, function (row) {
	    				return relationship.foreignKey + ' = ?';
	    			}),
	    			uniqueKeys
	    		).get();
	    	};
	    });

	    return results;
	};
};