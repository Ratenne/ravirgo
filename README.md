# RAVIRGO

Astro 정적 서비스 허브와 브라우저 Three.js 오비탈 워크벤치.

## 실행

```sh
npm install
npm run dev
npm run build
npm run preview
```

배포 출력은 `dist/`입니다. SSR 어댑터, 서버 API, Pages Functions는 사용하지 않습니다. `astro.config.mjs`는 `output: 'static'`입니다.

## 페이지

- `/` — 검색·카테고리·전체 HTML 서비스 목록과 대표 서비스의 3D 공간
- `/about/` — 기존 처녀자리 Hero Scroll Experience
- `/services/pricepulse/`, `/services/receipt-ocr/` — 정적 서비스 소개
- `/sitemap.xml`, `/robots.txt` — 검색엔진 설정

운영 서비스 링크는 사용자 제공 주소를 그대로 사용합니다.

- PricePulse: https://price-pulse.ravirgo.com
- 영수증 OCR: https://reciept-to-excel.ravirgo.com/ (`reciept` 철자 유지)

## 서비스 추가

`src/data/services.ts`에 항목을 추가하고 다시 빌드합니다. 이름·설명·카테고리·검색어·접속 URL·표시용 slug를 입력합니다. 전체 목록, 카테고리, 검색, 서비스 소개 경로, 구조화 데이터와 사이트맵은 같은 데이터를 사용합니다.

`featured: true`와 지원되는 `exhibit` 유형을 지정한 서비스만 3D에 표시하며 최대 4개입니다. 나머지는 HTML 목록에서 동일하게 접근할 수 있습니다. 새 전시 유형의 지오메트리는 `src/scripts/workbench.ts`에서 추가합니다. `src/scripts/orbital.ts`는 입력·렌더링·수명주기를 관리합니다. 현재 유형은 `price`, `receipt`입니다. 3D 전시물은 가격 데이터/실제 제품 사진이 아닌 브랜드 조형입니다.

## SEO

서비스 이름·설명·직접 링크는 초기 빌드 HTML에 포함됩니다. JavaScript/WebGL 없이도 전체 목록과 소개 페이지를 이용할 수 있습니다. 검색과 카테고리는 점진적으로 추가하는 편의 기능입니다. canonical과 사이트맵의 기준 도메인은 `https://ravirgo.com`입니다. 실제 도메인 연결은 아직 수행하지 않았습니다. 비공개 Sites 미리보기 자체가 공개 검색 노출을 보장하지 않습니다.

## Cloudflare Pages

Git 저장소를 연결할 때 다음 설정을 사용합니다.

- 빌드 명령: `npm run build`
- 출력 디렉터리: `dist`
- Node.js: 프로젝트의 현재 Astro 버전이 지원하는 최신 LTS

또는 빌드된 `dist/`를 Pages Direct Upload로 배포합니다. `_headers`가 정적 파일 캐시와 기본 응답 헤더를 설정합니다. 무료 플랜의 현행 빌드·파일 제한을 확인하고 사용합니다. 이 저장소는 Cloudflare Pages 구성까지 준비했으며 계정 배포/DNS 변경은 수행하지 않았습니다.

공식 문서: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/ 및 https://developers.cloudflare.com/pages/platform/limits/.

## 3D 동작

- 짧은 3D 장면 바로 아래에 전체 HTML 서비스 목록을 기본 표시합니다. 긴 스크롤 고정 구간은 없습니다.
- 3D 영역 위의 휠 또는 가로 드래그/스와이프로 진입 → 반시계방향 한 바퀴 → 퇴장을 계속 반복합니다. 입력을 멈추면 모델도 정지하고 반대로 조작하면 경로를 되짚습니다. 모바일 세로 스크롤과 UI 위 스크롤은 일반 페이지 이동입니다.
- 공전 반지름은 5.05이며 허브를 원판 중심 `(0,0)`에 맞췄습니다. 받침대 외곽 반지름을 포함한 6.42가 원판 반지름 6.53 안에 들어갑니다. 원판과 카메라는 조작 중 고정됩니다.
- 각 모델은 원호 간격 8을 진행률 지연으로 환산한 독립적인 시계를 사용합니다. 퇴장 후 숨김 구간에서 다음 진입으로 순환하며, 경계에서는 투명도를 조절합니다. 검색·필터는 진행률을 초기화하지 않습니다.
- `src/scripts/showcase-config.ts`에서 반경·간격·휠/드래그 감도·초기 위치·숨김 간격·진입/퇴장 제어점·카메라·품질을 조절합니다. `showcase-path.ts`가 경로와 반복 진행률을 계산합니다. 개발 서버의 `/?pathDebug=1`은 경로를 표시합니다.
- 모델은 `workbench.ts`의 막대 5개와 곡면 영수증 메시입니다. 모델 교체는 해당 sculpture 메시를 수정합니다. 모델 본체·받침대·이름표 클릭은 기존 실제 서비스 URL로 이동합니다. 드래그와 스크롤은 클릭에서 제외합니다.
- 중앙 발광의 선택적 Bloom, OutputPass, FXAA를 적용합니다. 모바일 DPR 최대 1·1/4 해상도 Bloom, 데스크톱 DPR 최대 1.5·1/2 해상도 Bloom입니다. 정지 상태에서는 반복 렌더링하지 않습니다.
- `3D 끄기`는 자원을 해제하고 정적 포스터를 표시합니다. 다시 켜면 진행률을 복원합니다. 모션 감소·데이터 절약·WebGL 미지원도 검색과 HTML 링크를 유지합니다.
- `서비스 목록 ↓`은 기본 `#services` 앵커로 브라우저 해시와 이력을 유지합니다.

구조와 검증 범위는 [반복 경로 쇼케이스 기록](docs/loop-showcase.md)에 있습니다.

## 이미지와 브랜드

사용자가 제공한 브랜드 심볼을 최적화한 `public/assets/brand/ravirgo-symbol.webp`를 사용합니다.

`orbital-poster.webp`는 3D 대체 화면용 생성 이미지이며, `sky.webp`는 소개 페이지 배경입니다. `orbital-dusk.webp`는 실시간 3D 공간의 먼 산·호수·황혼 배경입니다. 석재와 황동의 표면 질감은 런타임에서 생성합니다. 이미지 생성 프롬프트, 개인 파일 경로가 포함된 작업 기록과 사용하지 않는 원본 참조 이미지는 저장소에 포함하지 않습니다.

## 검증

`npm run dev`로 포트 4321 서버를 실행한 뒤 별도 터미널에서 `npm test`를 실행합니다. `qa-loop-showcase.mjs`가 설치된 macOS Google Chrome으로 데스크톱과 모바일 에뮬레이션을 검사합니다. `qa-home.mjs`와 `qa-open-showcase.mjs`는 현재 검사로 연결되는 호환 진입점입니다.

공전 반지름과 원판 지지 범위, 여러 차례 정·역방향 반복, 각 모델의 진입/공전/퇴장/숨김, 정지, 고정 장면, 목록 기본 노출, 필터, 두 모델 본체 클릭, 모바일 모델 탭·가로 스와이프·세로 스크롤, 3D 토글/복원, 기본 앵커, 모션 감소와 WebGL 대체 화면을 확인합니다. 결과와 캡처는 `.impeccable/review/loop/`에 저장합니다.

실제 스마트폰, Safari, GPU/발열 및 컨텍스트 복구는 이번 자동 검사에 포함되지 않습니다.
