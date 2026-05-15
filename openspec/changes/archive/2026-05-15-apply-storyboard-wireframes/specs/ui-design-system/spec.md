## ADDED Requirements

### Requirement: 색상 토큰

시스템은 모든 프론트엔드 화면에서 다음 색상 토큰만 SHALL 사용해야 한다. 색상 변경은 토큰 정의(`frontend/css/tokens.css`) 1곳에서만 이루어져야 한다.

| 토큰 | Hex | 용도 |
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

#### Scenario: 색상 토큰 사용 강제
- **WHEN** 새 컴포넌트나 페이지가 색상을 지정한다
- **THEN** 직접 hex 코드(`#14808F`) 또는 Tailwind 기본 색(`text-teal-600`) 대신 토큰 변수(`var(--color-primary)`) 또는 Tailwind 임의값 클래스(`bg-[var(--color-primary)]`)를 사용한다

#### Scenario: 다크모드 미지원 명시
- **WHEN** 현재 MVP 시점에 다크모드를 지원하는지 평가한다
- **THEN** 시스템은 라이트 모드만 SHALL 지원한다 (`prefers-color-scheme` 대응은 후속 propose에서 다룬다)

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
