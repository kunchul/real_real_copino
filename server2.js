const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser'); // Body-parser 미들웨어 추가
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const mysql = require('mysql');
const path = require('path');
let lastDataSnapshot = [];
const bcrypt = require('bcryptjs');
const session = require('express-session');
const moment = require('moment');

// 어제와 오늘 날짜를 계산
const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
const today = moment().format('YYYY-MM-DD');

// 세션 미들웨어 설정
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 15 * 60 * 60 * 1000
    }
}));

// Body-parser 미들웨어 사용 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
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

    // 클라이언트로부터 삭제된 데이터 정보를 받아와 처리
    socket.on('deleteData', (deletedData) => {
        // 삭제된 데이터를 데이터베이스에서 삭제
        connection.query('DELETE FROM ts_work WHERE id IN (?)', [deletedData], (error, results, fields) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                return;
            }
            console.log('삭제된 데이터를 데이터베이스에서 제거했습니다.');
            // 삭제된 데이터의 ID를 클라이언트에게 전송하여 삭제 요청
            io.emit('deleteData', deletedData);
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
            // 추가된 데이터를 클라이언트에게 전송하여 추가 요청
            io.emit('addData', newData);
        });
    });
});

// 서버 리스닝 부분 변경
server.listen(PORT, () => {
    console.log(`서버가 *:${PORT} 포트에서 실행 중입니다.`);
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 메인화면
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});



// 로그인 후---------------------------------------------------------------------------------------------------------------------------------------------------------------
app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'))  

// '/LOGIN' 라우트 설정
app.get('/LOGIN', (req, res) => {
    // 세션에 저장된 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index(로그인 후)', { user: req.session.user });
});

// 이지콘 ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// '/ezicon' 라우트 설정
app.get('/ezicon', (req, res) => {
    // 세션에 저장된 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index(이지콘)', { user: req.session.user });
});



app.post('/api/search-another', (req, res) => {
    const containerNumber = req.body.containerNumber.trim();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // 입력된 문자열에서 7자리 이상인 부분을 추출
    const searchString = containerNumber.length >= 7 ? containerNumber.substring(containerNumber.length - 7) : '';

    // SQL 쿼리에서 LIKE 연산자를 사용하여 해당 문자열을 검색
    const query2 = `
    SELECT M_PORT
    FROM bo_hacha
    WHERE CON LIKE '%${searchString}'
    AND M_PART = '부산북항'
    AND M_DATE BETWEEN ? AND ?;
    `;
    const parameters = [yesterday, today];

    console.log('Executing query:', query2);
    console.log('With parameters:', parameters);

    connection.query(query2, parameters, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            console.error('Failed Query:', query2);
            return res.status(500).json({ error: 'Server error' });
        }

        console.log('Query results:', results);

        if (results.length === 0) {
            console.log(`Container number ${containerNumber} not found`);
            return res.status(404).json({ error: `Container number ${containerNumber} not found` });
        }

        console.log('Extracted M_PORT:', results[0].M_PORT);
        return res.json({ m_port: results[0].M_PORT });
    });
});






// 두동-------------------------------------------------------------------------------------------------------------------------------------------

app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'))  

// '/dudong' 라우트 설정
app.get('/dudong', (req, res) => {
    // 세션에 저장된 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index(두동)', { user: req.session.user });
});



app.post('/api/search-another2', (req, res) => {
    const containerNumber = req.body.containerNumber.trim();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // 입력된 문자열에서 7자리 이상인 부분을 추출
    const searchString = containerNumber.length >= 7 ? containerNumber.substring(containerNumber.length - 7) : '';

    // SQL 쿼리에서 LIKE 연산자를 사용하여 해당 문자열을 검색
    const query3 = `
    SELECT M_PORT
    FROM bo_hacha
    WHERE CON LIKE '%${searchString}'
    AND M_PART = '두동'
    AND M_DATE BETWEEN ? AND ?;
    `;
    const parameters = [yesterday, today];

    console.log('Executing query:', query3);
    console.log('With parameters:', parameters);

    connection.query(query3, parameters, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            console.error('Failed Query:', query3);
            return res.status(500).json({ error: 'Server error' });
        }

        console.log('Query results:', results);

        if (results.length === 0) {
            console.log(`Container number ${containerNumber} not found`);
            return res.status(404).json({ error: `Container number ${containerNumber} not found` });
        }

        console.log('Extracted M_PORT:', results[0].M_PORT);
        return res.json({ m_port: results[0].M_PORT });
    });
});





















