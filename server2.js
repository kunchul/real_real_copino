const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser'); 
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const mysql = require('mysql');
const path = require('path');
let lastDataSnapshot = [];
const bcrypt = require('bcryptjs');
const session = require('express-session');
const iconv = require('iconv-lite');
const cron = require('node-cron');
const { exec } = require('child_process');

const moment = require('moment-timezone');
const timezone = 'Asia/Seoul';

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

// 서버 시작 시 cron 스케줄러 초기화
cron.schedule('0 6 * * *', () => { // 매일 오전 6시에 실행
    console.log('Scheduled restart at 06:00 AM');
    exec('pm2 restart joweb', (err, stdout, stderr) => { // 'joweb'은 pm2로 실행한 서버 이름
        if (err) {
            console.error(`Error restarting server: ${err}`);
            return;
        }
        console.log(`Server restart output: ${stdout}`);
        console.error(`Server restart errors: ${stderr}`);
    });
});

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

function createConnection(dbConfig) {
    return mysql.createConnection(dbConfig);
}

function queryWithReconnect(dbConfig, query, params, callback) {
    const conn = createConnection(dbConfig);
    conn.connect((err) => {
        if (err) {
            console.error(`Error connecting to database:`, err);
            callback(err, null, null);
            conn.end();
            return;
        }
        conn.query(query, params, (error, results, fields) => {
            if (error) {
                console.error(`Query error on database:`, error);
                callback(error, results, fields);
                conn.end();
                return;
            }
            callback(null, results, fields);
            conn.end();
        });
    });
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('addData', (newData) => {
        const conn = createConnection(dbConfig1);
        conn.connect((err) => {
            if (err) {
                console.error('데이터베이스 연결 오류:', err);
                io.emit('errorResponse', '데이터베이스 연결 중 오류 발생');
                return;
            }
            conn.query('INSERT INTO ts_work_new SET ?', newData, (error, results) => {
                if (error) {
                    console.error('데이터베이스 쿼리 오류:', error);
                    io.emit('errorResponse', '데이터 추가 중 오류 발생');
                    conn.end();
                    return;
                }
                console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
                conn.query('SELECT * FROM ts_work_new WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [], (error, sortedResults) => {
                    if (error) {
                        console.error('데이터베이스 조회 오류:', error);
                        conn.end();
                        return;
                    }
                    io.emit('updateData', sortedResults);
                    conn.end();
                });
            });
        });
    });

    socket.on('addData', (newData) => {
        const conn = createConnection(dbConfig1);
        conn.connect((err) => {
            if (err) {
                console.error('데이터베이스 연결 오류:', err);
                io.emit('errorResponse', '데이터베이스 연결 중 오류 발생');
                return;
            }
            conn.query('INSERT INTO ts_work_old SET ?', newData, (error, results) => {
                if (error) {
                    console.error('데이터베이스 쿼리 오류:', error);
                    io.emit('errorResponse', '데이터 추가 중 오류 발생');
                    conn.end();
                    return;
                }
                console.log('새로운 데이터를 데이터베이스에 추가했습니다.');
                conn.query('SELECT * FROM ts_work_old WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [], (error, sortedResults) => {
                    if (error) {
                        console.error('데이터베이스 조회 오류:', error);
                        conn.end();
                        return;
                    }
                    io.emit('updateData', sortedResults);
                    conn.end();
                });
            });
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
    queryWithReconnect(dbConfig1, 'SELECT * FROM user WHERE ID = ?', [id], (error, results) => {
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
    queryWithReconnect(dbConfig1, sql, [updateFields, id], (error, results) => {
        if (error) return res.status(500).send('Database update error');
        res.send('User updated');
    });
});

app.get('/api/unassigned-accounts', (req, res) => {
    queryWithReconnect(dbConfig1, 'SELECT ID, CAR, PHONE FROM user WHERE ROLE IS NULL', [], (error, results) => {
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

    const searchString = containerNumber.length >= 7 ? containerNumber.substring(containerNumber.length - 7) : '';

    const query2 = `
    SELECT M_PORT
    FROM bo_hacha
    WHERE CON LIKE '%${searchString}'
    AND M_PART = '부산북항'
    AND M_DATE BETWEEN ? AND ?;
    `;
    const parameters = [yesterday, today];

    queryWithReconnect(dbConfig1, query2, parameters, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: `Container number ${containerNumber} not found` });
        }

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

    const searchString = containerNumber.length >= 7 ? containerNumber.substring(containerNumber.length - 7) : '';

    const query3 = `
    SELECT M_PORT
    FROM bo_hacha
    WHERE CON LIKE '%${searchString}'
    AND M_PART = '두동'
    AND M_DATE BETWEEN ? AND ?;
    `;
    const parameters = [yesterday, today];

    queryWithReconnect(dbConfig1, query3, parameters, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: `Container number ${containerNumber} not found` });
        }

        return res.json({ m_port: results[0].M_PORT });
    });
});

