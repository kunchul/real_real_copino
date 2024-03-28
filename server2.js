const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const mysql = require('mysql');
const path = require('path');


// 환경 변수에서 포트 번호를 읽어오도록 설정
const PORT = process.env.PORT || 31681;

//app.listen(PORT, function() {
//    console.log(`listening on ${PORT}`);
//});

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


io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });


app.get('/getData', function(요청, 응답) {
    connection.query('SELECT * FROM ts_work', (error, results, fields) => {
        if (error) {
            console.error(`Database query error: ${error}`);
            return 응답.status(500).send("Database query error");
        }
        // 응답 대신 Socket.io를 사용하여 결과 전송
        io.emit('updateData', results);
    });
});

// 서버 리스닝 부분 변경
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });

app.get('/', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'index.html'));
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/TS', function(request, response) {
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return response.status(500).send('데이터베이스 쿼리 오류');
        }
        // Render the ts.ejs template with data and send it to the client
        response.render('ts', { data: results }); // 'ts_template' 대신 실제 템플릿 파일 이름으로 변경해야 합니다.
        // Send data to client using Socket.io
        io.emit('updateData', results);
    });
});

app.get('/TS', function(request, response) {
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return response.status(500).send('데이터베이스 쿼리 오류');
        }
        response.send(results); // 클라이언트에 데이터를 보냄
    });
});


app.get('/local', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'local.html'));
});