var _ = require('underscore');
var mysqlWrap = require('mysql-wrap');
var createResults = require('./src/results');
var createQuery = require('./src/query');
var createTable = require('./src/table');

module.exports = function (fig) {
    'use strict';

    var ormy = function (tableName) {
        return hidden.getTable(tableName);
    };

    var db = mysqlWrap(require('mysql').createConnection(fig.connection));

    _.each(db, function (prop, key) {
        ormy[key] = prop;
    });

    var hidden = {};
    var tables = {};
    hidden.createResults = createResults(ormy, hidden);
    hidden.createTable = createTable(ormy, hidden);
    hidden.createQuery = createQuery(ormy, hidden);
    hidden.getTable = function (tableName) {
        if(!tables[tableName]) {
            tables[tableName] = hidden.createTable(tableName);
        }
        return tables[tableName];
    };

    return ormy;
};