// 보관소(신항) 전송확인 -------------------------------------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/copino_sin', (req, res) => {
    if (!req.session.user || !['manage', 'employee'].includes(req.session.user.role)) {
        return res.redirect('/');
    }

    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work_new', [], (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        res.render('index(신항)', { data: results, user: req.session.user });
    });
});

let lastChecked = new Date();

setInterval(() => {
    const now = new Date();

    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work_new WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [lastChecked], (error, results) => {
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

    queryWithReconnect(dbConfig1, sqlQuery, containerIds, (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        res.send({ message: `${results.affectedRows}개의 행이 삭제되었습니다.` });
    });
});

// 보관소(북항) 전송확인 -------------------------------------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/copino_bok', (req, res) => {
    if (!req.session.user || !['manage', 'employee'].includes(req.session.user.role)) {
        return res.redirect('/');
    }

    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work_old', [], (error, results) => {
        if (error) {
            console.error('데이터베이스 쿼리 오류:', error);
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        res.render('index(북항)', { data: results, user: req.session.user });
    });
});

let lastChecked2 = new Date();

setInterval(() => {
    const now = new Date();

    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work_old WHERE CUNT > ? ORDER BY COPINO_TIME DESC;', [lastChecked2], (error, results) => {
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
    if (!req.session.user) {
        return res.status(401).send('인증이 필요합니다.');
    }

    const containerIds = req.body.containerIds;
    if (!containerIds || containerIds.length === 0) {
        return res.status(400).send('삭제할 컨테이너 ID가 지정되지 않았습니다.');
    }

    const placeholders = containerIds.map(() => '?').join(',');
    const sqlQuery = `DELETE FROM ts_work_old WHERE CUNT IN (${placeholders})`;

    queryWithReconnect(dbConfig1, sqlQuery, containerIds, (error, results) => {
        if (error) {
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        res.send({ message: `${results.affectedRows}개의 행이 삭제되었습니다.` });
    });
});

//본선 전송확인 ---------------------------------------------------------------------------------------------------------------------------------------------------------------

app.get('/TS', (req, res) => {
    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work', [], (error, results) => {
        if (error) {
            return res.status(500).send('데이터베이스 쿼리 오류');
        }

        res.render('ts', { data: results, user: req.session.user });
    });
});

setInterval(() => {
    queryWithReconnect(dbConfig1, 'SELECT * FROM ts_work', [], (error, results) => {
        if (error) {
            return;
        }

        if (JSON.stringify(results) !== JSON.stringify(lastDataSnapshot)) {
            io.emit('updateData', results);
            lastDataSnapshot = results;
        }
    });
}, 5000);

//로그인 / 회원가입 ---------------------------------------------------------------------------------------------------------------------------------------------------------------

// 회원 가입 함수
function registerUser(name, id, password, phone, car) {
    const sql = `INSERT INTO user (name, id, password, phone, car) VALUES (?, ?, ?, ?, ?)`;
    queryWithReconnect(dbConfig1, sql, [name, id, password, phone, car], (error, result) => {
        if (error) throw error;
        console.log("사용자 정보가 성공적으로 삽입되었습니다.");
    });
}

