# user-auth Specification

## Purpose
TBD - created by archiving change add-taskflow-mvp. Update Purpose after archive.
## Requirements
### Requirement: 이메일/비밀번호 회원가입

시스템은 이메일과 비밀번호로 신규 사용자 계정을 생성 SHALL 한다. 비밀번호는 bcrypt로 해시되어 저장 MUST 되며 평문 저장은 금지된다. 이메일은 UNIQUE 제약을 가진다.

#### Scenario: 신규 이메일로 가입 성공
- **WHEN** 클라이언트가 `POST /auth/signup`에 `{email, password}`를 전송한다
- **THEN** 시스템은 201 상태와 JWT 토큰을 반환하고, users 테이블에 새 행을 생성하며 password_hash 컬럼에는 bcrypt 해시만 저장한다

#### Scenario: 이미 가입된 이메일로 가입 시도
- **WHEN** 클라이언트가 기존에 존재하는 이메일로 `POST /auth/signup`을 호출한다
- **THEN** 시스템은 409 상태와 `{code: "EMAIL_EXISTS", msg: ...}` 형식의 에러를 반환한다

### Requirement: 이메일/비밀번호 로그인

시스템은 등록된 이메일/비밀번호 조합에 대해 JWT 토큰을 발급 SHALL 한다. 비밀번호 검증은 bcrypt 비교로 수행 MUST 한다.

#### Scenario: 올바른 자격증명으로 로그인
- **WHEN** 클라이언트가 `POST /auth/login`에 등록된 `{email, password}`를 전송한다
- **THEN** 시스템은 200 상태와 JWT 토큰(만료 24h, 갱신 없음)을 반환한다

#### Scenario: 잘못된 비밀번호로 로그인
- **WHEN** 클라이언트가 존재하는 이메일과 잘못된 비밀번호로 `POST /auth/login`을 호출한다
- **THEN** 시스템은 401 상태와 `{code: "INVALID_CREDENTIALS", msg: ...}`를 반환한다

#### Scenario: 존재하지 않는 이메일로 로그인
- **WHEN** 클라이언트가 등록되지 않은 이메일로 `POST /auth/login`을 호출한다
- **THEN** 시스템은 401 상태와 `{code: "INVALID_CREDENTIALS", msg: ...}`를 반환한다 (이메일 존재 여부 비노출)

### Requirement: JWT 발급과 검증

시스템은 가입/로그인 성공 시 24시간 만료의 JWT를 발급 SHALL 한다. 보호된 엔드포인트는 Authorization 헤더의 Bearer 토큰을 검증 MUST 하며, 누락/만료/위변조 시 401을 반환한다.

#### Scenario: 유효한 토큰으로 보호 엔드포인트 호출
- **WHEN** 클라이언트가 유효한 JWT를 Authorization 헤더에 포함하여 보호 엔드포인트를 호출한다
- **THEN** 시스템은 토큰을 검증하고 정상 응답을 반환한다

#### Scenario: 만료된 토큰으로 호출
- **WHEN** 클라이언트가 24시간 경과한 JWT로 보호 엔드포인트를 호출한다
- **THEN** 시스템은 401 상태와 `{code: "TOKEN_EXPIRED", msg: ...}`를 반환한다

#### Scenario: 헤더 누락
- **WHEN** 클라이언트가 Authorization 헤더 없이 보호 엔드포인트를 호출한다
- **THEN** 시스템은 401 상태와 `{code: "UNAUTHORIZED", msg: ...}`를 반환한다

### Requirement: 현재 사용자 정보 조회

인증된 사용자는 `GET /auth/me`로 자신의 계정 정보를 조회 SHALL 할 수 있다. 비밀번호 해시는 응답에 포함 MUST NOT 한다.

#### Scenario: 본인 정보 조회 성공
- **WHEN** 인증된 사용자가 `GET /auth/me`를 호출한다
- **THEN** 시스템은 200 상태와 `{id, email, created_at}`을 반환한다 (password_hash 제외)

### Requirement: 로그아웃

클라이언트는 `POST /auth/logout`을 호출하여 로그아웃을 통지 SHALL 할 수 있다. JWT는 갱신·블랙리스트 없이 단순 만료 정책을 사용하므로, 서버는 클라이언트가 토큰을 폐기하도록 안내만 한다.

#### Scenario: 로그아웃 호출
- **WHEN** 클라이언트가 `POST /auth/logout`을 호출한다
- **THEN** 시스템은 204 상태를 반환하고, 클라이언트는 localStorage의 JWT를 제거할 책임을 가진다

