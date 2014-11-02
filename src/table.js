var _ = require('underscore');

module.exports = function (ormy, hidden) {
    'use strict';
    return function (tableName) {
        var table = {};
        var primaryKey = '';
        var relationships = {};

        table.name = function () {
            return tableName;
        };

        table.hasMany = function (fig) {
            table[fig.methodName] = function () {
                return hidden.createQuery({
                    table: table,
                    relationships: relationships
                })
                .leftJoin({
                    table: hidden.getTable(fig.tableName),
                    foreignKey: fig.foreignKey || table.name() + '_' + primaryKey,
                    localKey: fig.localKey || primaryKey
                });
            };
            relationships[fig.methodName] = fig;
            return table;
        };

        table.with = function () {
            return table;
        };

        table.primaryKey = function (keyName) {
            primaryKey = keyName;
            return table;
        };

        table.find = function (id) {
            return hidden.createResults({
                table: table,
                relationships: relationships,
                resultsPromise: ormy.selectOne(
                    tableName, _.object([primaryKey], [id])
                )
            });
        };

        table.where = function (whereString, values) {
            return hidden.createQuery({
                table: table,
                relationships: relationships
            }).where(
                whereString,
                _.isArray(values) ? values : _.rest(_.toArray(arguments))
            );
        };

        return table;
    };
};