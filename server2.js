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
const port = 3000;
const iconv = require('iconv-lite');

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
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// 세션을 유지하기 위한 간단한 API 라우트
app.get('/keep-session-alive', (req, res) => {
    res.send('Session is refreshed');
});

// Body-parser 미들웨어 사용 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 환경 변수에서 포트 번호를 읽어오도록 설정
const PORT = process.env.PORT || 31681;

// 연결 설정
const dbConfig1 = {
    host: 'svc.sel5.cloudtype.app',
    port: 31681,
    database: 'ts_server',
    user: 'root',
    password: 'rjscjf0739',
    charset: 'utf8mb4'
};

const dbConfig2 = {
    host: '175.125.92.248',
    database: 'db_ezs',
    user: 'incom_user',
    password: 'rlawjdtns00',
    charset: 'utf8'
};

let connection;
let connection2;

function handleDisconnect(dbConfig, connectionName) {
    let conn = mysql.createConnection(dbConfig);

    conn.connect((err) => {
        if (err) {
            console.error(`Error connecting to ${connectionName}:`, err);
            setTimeout(() => handleDisconnect(dbConfig, connectionName), 2000); // 2초 후에 다시 연결 시도
        } else {
            console.log(`Connected to ${connectionName}.`);
        }
    });

    conn.on('error', (err) => {
        console.error(`Database error on ${connectionName}:`, err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(dbConfig, connectionName);
        } else {
            throw err;
        }
    });

    return conn;
}

connection = handleDisconnect(dbConfig1, 'database 1');
connection2 = handleDisconnect(dbConfig2, 'database 2');

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('addData', (newData) => {
        connection.query('INSERT INTO ts_work_new SET ?', newData, (error, results) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                io.emit('errorResponse', '데이터 추가 중 오류 발생');
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // INSERT 성공 후 데이터를 정렬하여 다시 조회
            connection.query('SELECT * FROM ts_work_new WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', (error, sortedResults) => {
                if (error) {
                    console.error('데이터베이스 조회 오류:', error);
                    return;
                }
                // 조회된 정렬된 데이터를 클라이언트에 전송
                io.emit('updateData', sortedResults);
            });
        });
    });

    socket.on('addData', (newData) => {
        connection.query('INSERT INTO ts_work_new SET ?', newData, (error, results) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                io.emit('errorResponse', '데이터 추가 중 오류 발생');
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // INSERT 성공 후 데이터를 정렬하여 다시 조회
            connection.query('SELECT * FROM ts_work_new WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', (error, sortedResults) => {
                if (error) {
                    console.error('데이터베이스 조회 오류:', error);
                    return;
                }
                // 조회된 정렬된 데이터를 클라이언트에 전송
                io.emit('updateData', sortedResults);
            });
        });
    });

    socket.on('addData', (newData) => {
        connection.query('INSERT INTO ts_work_old SET ?', newData, (error, results) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // 데이터 추가 후 정렬된 전체 데이터를 조회
            connection.query('SELECT * FROM ts_work_old WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', (error, sortedResults) => {
                if (error) {
                    console.error('데이터베이스 쿼리 오류:', error);
                    return;
                }
                // 정렬된 데이터를 클라이언트에게 전송
                io.emit('updateData', sortedResults);
            });
        });
    });

    socket.on('addData', (newData2) => {
        connection.query('INSERT INTO ts_work_old SET ?', newData2, (error, results) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                io.emit('errorResponse', '데이터 추가 중 오류 발생');
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // INSERT 성공 후 데이터를 정렬하여 다시 조회
            connection.query('SELECT * FROM ts_work_old ORDER BY COPINO_TIME DESC', (error, sortedResults) => {
                if (error) {
                    console.error('데이터베이스 조회 오류:', error);
                    return;
                }
                // 조회된 정렬된 데이터를 클라이언트에 전송
                io.emit('updateData', sortedResults);
            });
        });
    });

    socket.on('addData', (newData2) => {
        // 새로 추가된 데이터를 데이터베이스에 추가
        connection.query('INSERT INTO ts_work_old SET ?', newData2, (error, results, fields) => {
            if (error) {
                console.error('데이터베이스 쿼리 오류:', error);
                return;
            }
            console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
            // 추가된 데이터를 클라이언트에게 전송하여 추가 요청
            io.emit('addData', newData2);
        });
    });
});


