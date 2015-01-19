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

        var relationshipHasManyThrough = function (relationship) {
            var pivot = relationship.pivot;
            var endpoint = relationship.endpoint;

            var uniqueKeys = _.unique(_.pluck(
                _.isArray(resultData) ? resultData : [resultData],
                pivot.localKey
            ));

            console.log('relationship', relationship);
            console.log('unique keys', uniqueKeys);

            return ormy.query(
                'SELECT ' + endpoint.foreignKey + ' ' +
                'FROM ' + pivot.tableName + ' ' +
                'WHERE ' + pivot.foreignKey + ' IN(' +
                    _.map(uniqueKeys, function () {
                        return '?';
                    }).join(', ') +
                ')',
                uniqueKeys
            ).then(function (results) {
                var endpointIDs = _.pluck(results, endpoint.foreignKey);
                return hidden.createQuery({
                    table: hidden.getTable(endpoint.tableName)
                }).where(
                    relationship.endpoint.localKey + ' IN(' +
                        _.map(endpointIDs, function () {
                            return '?';
                        }).join(', ') +
                    ')',
                    endpointIDs
                ).get();
            });
        };

        var relationshipSimple = function (relationship) {
            var ids = _.unique(_.pluck(
                _.isArray(resultData) ? resultData : [resultData],
                relationship.localKey
            ));

            return hidden.createQuery({
                table: hidden.getTable(relationship.tableName)
            }).where(
                relationship.foreignKey + ' IN(' +
                    _.map(ids, function () {
                        return '?';
                    }).join(', ') +
                ')',
                ids
            ).get();
        };

        _.each(fig.relationships, function (relationship, name) {
            results[name] = function () {
                if(!resultData) {
                    throw new Error('Must have allready loaded results');
                }

                switch(relationship.joinType) {
                    case 'hasManyThrough':
                        return relationshipHasManyThrough(relationship);
                    default:
                        return relationshipSimple(relationship);
                }
            };
        });

        return results;
    };
};