## Context

`ui-design-system`은 라이트 단일 모드 전제로 정의됐다. 이번 변경은 CSS 변수 오버라이드 방식으로 다크 팔레트를 추가하고, 사용자가 헤더에서 토글로 즉시 전환할 수 있게 한다. 빌드 도구 없음 원칙은 유지(Tailwind CDN + `tokens.css` CSS 변수).

## Goals / Non-Goals

**Goals:**
- 라이트/다크/시스템 자동 3종 사용자 선호 지원
- 모든 페이지에서 FOUC(Flash of Unstyled Content) 없이 즉시 적용
- 새 세션에서도 사용자 선호 유지 (localStorage)
- 색상 외 모든 토큰(간격·radius·shadow) 그대로 재사용

**Non-Goals:**
- 사용자 계정에 묶인 서버 측 테마 저장
- 컴포넌트별 dark variant 클래스(`dark:bg-...`) 도입 — CSS 변수만으로 충분
- 자동 시각 회귀 테스트

## Decisions

### 1. 적용 메커니즘: `html[data-theme]` 속성 + CSS 변수 오버라이드

**대안:** Tailwind `dark:` variant, CSS class on body, body class toggling.
**선택 이유:** `tokens.css`가 이미 `:root`에 변수 정의 → `html[data-theme="dark"]` 셀렉터로 변수만 오버라이드하면 모든 컴포넌트 자동 반영. Tailwind 임의값 클래스도 같이 따라옴. 빌드 도구 없이 즉시 적용 가능.

### 2. 3단계 사이클: light → dark → system → light

**대안:** 2단계 (light/dark만), 별도 settings 페이지에서 라디오 선택.
**선택 이유:** 토글 버튼 1개로 모든 모드 도달 가능. 아이콘이 현재 모드를 직접 표시(☀️/🌙/🖥️). 별도 페이지 추가 불필요.

### 3. FOUC 방지: 인라인 스크립트로 페이지 head에서 즉시 설정

**대안:** body 진입 후 module script로 설정.
**선택 이유:** ES 모듈은 deferred 실행이라 첫 페인트 후 적용됨 → 라이트→다크 깜빡임 발생. `<head>` 안 inline `<script>`로 `<html>` 진입 직후 `data-theme` 결정.

### 4. 다크 팔레트 매핑 원칙

- 배경: `--color-bg` 짙은 슬레이트 (#0F172A), `--color-surface` 한 단계 밝게 (#1E293B)
- 텍스트: `--color-text` 거의 흰색 (#E2E8F0), `--color-text-muted` 중간 회색 (#94A3B8)
- 컬럼 색: 라이트의 채도 높은 파스텔 → 다크에선 채도 낮춘 어두운 배경 + 밝은 텍스트
  - TODO: bg `#3A2A0F` / text `#FCD34D`
  - DOING: bg `#162447` / text `#93C5FD`
  - DONE: bg `#0F2E1C` / text `#86EFAC`
- Primary/Accent는 라이트와 동일 hex 유지 (브랜드 일관성), hover만 살짝 조정 가능 — 이번 propose에서는 동일 유지

### 5. 시스템 모드 = `prefers-color-scheme: dark` 미디어 쿼리

**대안:** OS API 호출, 매 분 polling.
**선택 이유:** CSS `@media` 또는 JS `window.matchMedia`로 즉시 감지 가능. `prefers-color-scheme` 변경 이벤트도 listen 가능.

JS에서 system 모드일 때:
```js
const mq = window.matchMedia("(prefers-color-scheme: dark)");
const applied = mq.matches ? "dark" : "light";
document.documentElement.dataset.theme = applied;
mq.addEventListener("change", e => /* 다시 적용 */);
```

### 6. localStorage 키: `taskflow_theme` 값은 `"light" | "dark" | "system"`

**선택 이유:** 명시 선택과 자동(`system`)을 구분 저장. 사용자가 명시한 라이트는 OS가 다크여도 라이트 유지.

### 7. 토글 위치

- **헤더 있는 페이지**(board/chat/members): 공용 헤더 우측, 로그아웃 옆
- **헤더 없는 페이지**(login/teams): 우상단 fixed 위치에 작은 토글 버튼
- 같은 컴포넌트 (`renderThemeToggle(target)`)로 재사용

## Risks / Trade-offs

- **[3rd party UI(Tailwind CDN)는 다크 미디어 쿼리에 자동 응답 X]** → 우리 컴포넌트는 CSS 변수 기반이므로 무관. Tailwind 색상 클래스(`bg-amber-200` 등 임시 사용분)도 다크 모드에서 보일 수 있도록 단계적으로 변수 클래스로 마이그레이션.
- **[테마 전환 순간 일부 transition flash]** → `tokens.css`에 `color`/`background-color`에 `transition: 0.15s ease` 한 줄 추가로 자연스럽게.
- **[localStorage 비활성/사파리 시크릿]** → 저장 실패 시 silent. 다음 진입 시 system 기본으로 작동.
- **[Tailwind CDN의 `bg-amber-200` 같은 직접 색 사용분이 다크 모드에서 부적합]** → 우리 코드의 라이트-only Tailwind 색 클래스를 점진적으로 CSS 변수로 마이그레이션. 이번 propose에서 핵심 페이지(login/teams/board/chat/members)만 처리, 잔여는 보조 propose에서.

## Migration Plan

1. `tokens.css`에 다크 변수 오버라이드 블록 추가
2. `theme.js` 작성, 모든 페이지 import
3. 각 페이지 `<head>`에 FOUC 방지 인라인 스크립트 1줄 추가
4. `header.js`에 테마 토글 렌더 추가
5. 헤더 없는 페이지(login/teams)에 컴팩트 토글 별도 렌더
6. 로컬 라이트/다크 토글 동작 검증
7. `vercel --prod` 재배포

롤백: localStorage `taskflow_theme` 키 영향 없음 (값 무시되면 system 기본). DB·API 변경 없으므로 무위험 롤백.

## Open Questions

- 컬러 컬럼 헤더의 다크 매핑 채도/명도: 위에서 정한 값(#3A2A0F 등)으로 충분한지, 시안 작업 후 조정
- 자기 메시지 버블 다크 모드 색: 라이트 동일 primary 유지 vs 더 부드러운 청록 — 일단 동일 유지
- 토글 버튼 키보드 단축키 (예: `Cmd/Ctrl+Shift+L`) 추가 여부 — 이번엔 미포함
