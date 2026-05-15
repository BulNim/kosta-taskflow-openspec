## 1. 디자인 토큰 도입

- [ ] 1.1 `frontend/css/tokens.css` 작성 (`:root` 변수로 color/space/radius/shadow)
- [ ] 1.2 기존 `frontend/css/style.css`에서 raw hex 사용처를 `var(--*)` 또는 Tailwind 임의값 클래스로 마이그레이션
- [ ] 1.3 시스템 폰트 스택을 `body`에 통합 (Apple SD Gothic Neo, 맑은 고딕 포함)

## 2. DB 스키마 확장

- [ ] 2.1 `users` 모델에 `current_team_id` (nullable FK to teams) 컬럼 추가
- [ ] 2.2 `tasks` 모델에 `assignee_id` (nullable FK to users) 컬럼 추가
- [ ] 2.3 로컬: `taskflow.db` 삭제 후 `Base.metadata.create_all`로 재생성 검증
- [ ] 2.4 운영(Neon): Vercel Neon 콘솔에서 `ALTER TABLE users ADD COLUMN current_team_id INTEGER REFERENCES teams(id)` 및 `ALTER TABLE tasks ADD COLUMN assignee_id INTEGER REFERENCES users(id)` 실행

## 3. 인증 응답 확장 (user-auth)

- [ ] 3.1 `UserOut`에 `current_team_id: int | None` 추가
- [ ] 3.2 `GET /auth/me`가 current_team_id 포함 응답 반환하는지 검증
- [ ] 3.3 `POST /auth/signup`, `POST /auth/login` 응답도 동일하게 확장 (TokenOut에 user 정보 포함 옵션 추가)

## 4. 팀 관리 확장 (team-management)

- [ ] 4.1 `POST /teams` 구현 수정: 생성자의 `current_team_id`가 NULL이면 새 팀 ID로 자동 설정
- [ ] 4.2 `POST /teams/join` 구현 수정: 합류자의 `current_team_id`가 NULL이면 합류 팀 ID로 자동 설정
- [ ] 4.3 두 번째 팀 생성/합류 시 current_team_id 변경 없음 검증
- [ ] 4.4 `GET /auth/me` 응답에 current_team_id 노출

## 5. 칸반 확장 (kanban-board)

- [ ] 5.1 `TaskCreateIn`/`TaskUpdateIn`/`TaskOut`에 `assignee_id` 필드 추가 (nullable)
- [ ] 5.2 `POST /teams/{id}/tasks` 구현: assignee_id 지정 시 해당 사용자가 팀 멤버인지 검증, 아니면 400 `ASSIGNEE_NOT_TEAM_MEMBER`
- [ ] 5.3 `PUT /tasks/{id}` 구현 확장: assignee_id 변경 지원 (NULL로 설정 가능)
- [ ] 5.4 `GET /teams/{id}/tasks`에 `filter` 쿼리 지원: `all`(기본)/`mine`/`unassigned`
- [ ] 5.5 `GET /teams/{id}/tasks`에 `sort` 쿼리 지원: `created_at_desc`(기본)/`created_at_asc`
- [ ] 5.6 무효 filter/sort 값에 대해 400 `INVALID_QUERY_PARAM` 반환

## 6. 채팅 확장 (team-chat)

- [ ] 6.1 `MessageOut`에 `user_email` 필드 추가 (User join으로 채움)
- [ ] 6.2 `GET /teams/{id}/messages`에 `limit` 쿼리 지원 (기본 50, min 1, max 200)
- [ ] 6.3 limit 적용 시 "최신 N개를 시간 오름차순"으로 반환 (LIMIT + ORDER BY created_at DESC → reverse)
- [ ] 6.4 since + limit 동시 사용 시 since 우선, limit 적용
- [ ] 6.5 무효 limit (0, 음수, 200 초과) 400 `INVALID_QUERY_PARAM`

## 7. 프론트엔드 - 공용

- [ ] 7.1 `frontend/css/tokens.css` 작성 + 모든 페이지 `<link>` 추가
- [ ] 7.2 `frontend/js/api.js`: 응답 헬퍼는 그대로, 단 `/auth/me` 응답의 `current_team_id`로 라우팅 결정 로직 추가
- [ ] 7.3 `frontend/index.html`을 `/auth/me` 호출 후 분기 (NULL → /pages/teams.html, 값 있음 → /pages/board.html?team_id=<current>) 형태로 수정
- [ ] 7.4 공통 헤더 컴포넌트 패턴: 로고 + 팀명 + (칸반/채팅/멤버) 탭 + 사용자 이메일/로그아웃

## 8. 로그인 화면 재작업

