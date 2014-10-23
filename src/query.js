var _ = require('underscore');
module.exports = function (ormy, hidden) {
    return function (table, whereString, values) {
        var query = {};

        var wheres = (function () {
            var wheres = [];

            wheres.add = function (whereString, values) {
                wheres.push({ query: whereString, values: values });
            };

            wheres.query = function () {
                var whereString = (_.pluck(wheres, 'query')).join(' AND ');
                return whereString ? ' WHERE ' + whereString : ' ';
            };

            wheres.values = function () {
                return _.pluck(wheres, 'values');
            };

            return wheres;
        }());

        wheres.add(whereString, values);

        query.where = function (whereString, values) {
            wheres.add(whereString, values);
        };

        query.get = function () {
            return ormy.query(
                'SELECT * FROM ' + table.name() + wheres.query(),
                wheres.values()
            );
        };

        return query;
    };
};