const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();



// 환경 변수에서 포트 번호를 읽어오도록 설정
const PORT = process.env.PORT || 31681;

app.listen(PORT, function() {
    console.log(`listening on ${PORT}`);
});

// 데이터베이스 연결 정보를 환경 변수에서 읽어오도록 설정
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'svc.sel5.cloudtype.app',
    port: process.env.DB_PORT || 31681,
    database: process.env.DB_NAME || 'ts_server',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rjscjf0739'
    
});

// 데이터베이스 연결
connection.connect(error => {
    if (error) {
        console.error('Database connection failed:', error);
        return;
    }
    console.log('Connected to the database.');
});

app.get('/getData', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', (error, results, fields) => {
        if (error) {
            console.error(`Database query error: ${error}`);
            return 응답.status(500).send("Database query error");
        }
        응답.send(results);
    });
});

app.get('/', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'index.html'));
});

app.set('view engine', 'ejs');
// 'views' 폴더를 템플릿 파일들이 위치하는 곳으로 설정합니다.
app.set('views', path.join(__dirname, 'views'));

app.get('/TS', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', function(error, results) {
        if (error) {
            console.error('연결이 되것냐:', error);
            return 응답.status(500).send('Database query error');
        }
        응답.render('ts', {data: results}); // 'data' 변수를 여기에서 전달
    });
});

app.get('/local', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'local.html'));
});


