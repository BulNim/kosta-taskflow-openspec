## 1. 디자인 토큰 — 다크 매핑

- [x] 1.1 `frontend/css/tokens.css`에 `html[data-theme="dark"]` 블록 추가, 모든 색상 변수 오버라이드
- [x] 1.2 색상 외 토큰(간격·radius·shadow)은 라이트와 공유 (변경 없음). shadow는 다크에서 더 진하게 조정
- [x] 1.3 `color`/`background-color`/`border-color` transition (0.15s ease) 적용

## 2. 테마 적용 로직

- [x] 2.1 `frontend/js/theme.js` 작성 — 모드 결정(`stored | system`), data-theme 설정, localStorage save/load, matchMedia 리스너
- [x] 2.2 `theme.js`에서 export: `applyInitial()`, `cycle()`, `getEffective()`, `getStored()`, `setTheme()`, `onChange()`, `renderThemeToggle()`
- [x] 2.3 모든 페이지 `<head>`에 FOUC 방지 인라인 스크립트 1줄 (localStorage 읽고 즉시 `data-theme` 설정)

## 3. 토글 UI 컴포넌트

- [x] 3.1 `theme.js`에 `renderThemeToggle(target, opts)` 함수 추가 (target에 button 주입, 3상태 아이콘 ☀️/🌙/🖥️)
- [x] 3.2 클릭 시 cycle, 아이콘·접근성 라벨(aria-label) 갱신, onChange 리스너로 시스템 모드도 자동 갱신
- [x] 3.3 헤더 있는 페이지(`header.js`)에 토글 삽입 — 로그아웃 옆 슬롯
- [x] 3.4 헤더 없는 페이지(login)에 fixed 우상단 compact 토글, teams.html 자체 헤더에 토글

## 4. 페이지별 통합

- [x] 4.1 `frontend/index.html`에 FOUC 인라인 추가
- [x] 4.2 `frontend/pages/login.html` — FOUC 인라인 + 우상단 compact 토글 + theme.js 호출
- [x] 4.3 `frontend/pages/teams.html` — FOUC 인라인 + 헤더 토글 슬롯
- [x] 4.4 `frontend/pages/board.html` — FOUC 인라인 (헤더 토글은 header.js가 처리)
- [x] 4.5 `frontend/pages/chat.html` — FOUC 인라인
- [x] 4.6 `frontend/pages/members.html` — FOUC 인라인 + 본문 카드 토큰화

## 5. 색상 마이그레이션 (Tailwind 직접 색 → 변수/유틸리티)

- [x] 5.1 `tokens.css`에 Tailwind `bg-white`, `border-slate-*`, `text-slate-*` 등을 다크 모드에서 토큰으로 강제 오버라이드하는 보조 규칙 추가
- [x] 5.2 칸반 컬럼 헤더 border 색을 컬럼 색 토큰의 fg로 통일 (다크에서도 자연스럽게 표시)
- [x] 5.3 toast info/error는 이미 변수 사용 (확인 OK)

## 6. 로컬 + 라이브 검증

- [x] 6.1 로컬 uvicorn → tokens.css에 다크 블록 존재, theme.js 200, FOUC 인라인 lookup pass
- [x] 6.2 자산 9개(/ + css + js + 5 pages) 모두 200 OK
- [x] 6.3 새로고침 후 선택 유지 확인 (localStorage 키 `taskflow_theme`)
- [ ] 6.4 OS 다크모드 켜고 system 모드에서 자동 다크 전환 확인 (사용자 시각 확인)
- [x] 6.5 `vercel --prod` 재배포 완료
- [ ] 6.6 라이브에서 5개 페이지(login/teams/board/chat/members) 다크 모드 시각 확인 (사용자 시각 확인)
