## Context

스토리보드 PDF v2(42장) 분석 결과, 시각 디자인뿐 아니라 다음 동작 명세가 확장됐다:
- 칸반 카드에 assignee/task ID 표시 + 필터·정렬
- 인라인 태스크 추가 UX (modal 없음)
- 채팅 자기/타인 버블 분리, 최근 50개 페이지네이션
- 사용자 단일 팀(`team_id`) 컨텍스트
- 모바일 반응형 (1컬럼 + 스와이프 + FAB)

기존 코드와 spec은 `add-taskflow-mvp`에서 구현·아카이브된 상태(2026-05-15). 이번 변경은 4개 capability 중 3개를 MODIFIED로 손대고, 1개 신규(`ui-design-system`)를 추가한다.

## Goals / Non-Goals

**Goals:**
- 스토리보드 v2 시각 디자인을 코드에 충실히 반영
- 디자인 토큰을 정식 spec으로 codify → 향후 변경시 일관성 보장
- 칸반·채팅의 누락 동작(assignee, 필터·정렬, limit, user_email) 흡수
- 사용자가 어느 화면에 있든 시각 일관성 체감

**Non-Goals:**
- WebSocket/SSE 도입 (계속 5초 폴링)
- 에러 응답 포맷 변경 (별도 propose)
- 다중 팀 동시 운영 UX (`current_team_id` 단일 컨텍스트로 시작)
- 자동 시각 회귀 테스트 (수동 비교만)
- 카드 길게 누르기 → 상태 메뉴 (모바일 한정, 추후)

## Decisions

### 1. 디자인 토큰 노출 방식: CSS 변수 + Tailwind 임의값 클래스

**대안:** Tailwind config 커스터마이즈, 빌드 도구 도입.
**선택 이유:** Tailwind CDN을 유지(빌드 도구 없음) 원칙과 일관. `tokens.css`에 `:root { --color-primary: #14808F; ... }` 형태로 노출, Tailwind에서는 `bg-[var(--color-primary)]` 임의값 클래스로 참조. 토큰 변경 1곳에서 전 화면 반영.

### 2. 색 코딩 컬럼 헤더: 배경+텍스트 톤 분리

**선택 이유:** 스토리보드는 컬럼당 (밝은 배경 + 진한 텍스트) 쌍을 사용 — 가독성 보장 + 색맹 친화.
- TODO: bg `#FFE9C4` / text `#B45309` (amber)
- DOING: bg `#DEEBFF` / text `#1E40AF` (blue)
- DONE: bg `#D5EBD5` / text `#166534` (green)

### 3. 사용자-팀 모델: 멤버십은 유지, current_team_id 추가

**대안:** 기존 `team_members` 다대다를 일대일로 변경.
**선택 이유:** 멤버십은 그대로 두고 `users.current_team_id`로 "현재 활성 팀"만 표기. 이미 합류한 팀이 있으면 자동으로 그 팀이 current가 되도록 보장. 다중 팀 운영은 미래 변경에서 자연스럽게 확장 가능.

전환 룰:
- 회원가입 직후: `current_team_id = NULL`
- 첫 팀 생성/합류 직후: 그 팀 ID로 자동 설정
- 사용자가 다른 팀 선택 UI는 없음 (MVP 범위 외)

### 4. assignee_id: nullable FK to users, 팀 멤버 검증은 API 측

**대안:** 모든 태스크에 assignee 필수.
**선택 이유:** 스토리보드의 "미할당" 필터를 지원하려면 nullable. 외래키만 두고 "할당된 사용자가 해당 팀 멤버여야 한다"는 invariant는 API 레벨에서 검증 (DB 트리거 없음).

### 5. 필터·정렬: 쿼리 파라미터, 기본값 명시

**선택 이유:** 클라이언트 상태 동기화 단순화 (URL과 함께 공유 가능).
- `?filter=all|mine|unassigned` (default `all`)
- `?sort=created_at_desc|created_at_asc` (default `created_at_desc`)
- 무효 값은 400 `INVALID_QUERY_PARAM`

### 6. 채팅 페이지네이션: limit 쿼리, 최신 N개를 ASC로 반환

**선택 이유:** UX상 항상 시간 오름차순으로 표시. limit를 적용해도 "최신 50개를 시간순"으로 보냄 → 클라이언트 렌더 단순.
- `?limit=50` (default 50, max 200, min 1)
- 무효 값 400 `INVALID_QUERY_PARAM`
- `since=`와 함께 쓰면 since 우선, limit 적용

### 7. user_email 응답 포함: ORM join으로 처리

**대안:** denormalize (메시지에 email 컬럼 복사).
**선택 이유:** 메시지 수가 많아도 join 비용 충분히 낮음. denormalize는 이메일 변경 시 동기화 문제 발생.

### 8. 모바일 반응형: Tailwind breakpoint, 768px 미만 1컬럼

**대안:** 별도 모바일 페이지 작성.
**선택 이유:** 단일 페이지(`board.html`)에서 Tailwind `md:` breakpoint로 분기. 모바일 = 컬럼 탭(TODO/DOING/DONE) + 한 번에 한 컬럼만 표시 + FAB. 동일 API 사용.

