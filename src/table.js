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
            fig.joinType = 'left';
            relationships[fig.methodName] = fig;
            return table;
        };

        table.with = function (methodNames) {
            var methodNames = _.isArray(methodNames) ?
                methodNames : _.toArray(arguments);

            var query = hidden.createQuery({
                table: table,
                relationships: relationships
            });

            _.each(methodNames, function (methodName) {
                var relation = relationships[methodName];
                switch(relation.joinType) {
                    case 'left':
                        query.leftJoin({
                            resultsName: relation.methodName,
                            table: hidden.getTable(relation.tableName),
                            foreignKey: relation.foreignKey ||
                                        table.name() + '_' + primaryKey,
                            localKey: relation.localKey || primaryKey
                        });
                        break;
                    default:
                        throw 'Unsupported joinType: ' + relation.joinType;
                }
            });

            return query;
        };

        table.primaryKey = function (keyName) {
            if(keyName) {
                primaryKey = keyName;
                return table;
            }
            else {
                return primaryKey;
            }
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

        table.all = function () {
            return hidden.createResults({
                table: table,
                relationships: relationships,
                resultsPromise: ormy.select(tableName)
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