## ADDED Requirements

### Requirement: 다크 모드 색상 토큰

시스템은 라이트 모드 색상 토큰과 동일한 키에 대해 다크 모드 매핑을 SHALL 제공해야 한다. 다크 매핑은 `html[data-theme="dark"]` 셀렉터의 CSS 변수 오버라이드로 정의된다. 색상 외 토큰(간격·radius·shadow)은 모드 무관.

| 토큰 | 다크 값 | 라이트 값(참고) |
|-----|---------|---------|
| `--color-bg` | `#0F172A` | `#F8FAFC` |
| `--color-surface` | `#1E293B` | `#FFFFFF` |
| `--color-border` | `#334155` | `#E2E8F0` |
| `--color-text` | `#E2E8F0` | `#0F172A` |
| `--color-text-muted` | `#94A3B8` | `#64748B` |
| `--color-todo-bg` | `#3A2A0F` | `#FFE9C4` |
| `--color-todo-fg` | `#FCD34D` | `#B45309` |
| `--color-doing-bg` | `#162447` | `#DEEBFF` |
| `--color-doing-fg` | `#93C5FD` | `#1E40AF` |
| `--color-done-bg` | `#0F2E1C` | `#D5EBD5` |
| `--color-done-fg` | `#86EFAC` | `#166534` |
| `--color-info-bg` | `#0B4953` | `#E0F4F7` |
| `--color-info-fg` | `#7DD3FC` | `#0E6A78` |

브랜드 색상(`--color-primary`, `--color-accent`)과 위험 색상(`--color-danger`)은 다크/라이트 동일 유지.

#### Scenario: data-theme=dark 적용 시 색상 변경
- **WHEN** `<html>` 요소의 `data-theme` 속성이 `"dark"`로 설정된다
- **THEN** 모든 CSS 변수가 다크 매핑으로 즉시 오버라이드된다 (페이지 새로고침 없이)

#### Scenario: 색상 외 토큰은 모드 불변
- **WHEN** 다크 모드로 전환된다
- **THEN** 간격·radius·shadow·typography 토큰 값은 SHALL 변경되지 않는다

### Requirement: 테마 모드 선택과 영구화

사용자는 시스템 어디서나 `light` / `dark` / `system` 3종 중 하나를 선택 SHALL 할 수 있다. 선택값은 클라이언트 `localStorage[taskflow_theme]`에 저장되어 새 세션에서도 유지된다. `system`은 OS의 `prefers-color-scheme` 설정을 추종한다.

기본값(키가 없거나 무효):
- `system` (OS 설정 따라 자동)

#### Scenario: 첫 진입 시 system 기본
- **WHEN** 사용자가 처음 사이트에 접속한다 (localStorage 키 없음)
- **THEN** `prefers-color-scheme` 값에 따라 자동으로 light 또는 dark가 적용된다

#### Scenario: 토글로 명시 선택
- **WHEN** 사용자가 헤더의 테마 토글 버튼을 클릭한다
- **THEN** `light → dark → system → light` 순으로 즉시 전환되며 localStorage에 값이 저장된다

#### Scenario: 새 탭/세션에서 선호 유지
- **WHEN** 사용자가 명시 선택 후 새 탭에서 사이트를 연다
- **THEN** localStorage의 값을 읽어 동일 모드로 즉시 적용된다 (FOUC 없음)

#### Scenario: OS 설정 변경 자동 반영 (system 모드일 때)
- **WHEN** `system` 모드에서 OS의 다크/라이트 설정이 변경된다
- **THEN** 페이지가 즉시 새 OS 설정에 따라 갱신된다 (matchMedia change 이벤트)

#### Scenario: 헤더 없는 페이지에서도 접근 가능
- **WHEN** 사용자가 로그인 화면이나 팀 선택 화면을 본다
- **THEN** 우상단에 컴팩트 테마 토글이 노출되어 클릭으로 전환 가능하다

## MODIFIED Requirements

### Requirement: 색상 토큰

시스템은 모든 프론트엔드 화면에서 다음 색상 토큰만 SHALL 사용해야 한다. 색상 변경은 토큰 정의(`frontend/css/tokens.css`) 1곳에서만 이루어져야 한다. 라이트 모드 기본값을 `:root`에, 다크 모드 오버라이드를 `html[data-theme="dark"]`에 정의한다.

| 토큰 | Hex (라이트) | 용도 |
|-----|-----|------|
| `--color-primary` | `#14808F` | 브랜드, primary CTA, 활성 탭, 자기 메시지 버블 |
| `--color-primary-hover` | `#0F6975` | primary 호버 |
| `--color-accent` | `#15D9B0` | 보조 CTA (팀 합류 등) |
| `--color-accent-hover` | `#0BB495` | accent 호버 |
| `--color-todo-bg` | `#FFE9C4` | TODO 컬럼 헤더 배경 |
| `--color-todo-fg` | `#B45309` | TODO 텍스트 |
| `--color-doing-bg` | `#DEEBFF` | DOING 컬럼 헤더 배경 |
| `--color-doing-fg` | `#1E40AF` | DOING 텍스트 |
| `--color-done-bg` | `#D5EBD5` | DONE 컬럼 헤더 배경 |
| `--color-done-fg` | `#166534` | DONE 텍스트 |
| `--color-bg` | `#F8FAFC` | 페이지 배경 |
| `--color-surface` | `#FFFFFF` | 카드/패널 배경 |
| `--color-border` | `#E2E8F0` | 일반 border |
| `--color-text` | `#0F172A` | 본문 텍스트 |
| `--color-text-muted` | `#64748B` | 보조 텍스트 |
| `--color-danger` | `#DC2626` | 에러 토스트, 삭제 버튼 |

다크 모드 매핑은 별도 Requirement "다크 모드 색상 토큰" 참조.

#### Scenario: 색상 토큰 사용 강제
- **WHEN** 새 컴포넌트나 페이지가 색상을 지정한다
- **THEN** 직접 hex 코드(`#14808F`) 또는 Tailwind 기본 색(`text-teal-600`) 대신 토큰 변수(`var(--color-primary)`) 또는 Tailwind 임의값 클래스(`bg-[var(--color-primary)]`)를 사용한다