- [ ] 8.1 `pages/login.html`을 wireframe `signup.html`/`login.html` 디자인에 맞춰 마크업 갱신 (primary 버튼 색, 카드 padding, 시스템 폰트)
- [ ] 8.2 로그인 성공 후 `/auth/me` 호출 → current_team_id 기반 라우팅 분기

## 9. 팀 선택 화면 (current_team_id NULL 강제 진입)

- [ ] 9.1 `pages/teams.html`을 wireframe `teams-empty.html` 디자인에 맞춰 재작성 (info banner + 두 패널)
- [ ] 9.2 이미 current_team_id가 있는 사용자가 이 페이지 직접 접근 시 board로 자동 redirect
- [ ] 9.3 합류·생성 후 `/auth/me` 재호출하여 current_team_id 갱신 확인 → board로 이동

## 10. 칸반 화면 재작업

- [ ] 10.1 `pages/board.html`을 wireframe `board.html` 디자인에 맞춰 재작성 — 헤더(로고+팀명+탭) + 필터바(전체/@me/미할당 + 정렬) + 3 컬럼 색 코딩 + 카드 #id @assignee 표시
- [ ] 10.2 카드 UI에 #id 와 @assignee_email(축약) 표시
- [ ] 10.3 필터 버튼 동작 → `?filter=` 쿼리 갱신 후 재호출
- [ ] 10.4 정렬 드롭다운 → `?sort=` 갱신 후 재호출
- [ ] 10.5 인라인 태스크 추가 UX: `+` 클릭 → 컬럼 최상단에 활성 카드(제목 입력 + 담당자 셀렉트) 삽입 → Enter 저장 / Esc 취소
- [ ] 10.6 멤버 탭: 같은 헤더 유지, 본문만 멤버 그리드로 교체 (재사용 가능한 partial 또는 단순 표시 토글)
- [ ] 10.7 채팅 탭: 같은 헤더 유지, 본문만 채팅 영역으로 교체 (단일 board.html 페이지 내 탭 라우팅 가능. 또는 별도 chat.html 유지하되 헤더 공유)

## 11. 채팅 화면 재작업

- [ ] 11.1 `pages/chat.html`을 wireframe `chat.html` 디자인에 맞춰 재작성 — 헤더(팀명+채팅) + 5초 새로고침 인디케이터 + 버블 영역
- [ ] 11.2 자기/타인 버블 분리: 자기=오른쪽 정렬 + primary 배경 + 흰 텍스트, 타인=왼쪽 정렬 + 흰 배경 + border
- [ ] 11.3 발신자 표시: 이메일 앞부분(또는 전체 이메일) + ISO 시각 (HH:MM 포맷)
- [ ] 11.4 초기 로드: `GET /teams/{id}/messages?limit=50` 호출
- [ ] 11.5 폴링: 마지막 메시지 created_at 이후 since로 갱신, 신규 메시지만 append

## 12. 모바일 반응형

- [ ] 12.1 칸반 페이지에 `md:` breakpoint 분기: 모바일에서 3컬럼 → 1컬럼(현재 활성 컬럼만), 상단 탭(TODO/DOING/DONE) 표시
- [ ] 12.2 모바일 탭 클릭으로 컬럼 전환 (스와이프는 CSS scroll-snap으로 부가)
- [ ] 12.3 FAB(+ 버튼) 우하단 고정 → 현재 컬럼에 인라인 추가
- [ ] 12.4 모바일 카드 탭 → bottom-sheet modal에서 TODO/DOING/DONE 중 선택해 status 변경 (드래그 대체 UX)
- [ ] 12.5 멤버/채팅 탭도 모바일에서 컴팩트 레이아웃 확인

## 13. 배포 + 검증

- [ ] 13.1 로컬 uvicorn 부팅 + 시스템 폰트·색상 토큰 적용 확인
- [ ] 13.2 Neon 콘솔에서 ALTER TABLE 2건 실행 (`users.current_team_id`, `tasks.assignee_id`)
- [ ] 13.3 `vercel --prod`로 production 재배포
- [ ] 13.4 https://v0-taskflow-ruby.vercel.app 에서 wireframe HTML과 시각 비교 (4 페이지 × 모바일/데스크탑)
- [ ] 13.5 신규 사용자 → 첫 팀 생성 → current_team_id 자동 설정 확인
- [ ] 13.6 필터(@me/미할당)·정렬·assignee·인라인 추가 시나리오 수동 검증
- [ ] 13.7 채팅 초기 50개 + 5초 폴링 동작 확인
- [ ] 13.8 모바일 브라우저(또는 DevTools 모바일 뷰)에서 칸반 1컬럼 모드 확인
