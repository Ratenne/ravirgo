# Spatial showcase + cinematic archive

작업 기준: `origin/main`의 `bd590c7` (2026-10-16). 작업 브랜치: `codex/immersive-archive`.
운영 main과 Cloudflare Pages 배포 설정을 변경하지 않는다.

## 현행 분석

최초 제공된 로컬 체크아웃은 `5cba5a1`로 원격보다 오래되었다. 원격을 fetch한 뒤 최신 main에서 독립 worktree를 생성했다. 최신 AGENTS.md의 GitHub 배포 정책과 Naver 인증을 적용했다. 요청한 파일을 모두 읽었으며 `docs/references/기존 사이트 3D 이미지.png`, `docs/references/참조용 전망대.png`는 최신 main에도 없다. 따라서 그 두 이미지와의 일치율을 주장하지 않는다. 보유한 `orbital-poster.webp`, `orbital-dusk.webp`, 실제 런타임 화면을 비교 기준으로 삼는다.

문서와 런타임의 차이:

- DESIGN.md의 전체 회전판 회전 및 GPU 소품은 과거 구현이다. 최신 코드는 고정 카메라/구조물과 개별 서비스의 반복 경로를 사용한다.
- `model-quality.md`는 5개 가격 막대를 설명하지만 실제 생성기는 4개다. 기존 4개 막대와 두 장의 닫힌 UV 영수증 메시를 유지했다.
- `loop-showcase.md`의 중심 `(0,0)`, 반지름 5.05 설명도 최신 main의 offset core/가변 반지름 경로와 달랐다. 이번 구현은 발광체와 공전 중심을 `(0,0)`에 맞추고 반지름 4.6을 사용한다.
- 최신 실제 영수증 서비스 URL은 `https://receipt-to-excel.ravirgo.com/`이다. 과거 PRODUCT 문서의 `reciept` 철자로 되돌리지 않았다.
- 기존 정적 상세 경로와 about의 Virgo 경험, Naver verification, robots, Open Graph/JSON-LD는 유지했다.