//페이지 권한
function checkRole(allowedRoles) {
    return function(req, res, next) {
        if (!req.session.user || !allowedRoles.includes(req.session.user.role)) {
            return res.redirect('/');
        }
        next();
    };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// 서버 리스닝 부분 변경
server.listen(PORT, () => {
    console.log(`서버가 *:${PORT} 포트에서 실행 중입니다.`);
});


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
        return res.redirect('/');
    }
    res.render('index(로그인 후)', { user: req.session.user });
});











// 관리자 페이지---------------------------------------------------------------------------------

app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'))  

// 관리자 페이지 라우트
app.get('/manager', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'manage') {
        return res.redirect('/');
    }
    res.render('index(관리자)', { user: req.session.user });
});


app.post('/api/search-user', (req, res) => {
    const { id } = req.body;
    connection.query('SELECT * FROM user WHERE ID = ?', [id], (error, results) => {
        if (error) return res.status(500).send('Database query error');
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/api/update-user', (req, res) => {
    const { id, password, phone, car, carId, part, role } = req.body;
    const updateFields = {};
    if (password) updateFields.PASSWORD = password;
    if (phone) updateFields.PHONE = phone;
    if (car) updateFields.CAR = car;
    if (carId) updateFields.CAR_ID = carId;
    if (part) updateFields.PART = part;
    if (role) updateFields.ROLE = role;

    const sql = 'UPDATE user SET ? WHERE ID = ?';
    connection.query(sql, [updateFields, id], (error, results) => {
        if (error) return res.status(500).send('Database update error');
        res.send('User updated');
    });
});

app.get('/api/unassigned-accounts', (req, res) => {
    connection.query('SELECT ID, CAR, PHONE FROM user WHERE ROLE IS NULL', (error, results) => {
        if (error) return res.status(500).send('Database query error');
        res.json(results);
    });
});

















// 이지콘 하차지 조회 ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// '/ezicon' 라우트 설정
app.get('/ezicon', (req, res) => {
    if (!req.session.user || !['manage', 'employee', 'driver', 'company_driver', 'delivery'].includes(req.session.user.role)) {
        return res.redirect('/');
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






// 두동 하차지 조회 -------------------------------------------------------------------------------------------------------------------------------------------

app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'))  

app.get('/dudong', (req, res) => {
    if (!req.session.user || !['manage', 'employee', 'driver', 'company_driver', 'delivery'].includes(req.session.user.role)) {
        return res.redirect('/');
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





// 보관소(신항) 전송확인 -------------------------------------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// '/dudong' 라우트 설정

app.get('/copino_sin', (req, res) => {
    if (!req.session.user || !['manage', 'employee'].includes(req.session.user.role)) {
        return res.redirect('/');
    }

    // 데이터베이스 쿼리 실행
    connection.query('SELECT * FROM ts_work_new', function (error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        // 여기에서 user 객체를 전달하고 있어야 합니다.
        res.render('index(신항)', { data: results, user: req.session.user });
    });
});

// lastChecked 변수를 초기화합니다.
let lastChecked = new Date();

setInterval(() => {
    const now = new Date();

    connection.query('SELECT * FROM ts_work_new WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [lastChecked], (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            io.emit('error', { message: '데이터 조회 중 오류 발생' });
            return;
        }

        if (results.length > 0) {
            io.emit('updateData', results);
        }

        lastChecked = now;
    });
}, 2000);


// '/delete-container' 라우트 설정
app.post('/delete-container', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('인증이 필요합니다.');
    }

    const containerIds = req.body.containerIds;
    if (!containerIds || containerIds.length === 0) {
        return res.status(400).send('삭제할 컨테이너 ID가 지정되지 않았습니다.');
    }

    const placeholders = containerIds.map(() => '?').join(',');
    const sqlQuery = `DELETE FROM ts_work_new WHERE CUNT IN (${placeholders})`;

    connection.query(sqlQuery, containerIds, (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        console.log(`${results.affectedRows}개의 행이 삭제되었습니다.`);
        res.send({ message: `${results.affectedRows}개의 행이 삭제되었습니다.` });
    });
});


// 보관소(북항) 전송확인 -------------------------------------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// '/dudong' 라우트 설정

app.get('/copino_bok', (req, res) => {
    if (!req.session.user || !['manage', 'employee'].includes(req.session.user.role)) {
        return res.redirect('/');
    }
    
    // 데이터베이스 쿼리 실행
    connection.query('SELECT * FROM ts_work_old', function (error, results, fields) {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        // 여기에서 user 객체를 전달하고 있어야 합니다.
        res.render('index(북항)', { data: results, user: req.session.user });
    });
});

// lastChecked 변수를 초기화합니다.
let lastChecked2 = new Date();

setInterval(() => {
    const now = new Date();

    connection.query('SELECT * FROM ts_work_old WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [lastChecked2], (error, results) => {

        
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            io.emit('error', { message: '데이터 조회 중 오류 발생' });
            return;
        }

        if (results.length > 0) {
            io.emit('updateData2', results);
        }

        lastChecked2 = now;
    });
}, 2000);

app.post('/delete-container2', (req, res) => {
    // 사용자 인증 확인
    if (!req.session.user) {
        // 사용자가 인증되지 않은 경우 401 상태 코드와 메시지 반환
        return res.status(401).send('인증이 필요합니다.');
    }

    // 요청에서 컨테이너 ID 목록 추출
    const containerIds = req.body.containerIds;
    if (!containerIds || containerIds.length === 0) {
        // 컨테이너 ID가 지정되지 않은 경우 400 상태 코드와 메시지 반환
        return res.status(400).send('삭제할 컨테이너 ID가 지정되지 않았습니다.');
    }

    // 컨테이너 ID를 SQL 쿼리에 사용할 수 있도록 쿼리문 생성
    const placeholders = containerIds.map(() => '?').join(',');
    const sqlQuery = `DELETE FROM ts_work_old WHERE CUNT IN (${placeholders})`;

    // 데이터베이스 쿼리 실행
    connection.query(sqlQuery, containerIds, (error, results) => {
        if (error) {
            // 오류 발생 시 500 상태 코드와 오류 메시지 반환
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        // 삭제된 행의 수를 로그로 기록하고 응답 반환
        console.log(`${results.affectedRows}개의 행이 삭제되었습니다.`);
        res.send({ message: `${results.affectedRows}개의 행이 삭제되었습니다.` });
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
        res.render('ts', { data: results, user: req.session.user });
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


// 상차접수(컨테이너 번호)-----------------------------------------------------------------------------------------------------------------------------
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/search-container', (req, res) => {
    const { containerNumber } = req.body;
    const trimmedContainerNumber = containerNumber.slice(-7);

    // 입력된 컨테이너 번호를 로그로 출력
    console.log(`검색할 컨테이너 번호: ${containerNumber}`);
    console.log(`검색할 컨테이너 번호 (뒤에서 7자리): ${trimmedContainerNumber}`);

    const selectQuery = `
        SELECT A.CON_NO, CONCAT(Y.Y_LOC_Y, '-', Y.Y_LOC) AS LOC
        FROM T_YARD_INV Y
        LEFT JOIN T_WORK A ON A.W_IDX = Y.W_IDX
        WHERE RIGHT(A.CON_NO, 7) = ?
    `;

    connection2.query(selectQuery, [trimmedContainerNumber], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        // 쿼리 결과를 로그로 출력
        console.log('쿼리 결과:', results);

        if (results.length > 0) {
            // CON_NO와 LOC 값을 배열로 응답으로 반환
            res.json(results);
        } else {
            res.json({ message: '상차할 컨테이너가 없습니다.' });
        }
    });
});

// 클라이언트로부터 컨테이너번호를 받아서 데이터베이스에 삽입하는 엔드포인트
app.post('/insert-order', (req, res) => {
    const { CON_NO } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const userQuery = 'SELECT CAR FROM user WHERE id = ?';

    connection.query(userQuery, [userId], (userError, userResults) => {
        if (userError) {
            console.error('User query error:', userError);
            return res.status(500).json({ error: 'User query error' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const CAR_NO = userResults[0].CAR;

        // MySQL 쿼리 실행 전 SET NAMES 'utf8mb4' 명령어 추가
        connection2.query("SET NAMES 'utf8mb4'", (err) => {
            if (err) {
                console.error('Error setting names:', err);
                return res.status(500).json({ error: 'Error setting names' });
            }

            const selectWorkQuery = `
                SELECT W.W_IDX, CONVERT(CAST(W.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC, W.CON_TYPE, W.CON_NO, W.W_DATE_CYIN,
                       CONCAT(Y.Y_LOC_Y, '-', Y.Y_LOC) AS LOC
                FROM T_WORK W
                LEFT JOIN T_YARD_INV Y ON W.W_IDX = Y.W_IDX
                WHERE W.CON_NO = ?
                ORDER BY W.W_DATE_CYIN DESC
                LIMIT 1
            `;

            connection2.query(selectWorkQuery, [CON_NO], (selectError, selectResults) => {
                if (selectError) {
                    console.error('Database query error:', selectError);
                    return res.status(500).json({ error: 'Database query error' });
                }

                if (selectResults.length === 0) {
                    return res.status(404).json({ error: 'No matching work found' });
                }

                let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC } = selectResults[0];
                console.log('조회된 값:', { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC }); // 디버깅용 로그

                // UTF-8로 변환
                console.log('UTF-8로 변환된 LOC:', LOC);

                // O_IDX 값을 확인하여 이미 상하차 요청서가 있는지 확인
                const checkOrderQuery = `
                    SELECT O_IDX
                    FROM T_WORK_ORDER
                    WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                `;

                connection2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                    if (checkError) {
                        console.error('Check query error:', checkError);
                        return res.status(500).json({ error: 'Check query error' });
                    }

                    if (checkResults.length > 0) {
                        // 이미 상하차 요청서가 있는 경우
                        console.log('이미 상하차 요청서가 있으므로 추가하지 않음');
                        return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                    } else {
                        // 상하차 요청서를 추가해야 하는 경우
                        const O_IO = '상차';
                        const O_MEMO = '홈페이지 접수';
                        const O_DATE_ORDER = moment().format('YYYY-MM-DD');
                        const DATE_INS = moment().format('YYYY-MM-DD HH:mm:ss');

                        const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS];
                        console.log('삽입할 값:', insertValues);

                        const insertQuery = `
                            INSERT INTO T_WORK_ORDER
                            (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                        `;

                        connection2.query(insertQuery, insertValues, (insertError) => {
                            if (insertError) {
                                console.error('Insert query error:', insertError);
                                return res.status(500).json({ error: 'Insert query error' });
                            }

                            // 상차오더번호가 있고 완료 처리해야 하는 경우
                            if (O_IO === '상차' && W_IDX > 0) {
                                const updateSeqQuery = `
                                    UPDATE T_WORK_SEQ
                                    SET S_DONE = 'Y'
                                    WHERE W_IDX = ?
                                `;

                                connection2.query(updateSeqQuery, [W_IDX], (updateError) => {
                                    if (updateError) {
                                        console.error('Update query error:', updateError);
                                        return res.status(500).json({ error: 'Update query error' });
                                    }
                                    res.json({ message: '등록완료', CON_NO, LOC });
                                });
                            } else {
                                res.json({ message: '등록완료', CON_NO, LOC });
                            }
                        });
                    }
                });
            });
        });
    });
});


// 상차접수(상차오더)-----------------------------------------------------------------------------------------------------------------------------

app.post('/search-onorder', (req, res) => {
    const { onorder } = req.body;
    const trimmedonorder = onorder.slice(-3);

    console.log(`검색할 상차 번호: ${onorder}`);
    console.log(`검색할 상차 번호 (뒤에서 3자리): ${trimmedonorder}`);

    const onselectQuery = `
        SELECT S_NO, W_IDX
        FROM t_work_seq
        WHERE RIGHT(S_NO, 3) = ?
        ORDER BY S_DONE
    `;

    connection2.query(onselectQuery, [trimmedonorder], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        console.log('쿼리 결과:', results);

        if (results.length > 0) {
            res.json(results);
        } else {
            res.json({ message: '등록된 상차오더가 없습니다.' });
        }
    });
});

app.post('/insert-onorder', (req, res) => {
    const { S_NO } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const useronQuery = 'SELECT CAR FROM user WHERE id = ?';

    connection.query(useronQuery, [userId], (userError, userResults) => {
        if (userError) {
            console.error('User query error:', userError);
            return res.status(500).json({ error: 'User query error' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const CAR_NO = userResults[0].CAR;

        connection2.query("SET NAMES 'utf8mb4'", (err) => {
            if (err) {
                console.error('Error setting names:', err);
                return res.status(500).json({ error: 'Error setting names' });
            }

            const selectSeqQuery = `
                SELECT S_NO, W_IDX
                FROM t_work_seq
                WHERE S_NO = ? AND S_DONE = 'N'
                ORDER BY S_NO
                LIMIT 1
            `;

            connection2.query(selectSeqQuery, [S_NO], (seqError, seqResults) => {
                if (seqError) {
                    console.error('Database query error:', seqError);
                    return res.status(500).json({ error: 'Database query error' });
                }

                if (seqResults.length === 0) {
                    return res.status(404).json({ error: 'No matching sequence found' });
                }

                const { W_IDX } = seqResults[0];
                console.log('조회된 시퀀스 값:', { S_NO, W_IDX });

                const selectWorkonQuery = `
                    SELECT A.W_IDX, CONVERT(CAST(A.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC, A.CON_TYPE, A.CON_NO, A.W_DATE_CYIN,
                           CONCAT(B.Y_LOC_Y, '-', B.Y_LOC) AS LOC
                    FROM T_WORK A
                    LEFT JOIN T_YARD_INV B ON A.W_IDX = B.W_IDX
                    WHERE A.W_IDX = ?
                    ORDER BY A.W_DATE_CYIN DESC
                    LIMIT 1
                `;

                connection2.query(selectWorkonQuery, [W_IDX], (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Database query error:', selectError);
                        return res.status(500).json({ error: 'Database query error' });
                    }

                    if (selectResults.length === 0) {
                        return res.status(404).json({ error: 'No matching work found' });
                    }

                    let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC } = selectResults[0];
                    console.log('조회된 작업 값:', { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC });

                    const checkOrderQuery = `
                        SELECT O_IDX
                        FROM T_WORK_ORDER
                        WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                    `;

                    connection2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                        if (checkError) {
                            console.error('Check query error:', checkError);
                            return res.status(500).json({ error: 'Check query error' });
                        }

                        if (checkResults.length > 0) {
                            console.log('이미 상하차 요청서가 있으므로 추가하지 않음');
                            return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                        } else {
                            const O_IO = '상차';
                            const O_MEMO = '홈페이지 접수';
                            const O_DATE_ORDER = moment().format('YYYY-MM-DD');
                            const DATE_INS = moment().format('YYYY-MM-DD HH:mm:ss');

                            const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS];
                            console.log('삽입할 값:', insertValues);

                            const insertQuery = `
                                INSERT INTO T_WORK_ORDER
                                (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                            `;

                            connection2.query(insertQuery, insertValues, (insertError) => {
                                if (insertError) {
                                    console.error('Insert query error:', insertError);
                                    return res.status(500).json({ error: 'Insert query error' });
                                }

                                if (O_IO === '상차' && W_IDX > 0) {
                                    const updateSeqQuery = `
                                        UPDATE T_WORK_SEQ
                                        SET S_DONE = 'Y'
                                        WHERE W_IDX = ?
                                    `;

                                    connection2.query(updateSeqQuery, [W_IDX], (updateError) => {
                                        if (updateError) {
                                            console.error('Update query error:', updateError);
                                            return res.status(500).json({ error: 'Update query error' });
                                        }
                                        res.json({ message: '등록완료', CON_NO, LOC });
                                    });
                                } else {
                                    res.json({ message: '등록완료', CON_NO, LOC });
                                }
                            });
                        }
                    });
                });
            });
        });
    });
});

