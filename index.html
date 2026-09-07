<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>일학습병행 VOC 관리일지</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #333; font-size: 24px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;}
        .stats { display: flex; gap: 20px; margin-bottom: 20px; background: #f1f5f9; padding: 20px; border-radius: 8px; }
        .stat-box { flex: 1; text-align: center; }
        .stat-box p { margin: 0 0 5px 0; color: #555; font-weight: bold; }
        .stat-box h2 { margin: 0; font-size: 32px; color: #0056b3; }
        .filters { display: flex; gap: 10px; margin-bottom: 20px; }
        select, input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
        .voc-list { list-style: none; padding: 0; margin: 0; }
        .voc-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;}
        .voc-item strong { font-size: 16px; color: #222; }
        .status-badge { background: #28a745; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .status-pending { background: #ffc107; color: black; }
    </style>
</head>
<body>
    <div class="container">
        <h1>특화대학 일학습병행 커뮤니티 VOC 관리일지</h1>
        
        <div class="stats">
            <div class="stat-box"><p>누적 접수</p><h2>85건</h2></div>
            <div class="stat-box"><p>조치 완료</p><h2 style="color: #28a745;">54건</h2></div>
            <div class="stat-box"><p>완료율</p><h2>63.5%</h2></div>
        </div>

        <div class="filters">
            <select id="statusFilter" onchange="filterData()">
                <option value="all">전체 상태</option>
                <option value="완료">조치 완료</option>
                <option value="진행중">검토·진행</option>
            </select>
            <input type="text" id="searchInput" onkeyup="filterData()" placeholder="검색어를 입력하세요..." style="flex: 1;">
        </div>

        <ul class="voc-list" id="vocList"></ul>
    </div>

    <script>
        // 향후 구글 드라이브에 있는 실제 일학습병행제 데이터를 바탕으로 이곳을 교체합니다.
        // 현재는 작동을 확인하기 위한 임시 기초 데이터입니다.
        const vocData = [
            { id: 1, title: "훈련과정 편성 기준 및 지원금 문의", status: "완료", date: "2026-08-25" },
            { id: 2, title: "훈련지원시스템(HRD-Net) 연동 오류 요청", status: "진행중", date: "2026-09-04" },
            { id: 3, title: "OJT 현장 훈련 교재 배포 시기 질문", status: "완료", date: "2026-08-20" }
        ];

        // 데이터를 화면에 그려주는 기능
        function renderList(dataToRender) {
            const list = document.getElementById('vocList');
            list.innerHTML = '';
            
            dataToRender.forEach(item => {
                const badgeClass = item.status === '완료' ? 'status-badge' : 'status-badge status-pending';
                list.innerHTML += `
                    <li class="voc-item">
                        <div>
                            <strong>${item.title}</strong>
                            <div style="color: #666; font-size: 13px; margin-top: 5px;">접수일: ${item.date}</div>
                        </div>
                        <div>
                            <span class="${badgeClass}">${item.status}</span>
                        </div>
                    </li>
                `;
            });
        }
        
        // 검색 및 상태 필터링 기능 (엑셀의 필터 역할)
        function filterData() {
            const status = document.getElementById('statusFilter').value;
            const keyword = document.getElementById('searchInput').value;
            
            const filteredData = vocData.filter(item => {
                const matchStatus = status === 'all' || item.status === status;
                const matchKeyword = item.title.includes(keyword);
                return matchStatus && matchKeyword;
            });
            
            renderList(filteredData);
        }

        // 웹페이지가 처음 열릴 때 전체 데이터를 한 번 화면에 그립니다.
        renderList(vocData);
    </script>
</body>
</html>