참고 UX: [Overworld Audio](https://overworldaudio.com/)의 드래그/스크롤 탐색과 실제 마커 링크를 기능적 참고로 사용했다. [Kinoria archive](https://kinoria.studio/archive)는 조사 도구에서 접근할 수 없었으므로 직접 화면 비교를 주장하지 않는다. 아카이브는 사용자가 제시한 시네마틱 방향과 RAVIRGO의 navy/brass 자산으로 설계했다.

## 아키텍처

- `src/data/services.ts`: 서비스의 단일 소스. order와 slug로 결정적인 정렬. featured 전체에 개수 제한을 두지 않는다.
- `model-registry.ts`: 기존 procedural 생성기 선택, 일반 모델, 회전 후 Bounding Box 정규화. 받침대는 모델과 독립이며 지름 2.32, 모델은 최대 폭/깊이 1.75, 높이 1.8로 제한한다. 바닥을 y=0으로 맞춘 뒤 받침대 상면에 놓는다.
- `model-loader.ts`: GLB fetch/parse, poster, procedural, 실패 fallback. 동일 설정은 하나의 pending promise와 prototype을 공유한다. 캐시는 geometry/texture를 소유하고 각 lease는 material 복제본만 소유한다. release는 material만 해제하고 참조가 없는 prototype은 LRU prune 또는 cache.dispose에서 해제한다. 로딩 AbortSignal과 슬롯 버전 토큰이 늦게 도착한 모델의 잘못된 부착을 막는다.
- `workbench.ts`: 원형 석재 건축/발광체와 재사용 받침대 슬롯 3개. 엔진은 모델 내부 메시를 알 필요가 없다.
- `showcase-schedule.ts`: 데이터 순서와 활성 GPU 예산 분리. 서비스당 Entry → Orbit → Exit → Offstage 순환. 입력 시간을 서비스 인덱스 간격만큼 지연한 뒤 전체 주기에 modulo한다. 음수에도 동일한 연산을 사용한다. 경계의 1e-10 오차는 offstage에서 정규화한다.
- `orbital.ts`: 활성 슬롯 배정, 다음/이전 모델 preload, 가림을 고려한 raycast와 HTML 이름표, 입력, demand rendering 및 정리.
- `quality.ts`: High/Balanced/Low. Bloom의 마스크 장면부터 High 1/2, Balanced 1/4 해상도로 렌더한다. CPU 제출 시간과 rAF 대기 시간의 30프레임 창 3개를 사용하며 초기 24프레임과 창 상위 10% 지연을 제외한다. 단발성 지연으로 전환하지 않는다. 정지 시 측정용 프레임을 추가하지 않는다.
- `directory.ts`: 3D와 독립적인 검색/카테고리/URL 복원. 홈페이지에만 `scene-controller.ts`가 동적 import된다. `/archive/` 방문은 Three.js를 요청하지 않는다.
- `SearchControls.astro`, `ServiceCard.astro`: 홈페이지와 아카이브에서 같은 SSR 데이터를 사용한다. 새 상세 페이지와 Sitemap도 자동 생성된다.

## 공전/입력 계약

카메라와 건축은 고정, 사용자 입력만 시간을 움직인다. +Y에서 본 반시계 공전이다. 기존 후면 Bézier 진입/퇴장과 tangent 접속을 재사용했다. 반지름 4.6 + 받침대 반지름 1.16 = 5.76으로 6.28의 내부 황동 테두리보다 작다. 중심 발광체 반지름 1.24와도 2.2 이상의 중심 방향 여유를 갖는다. 원형 구간의 서비스 간 받침대 간격과 경로 접합을 자동 검사한다.

난간을 지나는 구간은 받침대의 전체 반지름으로 보수적으로 검사한다. 기존 진입/퇴장 높이는 이 범위에서 난간과 겹칠 수 있어 Bézier의 높이 제어점만 올렸다. 난간 상면 1.925에 대해 최소 받침대 하단은 desktop 진입 2.061, mobile 진입 2.281, 퇴장 2.215다. 계단과 측면 기둥은 공전 받침대 최대 반지름 5.76 밖에 있다. 접점과 공전 구간의 위치·높이는 유지한다.

2개 이하의 서비스가 활성 예산 안에 들어오면 기존 .29 지연을 보존한다. 그 외에는 High .4, Balanced .72, Low 1.12 입력 시간 간격을 사용한다. 단순 1/예산 간격은 공전 시작/끝 부근에서 모델이 겹쳐 더 넓은 간격으로 조정했다. 전체 반복 주기는 max(1.12, 서비스 수 × 간격)이다. 입력 감도는 전체 서비스 수와 무관하게 기존 1.12 경로 단위를 유지한다. 필터링은 데이터 정렬을 유지하며 결과를 압축하고, 해제하면 같은 입력 시간에서 원래 순서를 복원한다.

가로 스와이프는 공전, 세로 스와이프는 native scroll이다. 캔버스 하단 90px 여백의 휠, Alt+휠, UI 컨트롤의 휠은 페이지 스크롤로 빠져나온다. Ctrl+휠 확대를 가로채지 않는다. 실제 `#services` 앵커, 아카이브 링크, 이전/다음 버튼과 실제 서비스 `<a>`가 키보드 경로다. 숨겨진 모델은 raycast와 렌더에서 제외한다.

품질 변경은 슬롯을 다시 배정하므로 표시 중 모델의 구성이 달라질 수 있다. 연속 입력 중 같은 품질에서의 순서/역방향은 결정적이다. 동적 필터와 품질 변경 시에는 현재 입력 시간을 유지한다.

## 시각 및 화면 전환

첫 화면에서 검색·필터를 내려 원형 장면을 확보했다. 상단은 작고 기능적인 안내와 아카이브 링크, 하단은 escape/이전/다음/품질/3D 토글을 둔다. 이름표 hover/focus에서 설명을 펼친다. 석재 거칠기와 금속 반사, 노출을 조정했고 기존 실제 메시·PBR 입력·PMREM 반사·그림자를 사용한다. 배경 이미지는 먼 산/석양만 담당한다. 플랫폼/모델/발광체 가림은 depth buffer와 raycast로 유지한다.

아카이브는 서비스별 벡터 포스터, 큰 제목, 절제된 카드 hover, 검색/필터/없음 상태를 제공한다. CSS view transition과 스크롤에 따른 배경 fade는 지원 브라우저에서 점진적으로 적용된다. IntersectionObserver는 카드에 등장 애니메이션만 추가하며 콘텐츠를 먼저 숨기지 않는다. reduced-motion은 애니메이션과 3D를 생략한다. 페이지 이동/뒤로가기/새로고침을 JavaScript로 대체하지 않는다.

## 서비스 등록

`src/data/services.ts` 배열에 항목 하나를 추가한다. 기존 필드는 그대로 유지된다.

```ts
{
  slug: 'new-tool', name: '새 도구',
  description: '검증된 기능 설명', url: 'https://your-service.example/',
  category: 'document', categoryLabel: '문서 도구',
  searchTerms: ['키워드'], featured: true, order: 30,
  poster: '/assets/posters/new-tool.webp',
  modelType: 'poster', // procedural | glb | poster; 생략해도 기본 모델
  scale: 1, rotation: [0, 0, 0], // radians, 안전한 scale 범위 .25–1
  details: { introduction: '상세 소개', features: ['실제 기능'] }
}
```

GLB는 `public/assets/models/`에 self-contained 파일을 넣고 `modelType:'glb', modelSource:'/assets/models/tool.glb'`로 지정한다. 로딩 실패/빈 모델은 기본 받침대 전시로 복구한다. Draco/KTX 압축 디코더와 애니메이션 재생은 아직 구성하지 않았으므로 일반 GLB를 사용한다. Procedural은 기존 `price`/`receipt` 또는 registry에 등록한 생성기를 사용한다. 모델 없는 서비스 등록과 전용 모델 제작은 독립 작업이다.

정적 빌드 시 아카이브, 검색/필터, 상세 경로, Sitemap, JSON-LD와 featured 쇼케이스가 자동 반영된다. poster를 생략하면 기존 orbital poster를 HTML에서 사용하고 3D는 일반 조형을 사용한다.

## 변경 파일 안내

| 영역 | 파일 | 변경 목적 |
| --- | --- | --- |
| 서비스 데이터 | `src/data/services.ts` | 정렬·모델·포스터·상세 소개 메타데이터 |
| 모델 계층 | `src/scripts/model-registry.ts`, `model-loader.ts`, `material-fade.ts` | procedural/GLB/fallback, 정규화·캐시·소유권, 원래 투명도 보존 |
| 공전/품질 | `src/scripts/orbital.ts`, `showcase-schedule.ts`, `showcase-path.ts`, `showcase-config.ts`, `quality.ts`, `workbench.ts` | 모델 풀·입력·반복·품질·원형 건축·Bloom 연결 |
| HTML 탐색 | `src/scripts/directory.ts`, `scene-controller.ts`, `cinematic.ts` | 검색/필터와 3D 로딩 분리, 페이지 전환 |
| 화면 | `src/pages/index.astro`, `archive.astro`, `services/[slug].astro`, `src/components/SearchControls.astro`, `ServiceCard.astro`, `src/styles/home.css` | 몰입형 장면, 공통 카드와 검색, 아카이브 및 일반 상세 |
| 정적 자산/SEO | `public/assets/posters/*.svg`, `src/pages/sitemap.xml.ts` | 서비스 포스터, archive URL 등록 |
| 개발/검증 | `package.json`, `package-lock.json`, `tsconfig.json`, `tests/*.test.mjs`, `qa-*.mjs` | 타입 검사·스케줄/경로·브라우저 회귀·등록·모델·성능·화면 비교 |
| 문서/증거 | `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/loop-showcase.md`, `model-quality.md`, `spatial-archive.md`, `qa-results.md`, `docs/qa/` | 최신 구현 계약과 측정 결과 |

기존 `service-models.ts`의 생성기는 변경 없이 재사용한다. Bloom 합성은 ShaderPass의 uniform 복제가 render-target texture를 null로 만드는 기존 문제를 수정해, 생성 후 실제 텍스처를 연결한다. 원래 GLB의 opacity와 blend mode도 반복 페이드에서 유지한다.

## 품질 프로필

| 프로필 | DPR 상한 | Bloom | MSAA | 그림자 | 활성 모델 |
| --- | --- | --- | --- | --- | --- |
| High | 2 | selective .30 | 최대 4 | 2048 | 최대 3 |
| Balanced | 1.5 | selective .14 | 최대 2 | 1024 | 최대 2 |
| Low | 1 | 없음 | native | 없음 | 최대 1, 일반 poster 모델 |

메모리 ≤2GB는 Low, ≤4GB 또는 작은 화면은 Balanced, 정보가 없으면 일반 기본값을 사용한다. saveData와 reduced-motion은 정적 HTML/이미지 모드다. Low로 시작하면 건축 분할 수/텍스처 크기/area light 수도 축소한다. High에서 런타임 저하 시 기존 건축 geometry를 유지하되 후처리/그림자/모델 수를 줄인다.

## 검증과 제한

실행 결과와 화면 비교는 [qa-results.md](qa-results.md), 원시 측정값은 `docs/qa/`를 참조한다. 실제 스마트폰, Safari/Firefox, 장시간 발열과 GPU 메모리 프로파일은 별도 검증이 필요하다. GPU 메모리 바이트를 추정값으로 주장하지 않으며 반복 토글의 살아 있는 renderer 자원 수만 비교한다.

향후 모델이 늘면 서비스 포스터의 아트 디렉션과 GLB triangle/texture 예산을 별도로 운영하고, 필요할 때만 Draco/KTX2 디코더와 asset 버전을 추가한다. 실측 없이 Blender lightmap/HDR 대형 환경맵을 도입하지 않았다. 모델 캐시는 세션 한정이며 전체 카탈로그를 미리 로드하지 않는다.