// 회원 가입 라우트
app.post('/signup', (req, res) => {
    const { NAME, ID, PASSWORD, PHONE, CAR } = req.body;

    queryWithReconnect(dbConfig1, 'SELECT * FROM user WHERE PHONE = ?', [PHONE], (error, results) => {
        if (error) throw error;
        if (results.length > 0) {
            res.status(400).send('이 연락처는 이미 등록되어 있습니다.');
        } else {
            queryWithReconnect(dbConfig1, 'SELECT * FROM user WHERE ID = ?', [ID], (error, results) => {
                if (error) throw error;
                if (results.length > 0) {
                    res.status(400).send('이 아이디는 이미 등록되어 있습니다.');
                } else {
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

    queryWithReconnect(dbConfig1, query, [username], (error, results) => {
        if (error) {
            console.error('쿼리 오류:', error);
            return res.status(500).send('로그인 중 오류 발생');
        }
        if (results.length > 0) {
            if (password === results[0].PASSWORD) {
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
        res.redirect('/login');
    });
});

// 상차접수(컨테이너 번호)-----------------------------------------------------------------------------------------------------------------------------

app.post('/search-container', (req, res) => {
    const { containerNumber } = req.body;
    const trimmedContainerNumber = containerNumber.slice(-7);

    const selectQuery = `
        SELECT A.CON_NO, CONCAT(Y.Y_LOC_Y, '-', Y.Y_LOC) AS LOC
        FROM T_YARD_INV Y
        LEFT JOIN T_WORK A ON A.W_IDX = Y.W_IDX
        WHERE RIGHT(A.CON_NO, 7) = ?
    `;

    queryWithReconnect(dbConfig2, selectQuery, [trimmedContainerNumber], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length > 0) {
            res.json(results);
        } else {
            res.json({ message: '상차할 컨테이너가 없습니다.' });
        }
    });
});

app.post('/insert-order', (req, res) => {
    const { CON_NO } = req.body;
    const userId = req.session.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const userQuery = 'SELECT CAR FROM user WHERE id = ?';

    const conn1 = createConnection(dbConfig1);
    conn1.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        conn1.query(userQuery, [userId], (userError, userResults) => {
            if (userError) {
                conn1.end();
                return res.status(500).json({ error: 'User query error' });
            }

            if (userResults.length === 0) {
                conn1.end();
                return res.status(404).json({ error: 'User not found' });
            }

            const CAR_NO = userResults[0].CAR;
            conn1.end();

            const conn2 = createConnection(dbConfig2);
            conn2.connect((err) => {
                if (err) {
                    console.error('데이터베이스 연결 오류:', err);
                    return res.status(500).json({ error: 'Database connection error' });
                }

                conn2.query("SET NAMES 'utf8mb4'", [], (err) => {
                    if (err) {
                        conn2.end();
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

                    conn2.query(selectWorkQuery, [CON_NO], (selectError, selectResults) => {
                        if (selectError) {
                            conn2.end();
                            return res.status(500).json({ error: 'Database query error' });
                        }

                        if (selectResults.length === 0) {
                            conn2.end();
                            return res.status(404).json({ error: 'No matching work found' });
                        }

                        let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC } = selectResults[0];

                        const checkOrderQuery = `
                            SELECT O_IDX
                            FROM T_WORK_ORDER
                            WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                        `;

                        conn2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                            if (checkError) {
                                conn2.end();
                                return res.status(500).json({ error: 'Check query error' });
                            }

                            if (checkResults.length > 0) {
                                conn2.end();
                                return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                            } else {
                                const O_IO = '상차';
                                const O_MEMO = '홈페이지 접수';
                                const O_DATE_ORDER = moment().tz(timezone).format('YYYY-MM-DD');
                                const DATE_INS = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');


                                const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS];

                                const insertQuery = `
                                    INSERT INTO T_WORK_ORDER
                                    (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                                `;

                                conn2.query(insertQuery, insertValues, (insertError) => {
                                    if (insertError) {
                                        conn2.end();
                                        return res.status(500).json({ error: 'Insert query error' });
                                    }

                                    if (O_IO === '상차' && W_IDX > 0) {
                                        const updateSeqQuery = `
                                            UPDATE T_WORK_SEQ
                                            SET S_DONE = 'Y'
                                            WHERE W_IDX = ?
                                        `;

                                        conn2.query(updateSeqQuery, [W_IDX], (updateError) => {
                                            conn2.end();
                                            if (updateError) {
                                                return res.status(500).json({ error: 'Update query error' });
                                            }
                                            res.json({ message: '등록완료', CON_NO, LOC });
                                        });
                                    } else {
                                        conn2.end();
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
});

// 상차접수(상차오더)-----------------------------------------------------------------------------------------------------------------------------

app.post('/search-onorder', (req, res) => {
    const { onorder } = req.body;
    const trimmedonorder = onorder.slice(-3);

    const onselectQuery = `
        SELECT S_NO, W_IDX
        FROM t_work_seq
        WHERE RIGHT(S_NO, 3) = ?
        ORDER BY S_DONE
    `;

    queryWithReconnect(dbConfig2, onselectQuery, [trimmedonorder], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query error' });
        }

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

    const conn1 = createConnection(dbConfig1);
    conn1.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        conn1.query(useronQuery, [userId], (userError, userResults) => {
            if (userError) {
                conn1.end();
                return res.status(500).json({ error: 'User query error' });
            }

            if (userResults.length === 0) {
                conn1.end();
                return res.status(404).json({ error: 'User not found' });
            }

            const CAR_NO = userResults[0].CAR;
            conn1.end();

            const conn2 = createConnection(dbConfig2);
            conn2.connect((err) => {
                if (err) {
                    console.error('데이터베이스 연결 오류:', err);
                    return res.status(500).json({ error: 'Database connection error' });
                }

                conn2.query("SET NAMES 'utf8mb4'", [], (err) => {
                    if (err) {
                        conn2.end();
                        return res.status(500).json({ error: 'Error setting names' });
                    }

                    const selectSeqQuery = `
                        SELECT S_NO, W_IDX
                        FROM t_work_seq
                        WHERE S_NO = ? AND S_DONE = 'N'
                        ORDER BY S_NO
                        LIMIT 1
                    `;

                    conn2.query(selectSeqQuery, [S_NO], (seqError, seqResults) => {
                        if (seqError) {
                            conn2.end();
                            return res.status(500).json({ error: 'Database query error' });
                        }

                        if (seqResults.length === 0) {
                            conn2.end();
                            return res.status(404).json({ error: 'No matching sequence found' });
                        }

                        const { W_IDX } = seqResults[0];

                        const selectWorkonQuery = `
                            SELECT A.W_IDX, CONVERT(CAST(A.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC, A.CON_TYPE, A.CON_NO, A.W_DATE_CYIN,
                                   CONCAT(B.Y_LOC_Y, '-', B.Y_LOC) AS LOC
                            FROM T_WORK A
                            LEFT JOIN T_YARD_INV B ON A.W_IDX = B.W_IDX
                            WHERE A.W_IDX = ?
                            ORDER BY A.W_DATE_CYIN DESC
                            LIMIT 1
                        `;

                        conn2.query(selectWorkonQuery, [W_IDX], (selectError, selectResults) => {
                            if (selectError) {
                                conn2.end();
                                return res.status(500).json({ error: 'Database query error' });
                            }

                            if (selectResults.length === 0) {
                                conn2.end();
                                return res.status(404).json({ error: 'No matching work found' });
                            }

                            let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, LOC } = selectResults[0];

                            const checkOrderQuery = `
                                SELECT O_IDX
                                FROM T_WORK_ORDER
                                WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                            `;

                            conn2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                                if (checkError) {
                                    conn2.end();
                                    return res.status(500).json({ error: 'Check query error' });
                                }

                                if (checkResults.length > 0) {
                                    conn2.end();
                                    return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                                } else {
                                    const O_IO = '상차';
                                    const O_MEMO = '홈페이지 접수';
                                    const O_DATE_ORDER = moment().tz(timezone).format('YYYY-MM-DD');
                                    const DATE_INS = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');


                                    const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS];

                                    const insertQuery = `
                                        INSERT INTO T_WORK_ORDER
                                        (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                                    `;

                                    conn2.query(insertQuery, insertValues, (insertError) => {
                                        if (insertError) {
                                            conn2.end();
                                            return res.status(500).json({ error: 'Insert query error' });
                                        }

                                        if (O_IO === '상차' && W_IDX > 0) {
                                            const updateSeqQuery = `
                                                UPDATE T_WORK_SEQ
                                                SET S_DONE = 'Y'
                                                WHERE W_IDX = ?
                                            `;

                                            conn2.query(updateSeqQuery, [W_IDX], (updateError) => {
                                                conn2.end();
                                                if (updateError) {
                                                    return res.status(500).json({ error: 'Update query error' });
                                                }
                                                res.json({ message: '등록완료', CON_NO, LOC });
                                            });
                                        } else {
                                            conn2.end();
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
    });
});

// 하차접수(두동)------------------------------------------------------------------------------------------------------

app.post('/search-container-unload', (req, res) => {
    const { containerNumber, divLoc } = req.body;
    const trimmedContainerNumber = containerNumber.slice(-7);

    const conn = createConnection(dbConfig2);
    conn.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        conn.query("SET NAMES 'utf8mb4'", [], (err) => {
            if (err) {
                conn.end();
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

            conn.query(selectQuery, queryValues, (error, results) => {
                conn.end();
                if (error) {
                    console.error('Database query error:', error);
                    return res.status(500).json({ error: 'Database query error' });
                }

                if (results.length > 0) {
                    res.json(results[0]);
                } else {
                    res.json({ message: '등록된 컨테이너 없음.(사무실 문의)' });
                }
            });
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

    const conn1 = createConnection(dbConfig1);
    conn1.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        conn1.query(userQuery, [userId], (userError, userResults) => {
            if (userError) {
                conn1.end();
                return res.status(500).json({ error: 'User query error' });
            }

            if (userResults.length === 0) {
                conn1.end();
                return res.status(404).json({ error: 'User not found' });
            }

            const CAR_NO = userResults[0].CAR;
            conn1.end();

            const conn2 = createConnection(dbConfig2);
            conn2.connect((err) => {
                if (err) {
                    console.error('데이터베이스 연결 오류:', err);
                    return res.status(500).json({ error: 'Database connection error' });
                }

                conn2.query("SET NAMES 'utf8mb4'", [], (err) => {
                    if (err) {
                        conn2.end();
                        return res.status(500).json({ error: 'Error setting names' });
                    }

                    const selectWorkQuery = `
                        SELECT W.W_IDX, CONVERT(CAST(W.DIV_LOC AS BINARY) USING utf8mb4) AS DIV_LOC, W.CON_TYPE, W.CON_NO, W.W_LOC_WISH AS WISH
                        FROM T_WORK W
                        WHERE W.W_IDX = ? AND W.W_DONE_CY = 'N' AND W.W_DEL = 'N'
                        LIMIT 1
                    `;

                    conn2.query(selectWorkQuery, [W_IDX], (selectError, selectResults) => {
                        if (selectError) {
                            conn2.end();
                            return res.status(500).json({ error: 'Database query error' });
                        }

                        if (selectResults.length === 0) {
                            conn2.end();
                            return res.status(404).json({ error: 'No matching work found' });
                        }

                        let { W_IDX, DIV_LOC, CON_TYPE, CON_NO, WISH } = selectResults[0];

                        const checkOrderQuery = `
                            SELECT O_IDX
                            FROM T_WORK_ORDER
                            WHERE W_IDX = ? AND O_DONE = 'N' AND O_DEL = 'N'
                        `;

                        conn2.query(checkOrderQuery, [W_IDX], (checkError, checkResults) => {
                            if (checkError) {
                                conn2.end();
                                return res.status(500).json({ error: 'Check query error' });
                            }

                            if (checkResults.length > 0) {
                                conn2.end();
                                return res.status(200).json({ status: 'exists', message: '이미 접수된 컨테이너 번호입니다.' });
                            } else {
                                const O_IO = '하차';
                                const O_MEMO = '홈페이지 접수';
                                const O_DATE_ORDER = moment().tz(timezone).format('YYYY-MM-DD');
                                const DATE_INS = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
                                

                                const insertValues = [DIV_LOC, O_DATE_ORDER, CAR_NO, CON_TYPE, O_IO, W_IDX, O_MEMO, DATE_INS, WISH];

                                const insertQuery = `
                                    INSERT INTO T_WORK_ORDER
                                    (DIV_LOC, O_DATE_ORDER, CAR_NO, CON_KU, O_IO, W_IDX, O_MEMO, DATE_INS, O_LOC_WISH)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                                `;

                                conn2.query(insertQuery, insertValues, (insertError) => {
                                    conn2.end();
                                    if (insertError) {
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
    });
});


//우암-------------------------------------------------------------------------------------------------------------------------------------------------
app.get('/uam', (req, res) => {
    if (!req.session.user || !['manage', 'employee', 'driver', 'company_driver', 'delivery'].includes(req.session.user.role)) {
        return res.redirect('/');
    }
    res.render('index(우암)', { user: req.session.user });
});


app.post('/insert-CYunload-order', (req, res) => {
    const { releaseNumberPrefix, releaseNumber, shipperName } = req.body;
    const userId = req.session.user.id;



    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const userQuery = 'SELECT CAR AS CAR_NO, PHONE AS CAR_HP FROM user WHERE id = ?';

    const conn1 = createConnection(dbConfig1);
    conn1.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        conn1.query(userQuery, [userId], (userError, userResults) => {
            if (userError) {
                conn1.end();
                return res.status(500).json({ error: 'User query error' });
            }

            if (userResults.length === 0) {
                conn1.end();
                return res.status(404).json({ error: 'User not found' });
            }

            const { CAR_NO, CAR_HP } = userResults[0];
            conn1.end();

            const conn2 = createConnection(dbConfig2);
            conn2.connect((err) => {
                if (err) {
                    console.error('데이터베이스 연결 오류:', err);
                    return res.status(500).json({ error: 'Database connection error' });
                }


                const query = `
                    SELECT R_IDX, R_LOC
                    FROM T_CODE_REL
                    WHERE R_PREFIX = ?
                      AND R_HOLD = 'N'
                      AND R_DEL = 'N'
                      AND R_DONE = 'N'
                      AND R_NO = ?
                    LIMIT 1
                `;
                conn2.query(query, [releaseNumberPrefix, releaseNumber], (error, results) => {
                    if (error) {
                        conn2.end();
                        return res.status(500).json({ error: 'Query error' });
                    }

                    if (results.length === 0) {
                        conn2.end();
                        return res.status(404).json({ error: '등록된 릴리즈번호가 없음.(사무실확인)' });
                    }

                    const { R_IDX, R_LOC } = results[0];

                    const qtyQuery = `
                        SELECT A.R_QTY, IFNULL(COUNT(B.R_IDX), 0) AS QTY
                        FROM T_CODE_REL A
                        LEFT JOIN T_WORK_ORDER_CY B ON A.R_IDX = B.R_IDX
                        WHERE B.O_DEL = 'N'
                          AND A.R_IDX = ?
                        GROUP BY A.R_IDX, A.R_QTY
                    `;
                    conn2.query(qtyQuery, [R_IDX], (qtyError, qtyResults) => {
                        if (qtyError) {
                            conn2.end();
                            return res.status(500).json({ error: 'Query error' });
                        }

                        const { R_QTY, QTY } = qtyResults[0] || { R_QTY: 0, QTY: 0 };

                        console.log('Quantity results:', qtyResults[0]);

                        if (QTY > R_QTY) {
                            conn2.end();
                            return res.status(400).json({ error: `반출수량이 초과한 부킹.(사무실확인)]` });
                        }
                        
                        const O_IO = '상차';
                        const O_MEMO = '홈페이지 접수';
                        const timezone = 'Asia/Seoul'; // 예시로 서울 시간대를 사용했습니다.
                        const O_DATE_ORDER = moment().tz(timezone).format('YYYY-MM-DD');
                        const DATE_INS = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
                        
                        const insertQuery = `
                        INSERT INTO T_WORK_ORDER_CY
                        (DIV_LOC, O_DATE_ORDER, O_LOC_WISH, CAR_NO, C_NAME, CAR_HP, O_IO, R_IDX, O_MEMO, DATE_INS, O_IS_BONSUN)
                        VALUES
                        (CONVERT(CAST(? AS BINARY) USING utf8mb4), ?, ?, CONVERT(CAST(? AS BINARY) USING utf8mb4), CONVERT(CAST(? AS BINARY) USING utf8mb4), ?, CONVERT(CAST(? AS BINARY) USING utf8mb4), ?, CONVERT(CAST(? AS BINARY) USING utf8mb4), ?, 'Y')
                    `;
                        
                        const insertValues = ['우암CY', O_DATE_ORDER, R_LOC, CAR_NO, shipperName, CAR_HP, O_IO, R_IDX, O_MEMO, DATE_INS];
                        conn2.query(insertQuery, insertValues, (insertError) => {
                            conn2.end();
                            if (insertError) {
                                return res.status(500).json({ error: 'Insert error' });
                            }
                            res.json({ status: 'success', message: '상차 접수 완료.' });
                        });
                    });
                });
            });
        });
    });
});

app.get('/get-release-prefixes', (req, res) => {
    const query = `
        SELECT DISTINCT R_PREFIX
        FROM T_CODE_REL
        WHERE R_DONE = 'N'
          AND R_DEL = 'N'
          AND R_HOLD = 'N'
    `;
    const conn = createConnection(dbConfig2);
    conn.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }
        conn.query(query, (error, results) => {
            conn.end();
            if (error) {
                return res.status(500).json({ error: 'Query error' });
            }
            res.json(results);
        });
    });
});
