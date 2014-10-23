var connection = {
    host: 'localhost',
    user: 'root',
    password: 'P0l.ar-B3ar',
    database: 'ormy'
};

var sql = require('mysql-wrap')(require('mysql').createConnection(connection));

exports.setUp = function (done) {
    this.ormy = require('../ormy')({ connection: connection });

    sql.query('SET FOREIGN_KEY_CHECKS = 0')
    .then(function () {
        sql.query('TRUNCATE TABLE enrollment');
    })
    .then(function () {
        return sql.query('TRUNCATE TABLE student');
    })
    .then(function () {
        return sql.query('TRUNCATE TABLE course');
    })
    .then(function () {
        return sql.query('SET FOREIGN_KEY_CHECKS = 1');
    })
    .then(function () {
        return sql.insert('student', [
            { name: 'Bob' },
            { name: 'Mary' }
        ]);
    })
    .then(function () {
        return sql.insert('course', [
            { name: 'Math' },
            { name: 'Biology' }
        ]);
    })
    .then(function () {
        return sql.insert('enrollment', [
            { courseID: 1, studentID: 1 },
            { courseID: 1, studentID: 2 },
            { courseID: 2, studentID: 1 }
        ]);
    })
    .then(function () {
        done();
    })
    .done();
};

exports.query = function (test) {
    test.expect(1);
    this.ormy.query('SELECT name FROM student')
    .then(function (students) {
        test.deepEqual(students, [{ name: 'Bob' }, { name: 'Mary' }]);
        test.done();
    })
    .done();
};

exports.find = function (test) {
    test.expect(1);
    this.ormy('student').primaryKey('id').find(1).get().then(function (student) {
        test.deepEqual(student, { id: 1, name: 'Bob' });
        test.done();
    });
};

exports.where = function (test) {
    test.expect(1);
    this.ormy('student')
        .primaryKey('id')
        .where('name = ?', ['Mary'])
        .get().then(function (students) {
            test.deepEqual(students, [{ id: 2, name: 'Mary' }]);
            test.done();
        }).done();
};

// exports.hasMany = function (test) {
//     this.ormy
//         .table('student')
//         .primaryKey('id')
//         .hasMany('enrollment', 'id', 'studentID')
//         .;

//     test.done();
// };