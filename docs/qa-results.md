# 검증 기록 — RAVIRGO spatial archive

기록일: 2026-10-17 (Asia/Seoul).
작업 환경: Linux, Node 24.19.0, Chromium 154 / SwiftShader. 데스크톱·태블릿·모바일은
브라우저 viewport/터치 에뮬레이션이며 실제 스마트폰 또는 Safari 결과가 아니다.
브라우저 기능/모델 검증 대상: `d23682d`. 최종 화면 비율 보정·촬영·성능 대상: `17493bd`
(`codex/immersive-archive`). 화면 비율 보정 후 타입·25개 단위 검사·정적 빌드도 다시 통과했다.

## 정적/단위 검사

- `npm ci --offline --cache /workspace/.npm-cache`: 설치 성공 (네트워크 대신 제공된 npm 캐시 사용).
- `npm run build`: Astro static 빌드 성공. Three.js lazy chunk의 500kB 초과 경고는 남는다.
- `npm run typecheck`: 통과.
- `npm run test:unit`: 25개 통과. 서비스 1/2/3/5/10/12/30 × 예산 1/2/3 순서·반복·역방향,
  반시계 경로, 접점/tangent 연속성, core/플랫폼 여유, 진입·공전·퇴장 모델 간격, 품질 저하 판단,
  반복 페이드의 GLB opacity/blend mode 보존, desktop/mobile 진입·퇴장의 난간 여유.
- `node qa-registration.mjs`: 임시 소스 복사본에 모델 없는 featured 서비스 1개 추가 후
  정적 빌드. 아카이브·검색 데이터·일반 상세 페이지·Sitemap·JSON-LD·3D 이름표 생성 및
  홈/아카이브 Naver 인증 보존 확인. 운영 데이터는 변경하지 않았다.

## 브라우저 검사

- `npm test`: 단위 25개와 Chromium 전체 회귀 통과. 반복/역방향·단계별 경로·고정 카메라,
  정지 시 render count 유지, 검색/필터, 3D 토글과 위치 복원, 키보드, 휠 탈출/앵커/뒤로 가기,
  실제 모델 body와 HTML 이름표 클릭, WebGL context loss/복구, Low profile, archive 검색 URL
  복원, 모바일 가로 탐색/세로 스크롤을 확인했다. reduced-motion/WebGL 미지원/saveData/no-JS에서도
  서비스 링크를 유지한다. pageerror 0건.
  반복 토글 2회 모두 renderer의 살아 있는 자원 수는 geometry 135, texture 27이었다.
  이는 단기 반복 중 자원 수 증가가 없다는 증거이며 GPU 메모리 바이트나 장시간 누수 검사는 아니다.

- `node qa-navigation.mjs`: WebGL 없는 상태로 메인 ↔ 아카이브 6회 클릭/뒤로 가기,
  외부 서비스 2개 이동/뒤로 가기, pageerror 0건, 아카이브의 orbital JS 요청 0건.
  전체 브라우저 예외를 숨기지 않는다.
  문서 간 ViewTransition은 취소 예외 때문에 제외하고 CSS 도착 애니메이션과 스크롤 fade를 사용한다.
- `node qa-model-quality.mjs`: 통과. 실제 GLB 로딩/alpha, 404 fallback, 기본 모델의
  bbox/바닥 정렬, 로드 취소, 동일 설정의 prototype 1개/lease 2개를 확인했다.
  첫 lease 해제 시 공유 geometry dispose 0회, 마지막 lease 해제 후 cache.dispose에서
  3개 geometry를 해제했다. Desktop DPR 2/MSAA 4x → Mobile DPR 1.5/MSAA 2x → Desktop
  복귀 동안 progress 0.675를 유지했다. 영수증 두 메시의 퇴화 삼각형·비다양체 edge는 0개다.
- `node qa-catalogue.mjs`: 2/5/12개 모두 통과. 런타임 등록 데이터를 fixture로 교체하고
  낮은 geometry 비용으로 시작한 뒤 Balanced 활성 예산으로 한 주기와 역방향을 검사했다.
  모든 서비스가 등장하며 반복 전후 좌표가 일치한다. 첫 서비스의 GLB 404는 기본 모델로 복구한다.

| Featured 수 | 등장 확인 | 최대 활성 모델 | 최대 캐시 항목 | 브라우저 오류 |
| --- | --- | --- | --- | --- |
| 2 | 2 | 2 | 2 | 0 |
| 5 | 5 | 2 | 4 | 0 |
| 12 | 12 | 2 | 4 | 0 |

## 성능 측정 조건

`QA_FRAMES=12 QA_URL=http://127.0.0.1:4324/ node qa-performance.mjs`로 측정한다.
각 품질에서 progress를 0.675로 맞추고 같은 wheel 입력을 12 animation frame에 전달한다.
초기 4프레임을 제외한 8개 프레임 간격으로 평균 FPS/프레임 시간을 계산한다.
스크립트의 기본값은 40프레임/초기 10프레임 제외이며 `QA_FRAMES`로 변경할 수 있다.
측정 동안 다른 브라우저 검사는 실행하지 않았다.