//본선 전송확인 ---------------------------------------------------------------------------------------------------------------------------------------------------------------

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

setInterval(() => {
    connection.query('SELECT * FROM ts_work', (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return;
        }

        // 변화 감지 로직 (간단한 예시)
        if (JSON.stringify(results) !== JSON.stringify(lastDataSnapshot)) {
            console.log('데이터에 변화가 감지되었습니다.');
            io.emit('updateData', results); // 클라이언트에게 데이터 업데이트 푸시
            lastDataSnapshot = results; // 스냅샷 업데이트
        }
    });
}, 5000); // 5초마다 데이터베이스 폴링

// LOCAL 페이지에 대한 요청 처리
app.get('/local', function (req, res) {
    res.sendFile(path.join(__dirname, 'local.html'));
});

//로그인 / 회원가입 ---------------------------------------------------------------------------------------------------------------------------------------------------------------

// 회원 가입 함수
function registerUser(name, id, password, phone, car) {
    const sql = `INSERT INTO user (name, id, password, phone, car) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [name, id, password, phone, car], (error, result) => {
        if (error) throw error;
        console.log("사용자 정보가 성공적으로 삽입되었습니다.");
    });
}

// 회원 가입 라우트
app.post('/signup', (req, res) => {
    // 중복된 전화번호와 아이디를 확인하는 로직 추가
    const { NAME, ID, PASSWORD, PHONE, CAR } = req.body;
    
    // 중복된 전화번호가 있는지 확인
    connection.query('SELECT * FROM user WHERE PHONE = ?', [PHONE], (error, results) => {
        if (error) throw error;
        if (results.length > 0) {
            // 중복된 전화번호가 있으면 클라이언트로 경고 메시지 전송
            res.status(400).send('이 연락처는 이미 등록되어 있습니다.');
        } else {
            // 중복된 아이디가 있는지 확인
            connection.query('SELECT * FROM user WHERE ID = ?', [ID], (error, results) => {
                if (error) throw error;
                if (results.length > 0) {
                    // 중복된 아이디가 있으면 클라이언트로 경고 메시지 전송
                    res.status(400).send('이 아이디는 이미 등록되어 있습니다.');
                } else {
                    // 중복된 전화번호와 아이디가 없으면 회원 가입 처리
                    registerUser(NAME, ID, PASSWORD, PHONE, CAR);
                    res.redirect('/');
                }
            });
        }
    });
});

// 로그인
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT PASSWORD, ROLE FROM user WHERE ID = ?';

    connection.query(query, [username], (error, results) => {
        if (error) {
            console.error('쿼리 오류:', error);
            return res.status(500).send('로그인 중 오류 발생');
        }
        if (results.length > 0) {
            // 입력된 비밀번호와 데이터베이스에 저장된 비밀번호를 평문으로 비교
            if (password === results[0].PASSWORD) {
                // 세션에 사용자 정보 저장
                req.session.user = {
                    id: username,
                    role: results[0].ROLE
                };
                res.redirect('/LOGIN');
            } else {
                res.send('아이디 또는 비밀번호가 잘못되었습니다.');
            }
        } else {
            res.send('아이디 또는 비밀번호가 잘못되었습니다.');
        }
    });
});

// 로그아웃 처리
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login'); // 로그아웃 후 로그인 페이지로 리다이렉트
    });
});

// 연결 종료
// connection.end();
