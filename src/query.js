var _ = require('underscore');
var Q = require('q');

module.exports = function (ormy, hidden) {
    'use strict';
    return function (fig) {
        var query = {};
        var table = fig.table;

        var wheres = (function () {
            var self = {};
            var wheres = [];

            self.add = function (whereString, values) {
                wheres.push({ query: whereString, values: values });
            };

            self.query = function () {
                var whereString = (_.pluck(wheres, 'query')).join(' AND ');
                return whereString ? ' WHERE ' + whereString : ' ';
            };

            self.values = function () {
                return _.flatten(_.pluck(wheres, 'values'));
            };

            return self;
        }());

        var leftJoins = (function () {
            var self = {};
            var joins = [];

            self.add = function (fig) {
                joins.push(fig);
            };

            self.getAll = function (result) {
                return Q.all(_.map(joins, function (join) {
                    return ormy.query(
                        'SELECT * FROM ' + join.table.name() +
                        ' WHERE ' + join.foreignKey + ' = ?',
                        [result[join.localKey]]
                    ).then(function (joinResult) {
                        return {
                            name: join.resultsName,
                            data: joinResult
                        };
                    });
                })).then(function (joinResults) {
                    var unpacked = {};
                    _.each(joinResults, function (result) {
                        unpacked[result.name] = result.data;
                    });
                    return unpacked;
                });
            };

            return self;
        }());

        query.where = function (whereString, values) {
            wheres.add(
                whereString,
                _.isArray(values) ? values : _.rest(_.toArray(arguments))
            );
            return query;
        };

        query.leftJoin = function (fig) {
            leftJoins.add(fig);
            return query;
        };

        query.find = function (id) {
            wheres.add(table.primaryKey() + ' = ?', id);
            return query.get().then(function (results) {
                return _.first(results);
            });
        };

        query.get = function () {
            return hidden.createResults({
                table: table,
                relationships: fig.relationships,
                resultsPromise: ormy.query(
                    'SELECT * FROM ' +
                    table.name() +
                    wheres.query(),
                    wheres.values()
                ).then(function (results) {
                    // TODO: REDUCE QUERIES BY GROUPING 1 PER TABLE
                    return Q.all(_.map(results, function (result) {
                        return leftJoins.getAll(result).then(function (joinResults) {
                            return _.extend(result, joinResults);
                        });
                    }));
                })
            });
        };

        return query;
    };
};