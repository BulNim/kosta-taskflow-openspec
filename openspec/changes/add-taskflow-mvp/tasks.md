## 1. 프로젝트 스캐폴딩 및 의존성

- [x] 1.1 백엔드 디렉토리 구조 생성 (`backend/app/{routers,models,schemas,core}`)
- [x] 1.2 프론트엔드 디렉토리 구조 생성 (`frontend/{pages,js,css}`)
- [x] 1.3 `requirements.txt` 작성 (fastapi, uvicorn, sqlalchemy, bcrypt, python-jose, pydantic)
- [x] 1.4 `.gitignore`에 `*.db`, `__pycache__`, `.env`, `node_modules` 추가
- [x] 1.5 FastAPI 앱 진입점 (`backend/app/main.py`) + CORS 미들웨어 + 정적 파일 마운트
- [x] 1.6 통일 에러 응답 핸들러 작성 (`{code, msg}` 포맷, 4xx/5xx 공통)
- [x] 1.7 환경변수 로더 (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`)

## 2. 데이터베이스 모델

- [x] 2.1 SQLAlchemy 엔진/세션 팩토리 (`backend/app/core/db.py`), SQLite/Postgres 양쪽 지원
- [x] 2.2 `users` 모델 (id, email UNIQUE, password_hash, created_at)
- [x] 2.3 `teams` 모델 (id, name, invite_code UNIQUE, owner_id FK)
- [x] 2.4 `team_members` 연결 테이블 (team_id, user_id, role: admin/member)
- [x] 2.5 `tasks` 모델 (id, team_id FK, title, status enum, creator_id FK)
- [x] 2.6 `messages` 모델 (id, team_id FK, user_id FK, content, created_at)
- [x] 2.7 첫 실행 시 테이블 자동 생성 (`Base.metadata.create_all`)

## 3. 인증 (user-auth)

- [x] 3.1 비밀번호 해시 유틸 (`hash_password`, `verify_password` - bcrypt)
- [x] 3.2 JWT 발급/검증 유틸 (24h 만료, HS256, 갱신 없음)
- [x] 3.3 `get_current_user` 의존성 (Bearer 토큰 파싱, 만료/누락 401)
- [x] 3.4 `POST /auth/signup` 구현 (이메일 UNIQUE 위반 시 409 `EMAIL_EXISTS`)
- [x] 3.5 `POST /auth/login` 구현 (자격증명 불일치 시 401 `INVALID_CREDENTIALS`, 이메일 존재 여부 비노출)
- [x] 3.6 `GET /auth/me` 구현 (password_hash 제외 응답)
- [x] 3.7 `POST /auth/logout` 구현 (204 반환, 서버 상태 변경 없음)

## 4. 팀 관리 (team-management)

- [x] 4.1 초대코드 생성기 (`XXXX-XXXX` 형식, 영숫자 대문자+숫자 4-4 하이픈, 예 `ABCD-1234`. 충돌 시 재시도)
- [x] 4.2 `is_team_member` 헬퍼 (멤버십 확인, 403 `NOT_TEAM_MEMBER`)
- [x] 4.3 `POST /teams` 구현 (생성자를 admin으로 멤버십 추가)
- [x] 4.4 `GET /teams` 구현 (내가 멤버인 팀만, 없으면 빈 배열)
- [x] 4.5 `POST /teams/join` 구현 (유효 코드면 합류, 무효 404 `INVALID_INVITE_CODE`, 이미 멤버면 멱등 통과)
- [x] 4.6 `GET /teams/{id}/members` 구현 (멤버만 조회, password_hash 제외)

## 5. 칸반 태스크 (kanban-board)

- [x] 5.1 status enum (`TODO`/`DOING`/`DONE`) + title `max_length=200` Pydantic 검증
- [x] 5.2 `POST /teams/{id}/tasks` 구현 (기본 status=TODO, creator_id 자동, 200자 초과 시 400 `TITLE_TOO_LONG`)
- [x] 5.3 `GET /teams/{id}/tasks` 구현 (팀 멤버만)
- [x] 5.4 `GET /tasks/{id}` 구현 (없으면 404 `TASK_NOT_FOUND`)
- [x] 5.5 `PUT /tasks/{id}` 구현 (status/title 부분 수정, 무효 status 400 `INVALID_STATUS`, 제목 초과 400 `TITLE_TOO_LONG`)
- [x] 5.6 `DELETE /tasks/{id}` 구현 (팀 멤버 누구나, 204 반환)

## 6. 팀 채팅 (team-chat)

- [x] 6.1 메시지 content 1000자 검증 (Pydantic max_length=1000)
- [x] 6.2 `POST /teams/{id}/messages` 구현 (초과 시 400 `MESSAGE_TOO_LONG`)
- [x] 6.3 `GET /teams/{id}/messages` 구현 (since 미지정 시 전체, created_at 오름차순)
- [x] 6.4 `GET /teams/{id}/messages?since=` 증분 조회 (ISO timestamp 파싱)
- [x] 6.5 `GET /messages/{id}` 구현 (없으면 404 `MESSAGE_NOT_FOUND`)
- [x] 6.6 `DELETE /messages/{id}` 구현 (본인만, 타인 시 403 `NOT_MESSAGE_OWNER`)

## 7. 프론트엔드 - 공용 자산

- [x] 7.1 Tailwind CDN 포함 `base.html` 레이아웃
- [x] 7.2 `api.js`: fetch wrapper (JWT 자동 첨부, 401 시 로그인 페이지로 리다이렉트)
- [x] 7.3 `auth.js`: localStorage JWT 저장/조회/삭제 유틸
- [x] 7.4 공통 에러 토스트 UI

## 8. 프론트엔드 - 로그인 화면

- [x] 8.1 로그인 페이지 마크업 (로고, 이메일/비밀번호 입력, 로그인 버튼, 회원가입 링크)
- [x] 8.2 로그인 폼 제출 → `POST /auth/login` → JWT localStorage 저장 → 팀 선택 페이지로 이동
- [x] 8.3 회원가입 폼/모달 → `POST /auth/signup` → 자동 로그인 처리

## 9. 프론트엔드 - 팀 선택 화면

- [x] 9.1 `GET /teams` 호출 → 내 팀 목록 렌더링
- [x] 9.2 "팀 만들기" 버튼/모달 → `POST /teams` → 목록 갱신
- [x] 9.3 초대코드 입력 + 합류 버튼 → `POST /teams/join` → 목록 갱신
- [x] 9.4 팀 선택 시 칸반 화면으로 이동 (URL에 team_id 포함)

## 10. 프론트엔드 - 칸반 화면

- [x] 10.1 3컬럼 레이아웃 (TODO/DOING/DONE), 각 컬럼 헤더에 + 버튼
- [x] 10.2 `GET /teams/{id}/tasks` 호출 → 카드 렌더링
- [x] 10.3 카드 추가 입력 UI → `POST /teams/{id}/tasks`
- [x] 10.4 HTML5 Drag and Drop → `PUT /tasks/{id}` (status 변경, 50ms 이내 반응)
- [x] 10.5 카드 우클릭/메뉴로 제목 수정·삭제 → `PUT/DELETE /tasks/{id}`
- [x] 10.6 채팅 화면으로 이동하는 탭/링크

## 11. 프론트엔드 - 채팅 화면

- [x] 11.1 메시지 리스트 영역 + 발신자 + ISO 시각 표시
- [x] 11.2 입력창 + 전송 버튼 → `POST /teams/{id}/messages`
- [x] 11.3 5초 setInterval 폴링 → `GET /teams/{id}/messages?since=<lastSeen>`
- [x] 11.4 신규 메시지만 append (중복 방지), since 갱신
- [x] 11.5 페이지 이탈 시 setInterval 정리 (메모리 누수 방지)

## 12. 배포 (Vercel + Neon)

- [x] 12.1 `vercel.json` (또는 `vercel.ts`) 작성 — FastAPI 함수 라우팅 + 정적 자산 경로
- [ ] 12.2 Vercel 프로젝트 생성, GitHub 저장소 연결
- [ ] 12.3 Vercel Storage > Neon Postgres 프로비저닝, Pooled `DATABASE_URL` 자동 주입 확인
- [ ] 12.4 환경변수 추가: `JWT_SECRET`(랜덤 생성), `CORS_ORIGINS`(배포 도메인)
- [ ] 12.5 첫 배포 → 자동 URL 확인
- [ ] 12.6 배포 후 `POST /auth/signup` → 팀 생성 → 칸반/채팅 전체 흐름 수동 확인

## 13. 수동 동작 확인 (자동 테스트 대체)

- [ ] 13.1 회원가입 → 로그인 → JWT localStorage 확인
- [ ] 13.2 팀 생성 → 초대코드 확인 → 두 번째 계정으로 합류
- [ ] 13.3 태스크 추가/드래그/제목수정/삭제 4가지 시나리오 확인
- [ ] 13.4 두 브라우저에서 채팅 전송 → 5초 내 상대에게 보임 확인
- [ ] 13.5 토큰 만료(또는 강제 만료) 시 401 → 로그인 페이지 리다이렉트 확인
- [ ] 13.6 비멤버가 보호 리소스 접근 시 403 응답 확인
