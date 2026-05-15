# kanban-board Specification

## Purpose
TBD - created by archiving change add-taskflow-mvp. Update Purpose after archive.
## Requirements
### Requirement: 팀 태스크 생성

팀 멤버인 인증된 사용자는 해당 팀에 태스크를 추가 SHALL 할 수 있다. 태스크 제목은 1~200자로 제한 MUST 된다. 새 태스크의 기본 상태는 `TODO`이며, 생성자(`creator_id`)는 자동으로 기록 MUST 된다. 선택적으로 `assignee_id`를 함께 지정할 수 있으며 미지정 시 NULL이다.

#### Scenario: 태스크 추가 성공
- **WHEN** 팀 멤버가 `POST /teams/{id}/tasks`에 `{title}`(200자 이하)을 전송한다
- **THEN** 시스템은 201 상태와 `{id, team_id, title, status: "TODO", creator_id, assignee_id}`를 반환한다

#### Scenario: 200자 초과 제목으로 추가 시도
- **WHEN** 팀 멤버가 201자 이상의 title로 `POST /teams/{id}/tasks`를 호출한다
- **THEN** 시스템은 400 상태와 `{code: "TITLE_TOO_LONG", msg: ...}`를 반환한다

#### Scenario: 팀 멤버가 아닌 사용자의 추가 시도
- **WHEN** 해당 팀의 멤버가 아닌 사용자가 `POST /teams/{id}/tasks`를 호출한다
- **THEN** 시스템은 403 상태와 `{code: "NOT_TEAM_MEMBER", msg: ...}`를 반환한다

### Requirement: 팀 태스크 목록 조회

팀 멤버는 해당 팀의 모든 태스크를 조회 SHALL 할 수 있다. 응답은 칸반 3컬럼 렌더링을 위해 status 필드를 포함 MUST 한다.

#### Scenario: 태스크 목록 조회 성공
- **WHEN** 팀 멤버가 `GET /teams/{id}/tasks`를 호출한다
- **THEN** 시스템은 200 상태와 `[{id, team_id, title, status, creator_id}]` 배열을 반환한다

### Requirement: 태스크 단건 조회

팀 멤버는 본인 팀의 태스크 단건을 ID로 조회 SHALL 할 수 있다.

#### Scenario: 단건 조회 성공
- **WHEN** 팀 멤버가 `GET /tasks/{id}`를 호출한다
- **THEN** 시스템은 200 상태와 해당 태스크 객체를 반환한다

#### Scenario: 존재하지 않는 태스크
- **WHEN** 사용자가 존재하지 않는 ID로 `GET /tasks/{id}`를 호출한다
- **THEN** 시스템은 404 상태와 `{code: "TASK_NOT_FOUND", msg: ...}`를 반환한다

### Requirement: 태스크 상태 이동

팀 멤버는 태스크의 상태를 `TODO`, `DOING`, `DONE` 중 하나로 변경 SHALL 할 수 있다. 그 외 값은 거부 MUST 된다.

#### Scenario: 유효한 상태로 이동 (칸반 드래그)
- **WHEN** 팀 멤버가 `PUT /tasks/{id}`에 `{status: "DOING"}`를 전송한다
- **THEN** 시스템은 200 상태와 업데이트된 태스크를 반환하고, 응답 시간은 100ms 이내여야 한다

#### Scenario: 허용되지 않은 상태값
- **WHEN** 팀 멤버가 `PUT /tasks/{id}`에 `{status: "ARCHIVED"}`처럼 enum에 없는 값을 전송한다
- **THEN** 시스템은 400 상태와 `{code: "INVALID_STATUS", msg: ...}`를 반환한다

### Requirement: 태스크 제목 수정

팀 멤버는 기존 태스크의 제목·assignee를 수정 SHALL 할 수 있다. 수정 시에도 제목은 1~200자 제한을 동일하게 적용 MUST 받는다. assignee 변경은 별도 Requirement(태스크 담당자 지정)의 규칙을 따른다.

#### Scenario: 제목 수정 성공
- **WHEN** 팀 멤버가 `PUT /tasks/{id}`에 `{title: "new title"}`(200자 이하)을 전송한다
- **THEN** 시스템은 200 상태와 업데이트된 태스크를 반환한다

