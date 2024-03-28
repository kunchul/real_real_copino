

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const mysql = require('mysql');
const path = require('path')


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


// 클라이언트에서 데이터를 요청하는 엔드포인트 설정
app.get('/getData', function(req, res) {
    connection.query('SELECT * FROM ts_work', (error, results, fields) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send("데이터베이스 쿼리 오류");
        }
        // 데이터를 클라이언트에게 전송
        res.json(results);
    });
});

// 서버 리스닝 부분 변경
server.listen(PORT, () => {
    console.log(`서버가 *:${PORT} 포트에서 실행 중입니다.`);
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(요청, 응답) {
    응답.sendFile(path.join(__dirname, 'index.html'));
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/TS', function(req, res) {
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        // ts.ejs 템플릿을 렌더링하여 클라이언트에게 전송
        res.render('ts', { data: results });

        // 클라이언트에게 데이터를 JSON 형식으로 전송
        res.json(results);
        
        
        // 데이터를 Socket.io를 통해 클라이언트에게도 전송
        io.emit('updateData', results);
    });
});

// 클라이언트가 연결되면 데이터를 조회하여 전송합니다.
io.on('connection', (socket) => {
    console.log('사용자가 연결되었습니다.');
  
    // 클라이언트가 연결되면 초기 데이터를 조회하여 전송합니다.
    connection.query('SELECT * FROM ts_work', function(error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return;
        }
        // 클라이언트에게 초기 데이터를 전송합니다.
        socket.emit('updateData', results);
    });
  
    socket.on('disconnect', () => {
        console.log('사용자가 연결 해제되었습니다.');
    });
});




// LOCAL 페이지에 대한 요청 처리
app.get('/local', function(req, res) {
    res.sendFile(path.join(__dirname, 'local.html'));
});