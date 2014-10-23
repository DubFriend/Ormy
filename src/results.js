module.exports = function (ormy, hidden) {
	return function (table, resultsPromise) {
	    var results = {};

	    results.get = function () {
	        return resultsPromise;
	    };

	    return results;
	};
};