// 하차접수(두동)------------------------------------------------------------------------------------------------------

app.post('/search-container-unload', (req, res) => {
    const { containerNumber, divLoc } = req.body;
    const trimmedContainerNumber = containerNumber.slice(-7);

    console.log(`검색할 컨테이너 번호: ${containerNumber}`);
    console.log(`검색할 컨테이너 번호 (뒤에서 7자리): ${trimmedContainerNumber}`);
    console.log(`DIV_LOC: ${divLoc}`);

    connection2.query("SET NAMES 'utf8mb4'", (err) => {
        if (err) {
            console.error('Error setting names:', err);
            return res.status(500).json({ error: 'Error setting names' });
        }

        const selectQuery = `
            SELECT B.CON_NO, B.W_IDX, B.W_LOC_WISH AS WISH, CONVERT(CAST(B.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC
            FROM T_WORK B
            WHERE RIGHT(B.CON_NO, 7) = ?
              AND CONVERT(CAST(B.DIV_LOC AS BINARY) USING utf8mb4) = ?
              AND B.W_DONE_CY = 'N'
              AND B.W_DEL = 'N'
              AND NOT EXISTS (
                  SELECT 1
                  FROM T_YARD_INV Y
                  LEFT JOIN T_WORK A ON A.W_IDX = Y.W_IDX
                  WHERE RIGHT(A.CON_NO, 7) = ?
                    AND A.W_DONE_CY = 'N'
                    AND A.W_DEL = 'N'
                    AND A.W_IDX = B.W_IDX
              )
        `;

        const queryValues = [trimmedContainerNumber, divLoc, trimmedContainerNumber];

        console.log('Executing query:', selectQuery);
        console.log('With values:', queryValues);

        connection2.query(selectQuery, queryValues, (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({ error: 'Database query error' });
            }

            console.log('쿼리 결과:', results);

            if (results.length > 0) {
                res.json(results[0]); // W_IDX 포함된 첫 번째 결과 반환
            } else {
                res.json({ message: '등록된 컨테이너 없음.(사무실 문의)' });
            }
        });
    });
});

