# kanban-board Specification

## Purpose
TBD - created by archiving change add-taskflow-mvp. Update Purpose after archive.
## Requirements
### Requirement: 팀 태스크 생성

팀 멤버인 인증된 사용자는 해당 팀에 태스크를 추가 SHALL 할 수 있다. 태스크 제목은 1~200자로 제한 MUST 된다. 새 태스크의 기본 상태는 `TODO`이며, 생성자는 자동으로 기록 MUST 된다.

#### Scenario: 태스크 추가 성공
- **WHEN** 팀 멤버가 `POST /teams/{id}/tasks`에 `{title}`(200자 이하)을 전송한다
- **THEN** 시스템은 201 상태와 `{id, team_id, title, status: "TODO", creator_id}`를 반환한다

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

팀 멤버는 기존 태스크의 제목을 수정 SHALL 할 수 있다. 수정 시에도 제목은 1~200자 제한을 동일하게 적용 MUST 받는다.

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

