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

            self.map = function (callback) {
                return _.map(joins, _.bind(callback, self));
            };

            self.isEmpty = function () {
                return joins.length ? false : true;
            };

            self.get = function (name, result) {
                var join = _.findWhere(joins, { resultsName: name });
                var results = _.isArray(result) ? result : [result];
                return ormy.query(
                    'SELECT * FROM ' + join.table.name() +
                    ' WHERE ' +
                    _.map(results, function (result) {
                        return join.foreignKey + ' = ?';
                    }).join(' OR '),
                    _.pluck(results, join.localKey)
                );
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
            fig.joinType = 'leftJoin';
            leftJoins.add(fig);
            return query;
        };

        query.hasOne = function (fig) {
            fig.joinType = 'hasOne';
            leftJoins.add(fig);
            return query;
        };

        query.find = function (id) {
            wheres.add(table.primaryKey() + ' = ?', id);
            return query.get().then(function (results) {
                return _.first(results);
            });
        };

        query.all = function () {
            return query.get();
        };

        query.get = function () {
            // console.log('SELECT * FROM ' +
            //         table.name() +
            //         wheres.query(),
            //         wheres.values());

            return hidden.createResults({
                table: table,
                relationships: fig.relationships,
                resultsPromise: ormy.query(
                    'SELECT * FROM ' +
                    table.name() +
                    wheres.query(),
                    wheres.values()
                ).then(function (results) {
                    if(leftJoins.isEmpty()) {
                        return results;
                    }
                    else {
                        return Q.all(leftJoins.map(function (join) {
                            return this.get(join.resultsName, results)
                            .then(function (joinResults) {
                                _.each(results, function (result, index) {
                                    var matches = _.where(
                                        joinResults,
                                        _.object(
                                            [join.foreignKey],
                                            [result[join.localKey]]
                                        )
                                    );

                                    if(!_.isEmpty(matches)) {

                                        results[index][join.resultsName] =
                                            join.joinType === 'hasOne' ? _.first(matches) : matches;
                                    }
                                });
                            });
                        })).then(function () {
                            return results;
                        });
                    }
                })
            });
        };

        return query;
    };
};