app.post('/insert-unload-order', (req, res) => {
    const { CON_NO, W_IDX } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const userQuery = 'SELECT CAR FROM user WHERE id = ?';

    connection.query(userQuery, [userId], (userError, userResults) => {
        if (userError) {
            console.error('User query error:', userError);
            return res.status(500).json({ error: 'User query error' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const CAR_NO = userResults[0].CAR;

        connection2.query("SET NAMES 'utf8mb4'", (err) => {
            if (err) {
                console.error('Error setting names:', err);
                return res.status(500).json({ error: 'Error setting names' });
            }

            const selectWorkQuery = `
                SELECT W.W_IDX, CONVERT(CAST(W.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC, W.CON_TYPE, W.CON_NO, W.W_LOC_WISH AS WISH
                FROM T_WORK W
                WHERE W.W_IDX = ? AND W.W_DONE_CY = 'N' AND W.W_DEL = 'N'
                LIMIT 1
            `;

            connection2.query(selectWorkQuery, [W_IDX], (selectError, selectResults) => {
                if (selectError) {
                    console.error('Database query error:', selectError);
                    return res.status(500).json({ error: 'Database query error' });
                }

                if (selectResults.length === 0) {
                    return res.status(404).json({ error: 'No matching work found' });
                }

                let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, WISH } = selectResults[0];
                console.log('조회된 값:', { W_IDX, DIV_LOC, CON_TYPE, CON_NO, WISH });

                const checkOrderQuery = `
                    SELECT O_IDX
                    FROM T_WORK_ORDER
                    WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                `;

                connection2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                    if (checkError) {
                        console.error('Check query error:', checkError);
                        return res.status(500).json({ error: 'Check query error' });
                    }

                    if (checkResults.length > 0) {
                        console.log('이미 하차 요청서가 있으므로 추가하지 않음');
                        return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                    } else {
                        const O_IO = '하차';
                        const O_MEMO = '홈페이지 접수';
                        const O_DATE_ORDER = moment().format('YYYY-MM-DD');
                        const DATE_INS = moment().format('YYYY-MM-DD HH:mm:ss');

                        const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS, WISH];
                        console.log('삽입할 값:', insertValues);

                        const insertQuery = `
                            INSERT INTO T_WORK_ORDER
                            (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS, O_LOC_WISH)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                        `;

                        connection2.query(insertQuery, insertValues, (insertError) => {
                            if (insertError) {
                                console.error('Insert query error:', insertError);
                                return res.status(500).json({ error: 'Insert query error' });
                            }

                            res.json({ message: '등록완료', CON_NO, LOC: DIV_LOC });
                        });
                    }
                });
            });
        });
    });
});

