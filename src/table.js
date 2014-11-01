module.exports = function (ormy, hidden) {
    return function (tableName) {
        var table = {};
        // var hasMany = {};
        var primaryKey;

        table.name = function () {
            return tableName;
        };

        table.hasMany = function (methodName, tableName, foreignKey, localKey) {
            table[methodName] = function () {
                return hidden.createQuery()
            };
            // hidden.tables[table];
            // return table;
        };

        table.with = function () {
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