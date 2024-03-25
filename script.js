// 데이터를 서버로부터 가져와서 테이블을 업데이트하는 함수
function fetchDataAndUpdateTable() {
    fetch('/TS') // '/TS'는 서버에서 데이터를 제공하는 엔드포인트입니다.
        .then(response => response.json()) // 응답을 JSON으로 변환
        .then(data => {
            // 테이블 내용 업데이트 로직 작성
            // 예: document.getElementById('ts').innerHTML = ...;
        })
        .catch(error => console.error('Error fetching data:', error));
}

// 페이지 로드 시 함수를 즉시 실행하고, 이후 5초마다 반복 실행
fetchDataAndUpdateTable();
setInterval(fetchDataAndUpdateTable, 5000);