### 9. 인라인 태스크 추가 폼: 활성 카드 형태로 컬럼 최상단 삽입

**선택 이유:** 모달/prompt 비교 시 컨텍스트 유지(보드를 떠나지 않음). 폼 자체가 카드 모양으로 추가될 위치에 그대로 등장 → 시각 일관성.

### 10. 멤버 탭: board.html과 같은 헤더+탭 레이아웃 공유

**선택 이유:** 사용자가 칸반/채팅/멤버 간 빠르게 전환. 멤버 탭은 신규 페이지 추가 없이 동일 레이아웃, 본문만 멤버 그리드로 교체.

### 11. assignee 변경 권한: 팀 멤버 누구나

**대안:** 작성자(creator_id)만, admin 추가, 본인이 assignee일 때만.
**선택 이유:** 칸반은 공유 보드 성격. 기존 태스크 삭제·상태 이동 권한도 "팀 멤버 누구나" 패턴이므로 일관성 유지. assignee로 지정될 사람이 해당 팀 멤버여야 한다는 invariant는 별도 검증(ASSIGNEE_NOT_TEAM_MEMBER 400).

### 12. 모바일 상태 변경 UX: 카드 탭 → bottom-sheet modal에서 status 선택

**대안:** 길게 누르기(long-press) 컨텍스트 메뉴, 모바일에서도 드래그 시도.
**선택 이유:** 길게 누르기 제스처는 OS·브라우저별 동작 차이가 큼(텍스트 선택과 충돌). 단순 탭이 가장 일관적이고 접근성 친화. bottom-sheet는 TODO/DOING/DONE 세 옵션 + 취소만 노출. 길게 누르기 메뉴는 별도 propose 안건.

## Risks / Trade-offs

- **[BREAKING DB 변경]** → `users.current_team_id`, `tasks.assignee_id` 컬럼 추가. SQLite는 `ALTER TABLE ADD COLUMN`으로 충분. 기존 데이터는 NULL 기본값 → 무손실 마이그레이션.
- **[기존 클라이언트 호환성]** → 별도 클라이언트 없음 (우리 frontend만). 백엔드 응답에 필드 추가는 호환적.
- **[기존 spec과의 충돌]** → archived `add-taskflow-mvp`의 spec은 이미 main spec으로 흡수됨. 이번 propose의 MODIFIED 델타는 main spec의 해당 Requirement를 재정의하는 형태.
- **[디자인 토큰 일관성 유지]** → CSS 변수 + Tailwind 임의값 조합은 자동 검증 어려움. 코드 리뷰 단계에서 raw hex 사용 금지 가이드라인.
- **[`current_team_id` 부재 사용자 강제 진입 흐름의 무한 루프]** → /teams 페이지는 인증 통과해야 접근 가능하지만 team_id NULL이면 다른 모든 페이지에서 /teams로 리다이렉트. /teams 자체는 NULL인 사용자에게 정상 노출되어야 함 (그래야 합류 가능). FE 라우팅 가드에서 이 화면만 예외 처리.
- **[모바일 스와이프 라이브러리 의존성]** → 추가 라이브러리 도입은 빌드 도구 없음 원칙 위배. 단순 CSS scroll-snap + 탭 클릭 폴백으로 구현.

## Migration Plan

1. **DB**: SQLAlchemy 모델에 컬럼 추가, `Base.metadata.create_all`은 ADD COLUMN 안 함 → 첫 로컬은 DB 파일 삭제 후 재생성. 배포 환경 Neon은 `ALTER TABLE ... ADD COLUMN`을 직접 실행하거나 마이그레이션 도구(Alembic) 도입.
2. **백엔드**: 모델/스키마/라우터 수정 → 로컬 스모크 → preview 배포 → smoke → production.
3. **프론트엔드**: 4개 페이지 재작성 → `frontend/css/tokens.css` 추가 → 로컬 스모크 (모바일 포함) → 배포.
4. **롤백**: 이전 배포로 promote (1클릭). DB 컬럼은 NULL 허용이라 롤백해도 데이터 손상 없음.

## Open Questions

이전 미결 4건은 모두 결정됐다 (Decisions #11, #12에 반영). 향후 별도 propose로 이월된 항목은 아래 "Deferred to Future Proposes" 참조.

## Deferred to Future Proposes

- `introduce-alembic-migrations` — 이번에는 Neon 콘솔에서 `ALTER TABLE` 2건 직접 실행, 후속 변경부터는 Alembic으로 마이그레이션 이력 관리
- `align-error-format-with-storyboard` — 스토리보드의 `{error:{code,message}}` 중첩 포맷으로 통일 (현재 `{code,msg}` 평면 → BREAKING 변경이므로 단독 propose)
- `mobile-long-press-status-menu` — 모바일에서 길게 누르기 제스처로 상태 메뉴 표시 (이번 변경은 카드 탭 → bottom-sheet modal로 처리)
- `multi-team-context-switching` — 명시적 `current_team_id` 전환 API와 멀티 팀 전환 UX
