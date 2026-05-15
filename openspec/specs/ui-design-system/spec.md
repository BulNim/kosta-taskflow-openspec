# ui-design-system Specification

## Purpose
TBD - created by archiving change apply-storyboard-wireframes. Update Purpose after archive.
## Requirements
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

### Requirement: 타이포 스케일

시스템은 일관된 타이포그래피 위계를 위해 다음 스케일을 SHALL 사용해야 한다.

| 토큰 | size / weight | 용도 |
|-----|---------|------|
| `text-display` | 30px / 700 | 페이지 메인 제목 (예: "TaskFlow MVP") |
| `text-h1` | 24px / 700 | 화면 타이틀 (회원가입, 로그인) |
| `text-h2` | 18px / 600 | 섹션 헤더 (컬럼 헤더, 카드 그룹) |
| `text-body` | 14px / 400 | 본문 |
| `text-meta` | 12px / 400 | 메타 정보 (#id, @assignee, 시각) |

폰트 패밀리: `system-ui` 우선 (-apple-system → Segoe UI → Apple SD Gothic Neo → 맑은 고딕 → Roboto → sans-serif).

#### Scenario: 시스템 폰트 사용
- **WHEN** 페이지가 본문 텍스트를 렌더한다
- **THEN** OS별 한글 친화 시스템 폰트(Apple SD Gothic Neo, 맑은 고딕 등)를 우선 사용한다

### Requirement: 간격·radius·shadow 토큰

시스템은 다음 토큰을 SHALL 사용해야 한다.

| 토큰 | 값 | 용도 |
|-----|-----|------|
| `--space-1` | `4px` | 미세 간격 (icon-text) |
| `--space-2` | `8px` | 카드 내부 간격 |
| `--space-3` | `12px` | 입력 padding |
| `--space-4` | `16px` | 카드 간 간격, section padding |
| `--space-6` | `24px` | 큰 섹션 간격 |
| `--radius-sm` | `0.375rem` | 입력, 작은 버튼 |
| `--radius-md` | `0.5rem` | 일반 버튼, 카드 |
| `--radius-lg` | `1rem` | 큰 패널 (로그인 카드 등) |
| `--shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | 카드 호버 외 |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | 카드 호버, 패널 |

#### Scenario: radius 일관성 검증
- **WHEN** 새 버튼/카드/입력 컴포넌트가 추가된다
- **THEN** 위 4단계 radius 중 하나만 사용해야 하며 임의 값(예: `radius: 7px`)을 사용하지 않는다

### Requirement: 컴포넌트 invariants

시스템은 재사용 가능한 컴포넌트가 다음 invariants를 SHALL 만족해야 한다.

**버튼 (primary):**
- 배경 `var(--color-primary)`, hover `var(--color-primary-hover)`, text 흰색
- radius `var(--radius-md)`, padding `10px 16px`
- 비활성 시 배경 `#64748B`(slate-500), 클릭 불가, 텍스트 "처리 중..." 등 상태 표시

**카드 (태스크 카드):**
- 배경 `var(--color-surface)`, border `var(--color-border)`, radius `var(--radius-md)`
- hover 시 `var(--shadow-sm)` 추가
- 본문: 제목(text-body, weight 500) + 메타 행(text-meta, color-text-muted)

**입력 (text input):**
- border `var(--color-border)`, focus border `var(--color-primary)` + ring 2px 동일색 20% opacity
- radius `var(--radius-sm)`, padding `10px 12px`
- placeholder: `var(--color-text-muted)`

#### Scenario: 일관 버튼 사용
- **WHEN** 회원가입/로그인/팀 만들기/태스크 추가 버튼이 렌더된다
- **THEN** 모두 동일한 primary 버튼 스타일을 사용한다 (radius, color, padding 일치)

#### Scenario: accent 버튼은 보조 액션에만
- **WHEN** "초대코드로 합류" 같은 보조 CTA가 렌더된다
- **THEN** accent 색상을 사용하며, 같은 화면에 primary 버튼과 동시에 존재할 수 있다

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

