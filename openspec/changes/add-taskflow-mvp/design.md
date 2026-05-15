## Context

TaskFlow MVP는 그린필드 학습 프로젝트로, Day 2 시점까지 완성한다. 백엔드는 FastAPI 단일 서버, 프론트엔드는 Vanilla JS + Tailwind, 데이터 저장은 로컬 SQLite와 배포용 Neon(Postgres) 양쪽을 SQLAlchemy로 호환한다.

대상 사용자는 한국어 사용자만(다국어 미지원), 팀당 5명 이내·동시 50명, 최신 Chrome+Safari 환경을 가정한다. 실시간성은 WebSocket 없이 5초 폴링으로 대체하여 운영/구현 복잡도를 낮춘다.

## Goals / Non-Goals

**Goals:**
- 단일 서버·단일 DB로 모든 기능 제공 (마이크로서비스 분리 없음)
- 로컬 일체형(StaticFiles) 실행과 Vercel(FE+BE) 한 줄 배포의 양립
- API 응답 100ms 이내, 칸반 드래그 50ms 이내 반응
- 신규 합류자가 1분 안에 팀 컨텍스트를 파악할 수 있는 단일 화면 UX
- 자동 백업으로 데이터 손실 대비 (Neon Free 플랜 기본 기능)

**Non-Goals:**
- 마이크로서비스, 별도 워커, 메시지 큐
- 자동 테스트 (pytest/jest 등)
- 관측성 인프라 (Sentry, 로그 수집기)
- 다국어, 페이지별 세분 권한, 파일 첨부, 전문 검색
- WebSocket/SSE 기반 실시간 푸시
- 페이지네이션·정렬·검색 같은 고급 조회 기능

## Decisions

### 1. 백엔드 프레임워크: FastAPI

**대안:** Flask, Express(Node), NestJS, Django REST.
**선택 이유:** Pydantic 기반 자동 스키마 검증·OpenAPI 문서 자동 생성·async 친화, 학습 곡선 완만. 18개 엔드포인트 규모에 과한 추상화 없음.

### 2. 데이터 계층: 로컬 SQLite + 배포 Neon(Postgres), SQLAlchemy 양쪽 호환

**대안:** 로컬도 Postgres(Docker), SQLite 단독 + 배포도 SQLite.
**선택 이유:** 로컬은 zero-setup이 중요(SQLite는 파일 한 개), 배포는 자동 백업·동시성·관리형이 중요(Neon). SQLAlchemy는 양쪽 추상화 가능. SQLite는 git 제외(데이터 손실 대비).

### 3. 인증: JWT(24h, 갱신 없음) + bcrypt 해시 + localStorage 저장

**대안:** 서버 세션(cookie + session store), refresh token 회전.
**선택 이유:** 단일 서버이지만 FE/BE가 동일 origin이 아닌 배포 시나리오(Vercel)에 적합. 갱신 없음 = 만료 시 재로그인 단순화. localStorage는 XSS 위험이 있으나 MVP 범위에서 수용. bcrypt는 평문 저장 사고 차단.

### 4. 실시간성: 5초 폴링 (WebSocket 미사용)

**대안:** WebSocket, Server-Sent Events.
**선택 이유:** Vercel Serverless 환경에서 장기 연결은 제약·비용·구현 복잡도 증가. 채팅 메시지 빈도가 낮은 소규모 팀에서 5초 지연 허용 가능. `GET /teams/{id}/messages?since=<timestamp>` 로 증분만 가져옴.

### 5. 프론트엔드: Vanilla JS + Tailwind (빌드 도구 없음)

**대안:** React/Next.js, Vue, Svelte.
**선택 이유:** 4화면 규모에 SPA 프레임워크 과함. Tailwind CDN으로 빌드 단계 제거, 학습 부담 최소화. AI가 임의 디자인하지 않도록 와이어프레임 사전 정의.

### 6. 배포: Vercel(FE+BE 동일 프로젝트) + Vercel Storage Neon (Pooled)

**대안:** Railway, Render, 직접 VPS.
**선택 이유:** Vercel은 git push→자동 배포, MCP로 한 줄 배포 가능. Vercel Storage Neon은 Pooled 커넥션 문자열을 환경변수로 자동 주입. CORS 허용 도메인은 환경변수로 명시.

### 7. 권한 모델: 팀 admin/member 2단계만

**대안:** RBAC, 페이지별 세분 권한.
**선택 이유:** 팀 생성자가 admin, 합류자는 member. 페이지별 권한 없음(범위 외). 멤버십 확인만으로 모든 팀 자원 접근 인가.

### 8. 입력 한계: 메시지 1000자, 태스크 제목 자유(서버 검증 없음, FE에서 표시 제한)

**선택 이유:** 메시지는 DB 폭발 방지 차원에서 1000자 제한. 태스크 제목은 짧을 것으로 가정.

### 9. 에러 응답 포맷: `{code, msg}` 일관

**선택 이유:** AI 구현 시 추측 여지 차단. 모든 4xx/5xx 응답은 동일 포맷.

## Risks / Trade-offs

- **[XSS로 JWT 탈취 가능성]** → localStorage 저장은 MVP 범위에서 수용. 입력 이스케이프와 CORS 도메인 명시로 부분 완화.
- **[5초 폴링 지연·서버 부하]** → 팀당 50명 동시 가정에서 허용 범위. `since=` 증분 조회로 페이로드 최소화.
- **[로컬 SQLite와 Neon Postgres 방언 차이]** → SQLAlchemy 표준 기능만 사용, Postgres 전용(JSONB, ARRAY 등) 미사용.
- **[JWT 24h 무갱신 → 토큰 만료 시 작업 중단]** → 만료 시 401 응답·FE에서 강제 로그아웃 처리. MVP 수용.
- **[초대코드 추측 공격]** → 8~10자리 영숫자 랜덤(예: ABCD-1234) + UNIQUE 제약. 무차별 시도는 MVP에서 별도 차단 없음.
- **[자동 테스트 부재로 회귀 위험]** → 수동 동작 확인만. MVP 범위로 수용, 후속 변경에서 도입 고려.
- **[Vercel 무료 티어 한도]** → 동시 50명 가정과 메시지 1000자 제한으로 한도 내 운영 가정.

## Migration Plan

그린필드 프로젝트이므로 마이그레이션 없음. 첫 배포 절차만 정리:

1. Vercel 프로젝트 생성, GitHub 저장소 연결
2. Vercel Storage > Neon Postgres 프로비저닝 (Pooled 자동 주입)
3. 환경변수: `DATABASE_URL`(주입), `JWT_SECRET`(생성), `CORS_ORIGINS`(배포 도메인)
4. `vercel.json` (또는 `vercel.ts`)로 FastAPI 함수 라우팅 + 정적 자산 경로 설정
5. 첫 배포 후 `/auth/signup`으로 초기 사용자 생성 → 팀 생성 → 동작 확인
6. 롤백: Vercel 대시보드 이전 배포 promote (1클릭)

## Open Questions

- 초대코드 형식 확정: `ABCD-1234`처럼 하이픈 포함? 길이?
- 태스크 제목 최대 길이 서버 측 강제 여부?
- 동일 사용자가 같은 팀에 중복 합류 시도시: 멱등(이미 멤버면 그대로 통과) vs 409 에러?
- 메시지 삭제 권한: 본인만 vs admin 추가? (지금은 본인만으로 가정)
- 태스크 삭제 권한: 모든 멤버 vs 생성자/admin? (지금은 멤버 누구나로 가정)
