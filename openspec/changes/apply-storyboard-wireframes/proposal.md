## Why

이전 변경(`add-taskflow-mvp`)은 프로그램정의 PDF의 텍스트 와이어프레임만 보고 구현했고, 스토리보드 PDF의 시각 디자인과 일부 동작 명세는 미반영 상태였다. 결과적으로 프론트엔드 디자인을 AI가 임의로 결정했고, 스토리보드에 정의된 다음 항목들이 누락됐다.

- 화면별 시각 디자인 (color palette, 컬럼 색 코딩, 컴포넌트 형태)
- 칸반 카드 메타 (assignee, task ID 표시)
- 칸반 필터·정렬 (`전체 / @me / 미할당`, `최근 생성순`)
- 인라인 태스크 추가 UX (modal/prompt 대신 카드 형태 인라인 폼)
- 채팅 메시지 페이지네이션 (최근 50개 초기 로드)
- 채팅 자기/타인 버블 시각 분리
- 멤버 탭 (현재 API만 있고 UI 없음)
- 사용자-팀 일대일 분기 (`users.team_id` NULL → 강제 팀 선택)
- 모바일 반응형 (1컬럼 + 스와이프 + FAB)
- 에러 응답 포맷 (`{error:{code,message}}` vs 현재 `{code,msg}`)

이번 변경은 스토리보드 v2 (42장)를 정확히 따라 시각 디자인을 적용하고, 동시에 드러난 동작 차이도 정식 spec으로 흡수한다.

## What Changes

### 시각 디자인 토큰 도입 (신규 capability)

- 색상 토큰: `primary #14808F` (브랜드/CTA), `accent #15D9B0` (보조 CTA), 컬럼별 색 (TODO `#FFE9C4/B45309`, DOING `#DEEBFF/1E40AF`, DONE `#D5EBD5/166534`)
- 타이포 스케일·간격 스케일·radius 토큰
- 컴포넌트 invariants (버튼 radius, 카드 shadow, 입력 border)

### 칸반 capability 확장

- **BREAKING**: `tasks` 테이블에 `assignee_id` (nullable FK to users) 컬럼 추가, `creator_id` 분리 유지
- 필터 쿼리 파라미터: `?filter=mine|unassigned|all` (default `all`)
- 정렬 쿼리 파라미터: `?sort=created_at_desc|created_at_asc` (default `created_at_desc`)
- 응답 모델에 assignee 정보 포함

### 채팅 capability 확장

- **BREAKING**: 초기 조회는 최근 50개로 제한, `?limit=` (default 50, max 200) 추가
- **BREAKING**: 응답에 `user_email` 포함 (현재는 `user_id`만)

### 팀 정책 (신규 분기 행동)

- 사용자 단일 팀 컨텍스트(`current_team_id`) 개념 도입: 최초 팀 합류 시 자동 활성화, 다중 팀 동시 운영은 후속 이터레이션
- `team_id` NULL 상태 사용자에 대한 강제 진입 페이지(/teams) 흐름

### 에러 포맷 (Out of Scope, 추후 결정)

- 스토리보드는 `{error:{code,message}}` 중첩 구조, 현재 구현은 평면 `{code,msg}`. **이번 변경에서는 시각만 반영하고 에러 포맷 변경은 보류** (다음 이터레이션 안건)

### 프론트엔드 재작업

- 4개 페이지(`login.html`, `teams.html`, `board.html`, `chat.html`)를 스토리보드에 맞춰 재구성
- 멤버 탭 추가 (board.html과 같은 레이아웃에 탭만 전환)
- Tailwind 커스텀 클래스/CSS 변수로 디자인 토큰 노출
- 모바일 반응형 (Tailwind breakpoint, 칸반 모바일 = 단일 컬럼 + 탭 전환)

### Out of Scope

- WebSocket/SSE 전환 (여전히 5초 폴링 유지)
- 다국어, 알림, 파일 첨부 등 MVP 외 기능
- 에러 응답 포맷 변경 (별도 propose에서 다룸)
- 카드 길게 누르기 메뉴 (모바일 한정, 다음 이터레이션)
- 자동 테스트, 시각 회귀 테스트

## Capabilities

### New Capabilities
- `ui-design-system`: 색상·타이포·간격·컴포넌트 토큰의 정식 명세 (브랜드 일관성을 위한 invariants)

### Modified Capabilities
- `kanban-board`: assignee 필드 추가, 필터·정렬 쿼리 파라미터 추가, 카드 표시 사양 변경
- `team-chat`: 최근 50개 제한과 `limit` 파라미터 추가, 응답에 `user_email` 포함
- `team-management`: `current_team_id` 개념 도입과 NULL 상태 강제 분기 (멤버십 모델은 유지, current 추가)

## Impact

- **DB 마이그레이션**: `users.current_team_id` (nullable FK), `tasks.assignee_id` (nullable FK) 신규 컬럼 2종 추가
- **API 변경**: `/teams/{id}/tasks` GET에 필터·정렬 쿼리, POST/PUT body에 `assignee_id` 옵션
- **API 변경**: `/teams/{id}/messages` GET에 `limit` 쿼리, MessageOut에 `user_email` 추가
- **API 추가**: 없음 (멤버 탭은 기존 `GET /teams/{id}/members` 재사용)
- **신규 코드**: 디자인 토큰을 위한 `frontend/css/tokens.css`, 컴포넌트 패턴 정리, 4 페이지 마크업 재작성
- **참조 문서**: `docs/wireframes/` 하위 PDF 추출 PNG 42장 + HTML 목업 7장 (인덱스 포함)
- **의존성**: 추가 패키지 없음 (Tailwind CDN 유지)
- **재배포**: 1회 production deploy 필요
