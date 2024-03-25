const express = require('express');
const mysql = require('mysql');
const { exec } = require('child_process');
const app = express();

app.listen(8180, function() {
    console.log('listening on 8180');
});

const connection = mysql.createConnection({
    host:'127.0.0.1',
    database:'ts_server',
    user:'root',
    password:'rjscjf0739',
    charset:'utf8'
});

connection.connect();

app.get('/getData', function(요청, 응답) {
    connection.query('SELECT * FROM your_table', (error, results, fields) => {
        if (error) throw error;

        exec(`python your_script.py '${JSON.stringify(results)}'`, (err, stdout, stderr) => {
            if (err) {
                console.error(`exec error: ${err}`);
                return 응답.send("Error executing Python script");
            }

            // Python 스크립트 결과를 웹 페이지에 표시
            응답.send(`Python script output: ${stdout}`);
        });
    });
});

app.get('/', function(요청, 응답) {
    응답.sendFile(__dirname + '/index.html');
});

app.set('view engine', 'ejs');

const path = require('path');

app.set('views', path.join(__dirname, 'views'));

app.get('/TS', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) throw error;
        응답.render('ts', {data: results}); // MySQL 데이터와 함께 ts.ejs 템플릿 렌더링
    });
});



app.get('/local', function(요청, 응답) {
    응답.sendFile(__dirname + '/local.html');
});



