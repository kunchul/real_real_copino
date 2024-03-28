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

// 클라이언트에서 데이터베이스의 변경 사항을 감지하여 클라이언트에게 전송
const sendUpdateData = () => {
    connection.query('SELECT * FROM ts_work', (error, results, fields) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return;
        }
        // 변경된 데이터를 클라이언트에게 전송
        io.emit('updateData', results);
    });
};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // 클라이언트로부터 삭제된 데이터 정보를 받아와 처리
    socket.on('deleteData', (deletedData) => {
        // 삭제된 데이터를 데이터베이스에서 삭제
        connection.query('DELETE FROM ts_work WHERE id IN (?)', [deletedData], (error, results, fields) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                return;
            }
            console.log('삭제된 데이터를 데이터베이스에서 제거했습니다.');
            // 변경된 데이터를 클라이언트에게 다시 전송
            sendUpdateData();
        });
    });

    // 클라이언트로부터 새로 추가된 데이터 정보를 받아와 처리
    socket.on('addData', (newData) => {
        // 새로 추가된 데이터를 데이터베이스에 추가
        connection.query('INSERT INTO ts_work SET ?', newData, (error, results, fields) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // 변경된 데이터를 클라이언트에게 다시 전송
            sendUpdateData();
        });
    });
});

// 서버 리스닝 부분 변경
server.listen(PORT, () => {
    console.log(`서버가 *:${PORT} 포트에서 실행 중입니다.`);
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (요청, 응답) {
    응답.sendFile(path.join(__dirname, 'index.html'));
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/TS', function (req, res) {
    connection.query('SELECT * FROM ts_work', function (error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        // ts.ejs 템플릿을 렌더링하여 클라이언트에게 전송
        res.render('ts', { data: results });
    });
});

// LOCAL 페이지에 대한 요청 처리
app.get('/local', function (req, res) {
    res.sendFile(path.join(__dirname, 'local.html'));
});

// 데이터베이스 변경 사항 주기적으로 확인하여 클라이언트에게 전송
setInterval(sendUpdateData, 5000); // 5초마다 데이터베이스 확인하여 변경된 데이터 전송
