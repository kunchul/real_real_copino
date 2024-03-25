const express = require('express');
const mysql = require('mysql');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// 환경 변수에서 포트 번호를 읽어오도록 설정
const PORT = process.env.PORT || 8180;

app.listen(PORT, function() {
    console.log(`listening on ${PORT}`);
});

// 데이터베이스 연결 정보를 환경 변수에서 읽어오도록 설정
const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'ts_server',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rjscjf0739',
    charset: 'utf8'
});

// 데이터베이스 연결
connection.connect(error => {
    if (error) {
        console.error('Database connection failed:', error);
        return;
    }
    console.log('Connected to the database.');
})

app.get('/getData', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', (error, results, fields) => {
        if (error) {
            console.error(`Database query error: ${error}`);
            return 응답.status(500).send("Database query error");
        }

        // Python 스크립트 실행 부분을 제거하고 결과를 직접 반환합니다.
        응답.send(results);
    });
});

app.get('/', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'index.html'));
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// '/TS' 경로에 대한 GET 요청 처리
app.get('/TS', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) {
            console.error('Database query error:', error);
            return 응답.status(500).send('Database query error');
        }
        응답.render('ts', {data: results});
    });
});

app.get('/local', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'local.html'));
});