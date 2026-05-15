## ADDED Requirements

### Requirement: 메시지 응답에 발신자 이메일 포함

시스템은 메시지 응답 페이로드(`MessageOut`)에 `user_email` 필드를 SHALL 포함해야 한다. 이는 클라이언트가 발신자 표시를 위해 추가 조회 없이 사용할 수 있도록 한다.

#### Scenario: 응답에 user_email 포함
- **WHEN** 팀 멤버가 `GET /teams/{id}/messages`를 호출한다
- **THEN** 각 메시지 객체는 `{id, team_id, user_id, user_email, content, created_at}` 형식으로 반환된다

#### Scenario: 단건 조회도 동일 포맷
- **WHEN** 팀 멤버가 `GET /messages/{id}`를 호출한다
- **THEN** 응답에 `user_email`이 포함된다

## MODIFIED Requirements

### Requirement: 팀 채팅 메시지 폴링 조회

팀 멤버는 해당 팀의 메시지를 시간순으로 조회 SHALL 할 수 있다. 초기 조회 시 `limit` 쿼리 파라미터를 통해 최근 N개를 가져올 수 있고, `since` 쿼리 파라미터로 증분 조회를 지원 MUST 한다. 클라이언트는 5초 간격 폴링으로 신규 메시지를 가져온다.

기본값과 제한:
- `limit`: 기본 50, 최소 1, 최대 200
- `since`: ISO 8601 형식, 기본 없음

`limit`이 적용되더라도 응답 배열은 `created_at` 오름차순으로 정렬된다 ("최근 N개를 시간순"으로 반환).

`since`와 `limit`이 함께 주어지면 `since` 이후 메시지 중 최대 `limit`개를 시간 오름차순으로 반환한다.

#### Scenario: 초기 조회 (기본 50개)
- **WHEN** 팀 멤버가 `GET /teams/{id}/messages`를 호출한다 (limit/since 미지정)
- **THEN** 시스템은 200 상태와 가장 최근 메시지 50개를 `created_at` 오름차순으로 반환한다

#### Scenario: limit 명시
- **WHEN** 팀 멤버가 `GET /teams/{id}/messages?limit=20`을 호출한다
- **THEN** 시스템은 가장 최근 메시지 20개를 `created_at` 오름차순으로 반환한다

#### Scenario: since 이후 증분 조회 (5초 폴링)
- **WHEN** 팀 멤버가 `GET /teams/{id}/messages?since=<ISO timestamp>`를 호출한다
- **THEN** 시스템은 200 상태와 created_at이 since보다 큰 메시지만 created_at 오름차순으로 반환한다 (default limit 50 적용)

#### Scenario: 신규 메시지가 없는 경우
- **WHEN** since 이후 새 메시지가 없는 상태로 폴링한다
- **THEN** 시스템은 200 상태와 빈 배열 `[]`을 반환한다

#### Scenario: 무효한 limit 값
- **WHEN** 팀 멤버가 `limit=0`, `limit=-1`, `limit=201`로 호출한다
- **THEN** 시스템은 400 상태와 `{code: "INVALID_QUERY_PARAM", msg: ...}`를 반환한다
