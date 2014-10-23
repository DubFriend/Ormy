module.exports = function (ormy, hidden) {
    return function (tableName) {
        var table = {};
        var hasMany = {};
        var primaryKey;

        table.name = function () {
            return tableName;
        };

        table.hasMany = function (tableName, thisTableKey, otherTableKey) {
            hasMany[tableName] = { key: thisTableKey, on: otherTableKey };
            return table;
        };

        table.primaryKey = function (keyName) {
            primaryKey = keyName;
            return table;
        };

        table.find = function (id) {
            var where = {};
            where[primaryKey] = id;
            return hidden.createResults(table, ormy.selectOne(tableName, where));
        };

        table.where = function (whereString, values) {
            return hidden.createQuery(table, whereString, values);
        };

        return table;
    };
};