## ADDED Requirements

### Requirement: 사용자의 활성 팀 컨텍스트

시스템은 각 사용자에 대해 `current_team_id`(nullable FK to teams) 컬럼을 SHALL 가진다. 이는 사용자가 어느 팀의 작업 화면을 기본으로 볼지를 가리킨다. 사용자는 동시에 여러 팀의 멤버일 수 있으나, 한 번에 하나의 `current_team_id`만 활성이다.

전환 규칙:
- 신규 가입 직후: `current_team_id` = NULL
- 첫 팀 생성/합류 직후: 해당 팀이 자동으로 `current_team_id`가 된다
- 이미 `current_team_id`가 설정된 사용자가 또 다른 팀에 합류해도 `current_team_id`는 변경되지 SHALL NOT 않는다
- 명시적 전환 API는 이번 변경에서 제공하지 않는다 (후속 propose 안건)

#### Scenario: 신규 가입 시 current_team_id 없음
- **WHEN** 사용자가 `POST /auth/signup`으로 가입한다
- **THEN** `users.current_team_id`는 NULL이며 `GET /auth/me` 응답에도 `current_team_id: null`로 표시된다

#### Scenario: 첫 팀 생성 시 자동 설정
- **WHEN** `current_team_id`가 NULL인 사용자가 `POST /teams`로 팀을 생성한다
- **THEN** 해당 팀 id가 사용자의 `current_team_id`로 설정되며 응답에 반영된다

#### Scenario: 두 번째 팀 합류 시 current 유지
- **WHEN** 이미 current_team_id가 있는 사용자가 `POST /teams/join`으로 다른 팀에 합류한다
- **THEN** 멤버십은 추가되지만 `current_team_id`는 변경되지 않는다

### Requirement: 팀 미가입 사용자 강제 진입

`current_team_id`가 NULL인 인증 사용자가 보호된 팀 자원(`/teams/{id}/...`)에 접근하려 하면 시스템은 클라이언트가 팀 가입 화면(`/teams`)으로 리다이렉트하도록 SHALL 안내해야 한다.

API 수준에서는 별도 강제 흐름을 추가하지 않으며(`NOT_TEAM_MEMBER` 403 그대로), 프론트엔드 라우팅 가드가 `current_team_id` NULL인 사용자를 `/teams` 페이지에 머무르게 한다.

#### Scenario: GET /auth/me 응답에 current_team_id 노출
- **WHEN** 인증된 사용자가 `GET /auth/me`를 호출한다
- **THEN** 응답에 `current_team_id` 필드가 포함된다 (NULL 가능)

#### Scenario: current_team_id NULL인 사용자의 라우팅
- **WHEN** 클라이언트가 로그인 직후 `/auth/me` 응답을 받는다
- **THEN** `current_team_id`가 NULL이면 `/pages/teams.html`로, 값이 있으면 `/pages/board.html?team_id=<current>`로 이동한다

## MODIFIED Requirements

### Requirement: 팀 생성

인증된 사용자는 새 팀을 생성 SHALL 할 수 있다. 팀 생성자는 자동으로 admin 멤버가 되며, 생성한 사용자의 `current_team_id`가 NULL이었다면 해당 팀으로 자동 설정 MUST 된다. 시스템은 `XXXX-XXXX` 형식(영숫자 대문자+숫자 4자-4자, 하이픈 구분, 예: `ABCD-1234`)의 UNIQUE 한 초대코드를 발급 MUST 한다.

#### Scenario: 새 팀 생성 성공 (첫 팀)
- **WHEN** current_team_id가 NULL인 사용자가 `POST /teams`에 `{name}`을 전송한다
- **THEN** 시스템은 201 상태와 `{id, name, invite_code, owner_id}`를 반환하고, invite_code는 정규식 `^[A-Z0-9]{4}-[A-Z0-9]{4}$`와 일치하며, 생성자를 owner로 설정하고 그 팀을 사용자의 current_team_id로 설정한다

#### Scenario: 두 번째 팀 생성
- **WHEN** 이미 current_team_id가 있는 사용자가 `POST /teams`로 새 팀을 생성한다
- **THEN** 새 팀 멤버십(admin)은 추가되지만 사용자의 current_team_id는 변경되지 않는다

#### Scenario: 초대코드는 UNIQUE
- **WHEN** 여러 팀이 동시에 생성된다
- **THEN** 각 팀의 invite_code는 서로 중복되지 SHALL NOT 않으며, DB UNIQUE 제약 위반 시 시스템은 재생성하여 발급한다

### Requirement: 초대코드 기반 팀 합류

인증된 사용자는 유효한 초대코드로 기존 팀에 합류 SHALL 할 수 있다. 합류한 사용자는 member 역할을 부여받고, 사용자의 `current_team_id`가 NULL이었다면 해당 팀으로 자동 설정 MUST 된다.

#### Scenario: 유효한 초대코드로 합류 (첫 팀)
- **WHEN** current_team_id가 NULL인 사용자가 `POST /teams/join`에 `{invite_code}`를 전송하고 해당 코드의 팀이 존재한다
- **THEN** 시스템은 200 상태와 합류한 팀 정보를 반환하고, 멤버십을 생성하며 그 팀을 사용자의 current_team_id로 설정한다

#### Scenario: 두 번째 팀 합류 시 current_team_id 유지
- **WHEN** 이미 current_team_id가 있는 사용자가 `POST /teams/join`으로 다른 팀에 합류한다
- **THEN** 멤버십은 생성되지만 current_team_id는 변경되지 않는다

#### Scenario: 존재하지 않는 초대코드
- **WHEN** 인증된 사용자가 무효한 invite_code로 `POST /teams/join`을 호출한다
- **THEN** 시스템은 404 상태와 `{code: "INVALID_INVITE_CODE", msg: ...}`를 반환한다

#### Scenario: 이미 멤버인 팀에 합류 시도
- **WHEN** 이미 해당 팀의 멤버인 사용자가 같은 invite_code로 `POST /teams/join`을 호출한다
- **THEN** 시스템은 200 상태와 해당 팀 정보를 반환한다 (멱등 동작, 중복 생성 없음, current_team_id도 변경 없음)
