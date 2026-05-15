## Why

현재 시스템은 라이트 모드만 지원한다 (이전 propose `apply-storyboard-wireframes`의 Decision #1 및 ui-design-system spec에 명시). 야간 작업·디바이스 시스템 설정 일관성·접근성 측면에서 다크 테마 옵션 수요가 일반적이므로, MVP 다음 단계로 다크/라이트/시스템 자동 3종 테마를 도입한다.

이 변경은 시각 토큰의 라이트/다크 매핑을 정의하고, 사용자가 헤더에서 토글로 즉시 전환할 수 있게 한다. 사용자 선호는 `localStorage`에 저장되어 새 세션에서도 유지된다.

## What Changes

### 디자인 토큰 — 다크 팔레트 추가 (ui-design-system MODIFIED)

- 모든 색상 토큰에 다크 모드 매핑 추가 (배경 어둡게, 텍스트 밝게, 컬럼 색 채도 낮춤)
- `prefers-color-scheme` 시스템 자동 감지 지원
- `html[data-theme="light|dark"]` 속성으로 명시적 강제 가능

### 테마 토글 UI (신규 동작)

- 공통 헤더(`header.js`)에 테마 토글 버튼 추가 (☀️ / 🌙 / 🖥️ 3상태 사이클)
- 클릭 시 `light → dark → system → light` 순서로 전환
- 선택값은 `localStorage[taskflow_theme]`에 저장
- 첫 진입 시 `system` 기본 (사용자 OS 설정 추종)
- 로그인 화면·팀 선택 화면처럼 헤더가 없는 페이지에도 우상단 컴팩트 토글 노출

### Out of Scope

- 색상 외 디자인 토큰의 모드 분기 (간격·radius·shadow는 모드 무관)
- 컴포넌트 단위 dark variant CSS 클래스 추가 (모든 분기는 CSS 변수로만)
- 자동 시각 회귀 테스트
- 사용자별 서버 측 테마 저장 (계정 동기화) — 클라이언트 로컬 저장만

## Capabilities

### New Capabilities
없음.

### Modified Capabilities
- `ui-design-system`: 색상 토큰 Requirement에 다크 모드 매핑 추가 + 다크모드 미지원 시나리오 제거. 신규 Requirement로 "테마 모드 토글" 추가.

## Impact

- **신규 CSS**: `frontend/css/tokens.css`에 `[data-theme="dark"]` 셀렉터 블록 추가 (라이트 변수 오버라이드)
- **신규 JS**: `frontend/js/theme.js` (적용/저장/순회 로직), 모든 페이지에서 페이지 진입 즉시 import
- **HTML 변경**: 모든 페이지의 `<html>` 태그에 초기 `data-theme` 속성 인라인 스크립트로 설정 (FOUC 방지)
- **공용 헤더 변경**: 로그아웃 옆에 테마 토글 버튼 추가
- **헤더 없는 페이지 (login/teams)**: 우상단 컴팩트 토글 별도 배치
- **DB 변경**: 없음
- **API 변경**: 없음
- **재배포**: 1회 production deploy 필요
