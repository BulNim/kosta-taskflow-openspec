## Why

소규모 팀(3~5인)이 업무 진행 상황과 의사소통을 여러 도구에 분산해서 관리하느라 컨텍스트 단절을 겪는다. 칸반과 팀 채팅을 한 화면에서 함께 추적할 수 있는 가벼운 도구가 필요하고, 신규 합류자가 1분 내에 팀 컨텍스트를 파악할 수 있어야 한다.

TaskFlow MVP는 이 문제를 최소 기능으로 해결하는 단일 화면 도구를 제공한다. 학습/연습 목적의 그린필드 프로젝트이며 Day 2 마무리 시점까지 완성한다.

## What Changes

- **인증 흐름 신설**: 이메일 회원가입, 로그인, JWT 발급, bcrypt 비밀번호 해시
- **팀 운영 신설**: 팀 생성, 초대코드 발급, 초대코드 기반 합류, 멤버 목록 조회
- **칸반 태스크 보드 신설**: TODO/DOING/DONE 3컬럼, 태스크 추가/제목수정/상태이동/삭제, 드래그 상태 이동
- **팀 단위 텍스트 채팅 신설**: 메시지 송수신, 발신자/시각 표시, 5초 폴링 기반 자동 새로고침
- **배포 파이프라인 신설**: Vercel(FE+BE) + Vercel Storage Neon(Pooled 자동 주입) 한 줄 배포

### Out of Scope (이번 변경에서 의도적으로 제외)

- 이메일/SMS/푸시 알림 (채팅 폴링으로 대체)
- 파일/이미지 첨부 (텍스트 채팅만)
- 전문 검색 (단순 SELECT 조회만)
- 페이지별 세분 권한 (팀 admin/member 구분만)
- 다국어 (한글 UI 고정)
- WebSocket 실시간 전송 (5초 폴링으로 대체)
- 자동 테스트 (pytest/jest 없음, 수동 동작 확인만)

## Capabilities

### New Capabilities
- `user-auth`: 이메일/비밀번호 기반 회원가입·로그인, JWT 토큰 발급, bcrypt 해시 저장
- `team-management`: 팀 생성과 초대코드 기반 합류, 멤버 목록 조회
- `kanban-board`: 팀 단위 태스크 CRUD와 TODO/DOING/DONE 상태 흐름
- `team-chat`: 팀 단위 텍스트 메시지 송수신과 5초 폴링 기반 표시

### Modified Capabilities
없음 (그린필드 프로젝트, 기존 spec 없음).

## Impact

- **신규 코드**: FastAPI 백엔드(`/auth`, `/teams`, `/tasks`, `/messages` 라우터), Vanilla JS + Tailwind 프론트엔드(로그인/팀선택/칸반/채팅 4화면), SQLAlchemy 모델 4종(users/teams/tasks/messages)
- **신규 API**: 총 18개 엔드포인트 (Auth 4 + Team 4 + Task 6 + Chat 4)
- **신규 DB 스키마**: 4테이블 (users, teams, tasks, messages) — 로컬 SQLite, 배포 Neon(Postgres) 양쪽 호환
- **신규 인프라**: Vercel 배포 설정, Vercel Storage Neon 연결, CORS 허용 도메인 설정
- **의존성**: FastAPI, SQLAlchemy, bcrypt, python-jose(JWT), Tailwind(CDN 또는 빌드)
- **데이터 손실 대비**: Neon 자동 백업 + point-in-time recovery(Free 플랜 기본), 로컬 SQLite는 git 제외
- **관측성**: print 디버깅만, Sentry/로그 수집 없음(MVP 범위 외)
