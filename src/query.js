var _ = require('underscore');
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

            self.query = function () {
                // var whereString = (_.pluck(wheres, 'query')).join(' AND ');
                // return whereString ? ' WHERE ' + whereString : ' ';
            };

            self.values = function () {
                // return _.flatten(_.pluck(wheres, 'values'));
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

        query.get = function () {

            console.log('SELECT * FROM ' + table.name() + wheres.query(), wheres.values());

            return ormy.query(
                'SELECT * FROM ' + table.name() + wheres.query(),
                wheres.values()
            );
        };

        return query;
    };
};