1440×900, DPR 1의 SwiftShader 측정이며 실기기 성능 목표 충족 여부를 판정할 수 없다.
품질은 High 장면에서 순차적으로 전환했으므로 Low 초기 진입에서 줄이는 건축 분할 수와
area light의 추가 절감은 이 비교에 포함하지 않는다. CPU 제출 시간과 전체 프레임 간격은
다른 값이다. 내부 demand-render 진단은 250ms 이상의 간격을 idle 후보로 제외하므로,
이 느린 환경의 FPS는 외부 수집한 전체 rAF 간격을 기준으로 한다.

| 품질 | 평균 FPS | 평균 프레임 간격 | p95 간격 | 평균 CPU 제출 | 활성 모델 | Geometry / Texture |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| High | 0.0717 | 13,949.94ms | 14,529.20ms | 4.86ms | 2 | 135 / 27 |
| Balanced | 0.0755 | 13,244.30ms | 14,426.60ms | 4.04ms | 2 | 135 / 27 |
| Low | 0.0894 | 11,185.18ms | 11,781.20ms | 1.83ms | 1 | 132 / 11 |

이 실행 환경에서는 모든 품질에서 원활한 움직임을 달성하지 못했다. GPU 문자열은
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`다.
소프트웨어 렌더링의 긴 대기 시간 때문에 CPU 제출 시간만으로 체감 성능을 판단하면 안 된다.
표본은 품질당 8개로 짧으며 p95는 사실상 최대 표본값이다. 실기기 FPS를 추정하거나
60fps 목표를 통과했다고 해석하지 않는다. 실제 GPU·모바일에서 더 긴 입력 구간과 발열 조건을
측정한 뒤 프로필 기본값을 조정해야 한다. 원시 값: [performance.json](qa/performance.json).

## 화면 비교 기준

| 항목 | 변경 전 | 변경 후 검토 기준 |
| --- | --- | --- |
| 장면 비중 | 장면 위 검색/필터 | viewport stage, 검색은 아래 HTML 목록 |
| 중심 | offset core와 가변 반지름 | core/공전 중심 (0,0), 반지름 4.6 |
| 받침대 지지 | 기존 경로 구성 | orbit 외곽 5.76 < 내부 rim 6.28 |
| 모델 비율 | 서비스별 내부 스케일 | bbox 정규화, 최대 1.75×1.8×1.75 |
| 표면 | 기존 procedural PBR | 석재 거칠기 상향, 노출 조정, brass reflection 유지 |
| 가림 | 실제 메시와 HTML labels | 실제 depth/raycast 유지, 숨겨진 ancestor 제외 |
| 아카이브 | 메인 행 목록만 존재 | 독립 URL, 포스터 카드, 검색/필터, 실제 링크 |
| 모바일 | compact 440px | 세로 화면의 공간 탐색/탈출 UI와 1열 archive |

원본 참조 PNG 두 장은 저장소에 없어 정량적인 이미지 유사도/픽셀 일치율은 측정하지 않았다.
기존 main 런타임과 변경 후의 동일 viewport 스크린샷을 비교한다.
각 버전의 초기 진입 장면이며 모델의 공전 위치를 강제로 일치시킨 픽셀 비교는 아니다.

최종 홈/아카이브 6장은 실제 WebGL 장면과 SSR 페이지에서 촬영했다. 세 크기 모두 초기
서비스 이름표 2개가 표시되고 문서의 가로 넘침이 없음을 자동 검사했으며 pageerror는 0건이다.
육안 검토에서도 홈의 이름표·하단 탐색 컨트롤과 아카이브의 검색·필터·서비스 링크가 겹치지 않는다.
Desktop/Tablet 아카이브는 2열, Mobile은 1열이다. 세로 Tablet의 수평 시야 보정으로
두 모델과 이름표가 화면 안에 들어오며, 전체 장면은 여전히 실제 메시로 렌더된다.

| Viewport | 기준 main (`bd590c7`) | 공간 쇼케이스 | 새 아카이브 |
| --- | --- | --- | --- |
| Desktop 1440×900 | [화면](qa/baseline/desktop.png) | [화면](qa/desktop.png) | [전체 페이지](qa/archive-desktop.png) |
| Tablet 768×1024 | [화면](qa/baseline/tablet.png) | [화면](qa/tablet.png) | [전체 페이지](qa/archive-tablet.png) |
| Mobile 390×844 | [화면](qa/baseline/mobile.png) | [화면](qa/mobile.png) | [전체 페이지](qa/archive-mobile.png) |

## 원시 검증 기록과 남은 확인

[전체 회귀](qa/regression.json), [페이지 이동](qa/navigation.json),
[모델/품질](qa/model-quality.json), [2·5·12개 카탈로그](qa/catalogue.json),
[서비스 자동 등록](qa/registration.json), [화면 오류](qa/capture-errors.json)를 함께 보관한다.

실제 스마트폰·하드웨어 GPU·Safari·Firefox·장시간 발열·GPU 메모리 바이트는 검증하지 않았다.
Three.js 관련 lazy chunk는 960,904 bytes(gzip 287,828 bytes)로 크기 경고가 남아 있으나,
아카이브는 이 번들을 요청하지 않는다. 초기 요청 비용과 장시간 사용 성능은 실기기 검증의
후속 항목이다. 구현 및 검증의 상세 범위는 [spatial-archive.md](spatial-archive.md)에 정리했다.