#### Scenario: 200자 초과 제목으로 수정 시도
- **WHEN** 팀 멤버가 201자 이상의 title로 `PUT /tasks/{id}`를 호출한다
- **THEN** 시스템은 400 상태와 `{code: "TITLE_TOO_LONG", msg: ...}`를 반환한다

### Requirement: 태스크 삭제

팀 멤버는 본인 팀의 태스크를 삭제 SHALL 할 수 있다. MVP에서는 멤버 누구나 삭제 가능하다.

#### Scenario: 태스크 삭제 성공
- **WHEN** 팀 멤버가 `DELETE /tasks/{id}`를 호출한다
- **THEN** 시스템은 204 상태를 반환하고 DB에서 해당 행을 제거한다

#### Scenario: 팀 멤버가 아닌 사용자의 삭제 시도
- **WHEN** 해당 팀의 멤버가 아닌 사용자가 `DELETE /tasks/{id}`를 호출한다
- **THEN** 시스템은 403 상태와 `{code: "NOT_TEAM_MEMBER", msg: ...}`를 반환한다

### Requirement: 태스크 담당자 지정

시스템은 각 태스크에 nullable한 `assignee_id`를 SHALL 가진다. 담당자는 해당 태스크가 속한 팀의 멤버여야 MUST 한다. 미지정(`null`) 상태는 "미할당"으로 간주한다.

#### Scenario: 생성 시 assignee 지정
- **WHEN** 팀 멤버가 `POST /teams/{id}/tasks`에 `{title, assignee_id?}`를 전송한다 (assignee_id가 해당 팀의 멤버 id)
- **THEN** 시스템은 201 상태와 `assignee_id`를 포함한 TaskOut을 반환한다

#### Scenario: 생성 시 assignee 미지정
- **WHEN** 팀 멤버가 `POST /teams/{id}/tasks`에 `{title}` (assignee_id 없음)을 전송한다
- **THEN** 시스템은 `assignee_id: null` 상태로 태스크를 생성한다

#### Scenario: 다른 팀 멤버를 assignee로 지정 시도
- **WHEN** 사용자가 자기 팀이 아닌 사람의 user_id를 `assignee_id`로 지정한다
- **THEN** 시스템은 400 상태와 `{code: "ASSIGNEE_NOT_TEAM_MEMBER", msg: ...}`를 반환한다

#### Scenario: assignee 변경
- **WHEN** 팀 멤버가 `PUT /tasks/{id}`에 `{assignee_id: <member-id>}` 또는 `{assignee_id: null}`을 전송한다
- **THEN** 시스템은 200 상태와 업데이트된 태스크를 반환한다

### Requirement: 태스크 목록 필터·정렬

시스템은 `GET /teams/{id}/tasks` 엔드포인트에서 다음 쿼리 파라미터를 SHALL 지원해야 한다.

- `filter`: `all`(기본) | `mine` | `unassigned`
- `sort`: `created_at_desc`(기본) | `created_at_asc`

#### Scenario: 기본 호출 = 전체, 최신순
- **WHEN** 팀 멤버가 `GET /teams/{id}/tasks`를 호출한다 (쿼리 없음)
- **THEN** 시스템은 모든 태스크를 `created_at` 내림차순으로 반환한다

#### Scenario: 내 카드만
- **WHEN** 팀 멤버가 `GET /teams/{id}/tasks?filter=mine`을 호출한다
- **THEN** 시스템은 `assignee_id`가 현재 사용자 id인 태스크만 반환한다

#### Scenario: 미할당만
- **WHEN** 팀 멤버가 `GET /teams/{id}/tasks?filter=unassigned`를 호출한다
- **THEN** 시스템은 `assignee_id`가 NULL인 태스크만 반환한다

#### Scenario: 무효 파라미터
- **WHEN** 팀 멤버가 `GET /teams/{id}/tasks?filter=invalid`를 호출한다
- **THEN** 시스템은 400 상태와 `{code: "INVALID_QUERY_PARAM", msg: ...}`를 반환한다

