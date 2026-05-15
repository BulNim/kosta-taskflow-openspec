## ADDED Requirements

### Requirement: 팀 생성

인증된 사용자는 새 팀을 생성 SHALL 할 수 있다. 팀 생성자는 자동으로 admin 멤버가 되며, 시스템은 UNIQUE 한 초대코드를 발급 MUST 한다.

#### Scenario: 새 팀 생성 성공
- **WHEN** 인증된 사용자가 `POST /teams`에 `{name}`을 전송한다
- **THEN** 시스템은 201 상태와 `{id, name, invite_code, owner_id}`를 반환하고, teams 테이블에 새 행을 생성하며 생성자를 owner로 설정한다

#### Scenario: 초대코드는 UNIQUE
- **WHEN** 여러 팀이 동시에 생성된다
- **THEN** 각 팀의 invite_code는 서로 중복되지 SHALL NOT 않으며, DB UNIQUE 제약 위반 시 시스템은 재생성하여 발급한다

### Requirement: 초대코드 기반 팀 합류

인증된 사용자는 유효한 초대코드로 기존 팀에 합류 SHALL 할 수 있다. 합류한 사용자는 member 역할을 부여받는다.

#### Scenario: 유효한 초대코드로 합류
- **WHEN** 인증된 사용자가 `POST /teams/join`에 `{invite_code}`를 전송하고 해당 코드의 팀이 존재한다
- **THEN** 시스템은 200 상태와 합류한 팀 정보를 반환하고, 멤버십을 생성한다

#### Scenario: 존재하지 않는 초대코드
- **WHEN** 인증된 사용자가 무효한 invite_code로 `POST /teams/join`을 호출한다
- **THEN** 시스템은 404 상태와 `{code: "INVALID_INVITE_CODE", msg: ...}`를 반환한다

#### Scenario: 이미 멤버인 팀에 합류 시도
- **WHEN** 이미 해당 팀의 멤버인 사용자가 같은 invite_code로 `POST /teams/join`을 호출한다
- **THEN** 시스템은 200 상태와 해당 팀 정보를 반환한다 (멱등 동작, 중복 생성 없음)

### Requirement: 내가 속한 팀 목록 조회

인증된 사용자는 자신이 멤버로 속한 모든 팀을 조회 SHALL 할 수 있다.

#### Scenario: 팀 목록 조회
- **WHEN** 인증된 사용자가 `GET /teams`를 호출한다
- **THEN** 시스템은 200 상태와 사용자가 멤버인 팀들의 배열 `[{id, name, invite_code, owner_id}]`을 반환한다

#### Scenario: 속한 팀이 없는 경우
- **WHEN** 어떤 팀에도 속하지 않은 사용자가 `GET /teams`를 호출한다
- **THEN** 시스템은 200 상태와 빈 배열 `[]`을 반환한다

### Requirement: 팀 멤버 목록 조회

팀 멤버인 인증된 사용자는 해당 팀의 멤버 목록을 조회 SHALL 할 수 있다. 비밀번호 해시는 응답에 포함 MUST NOT 한다.

#### Scenario: 본인이 속한 팀의 멤버 조회
- **WHEN** 팀 멤버가 `GET /teams/{id}/members`를 호출한다
- **THEN** 시스템은 200 상태와 멤버 배열 `[{id, email}]`을 반환한다

#### Scenario: 본인이 속하지 않은 팀 조회 시도
- **WHEN** 해당 팀의 멤버가 아닌 사용자가 `GET /teams/{id}/members`를 호출한다
- **THEN** 시스템은 403 상태와 `{code: "NOT_TEAM_MEMBER", msg: ...}`를 반환한다
