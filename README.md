# RAVIRGO

**LIGHT BEGINS FROM VIRGO**

처녀자리에서 시작된 빛, 일상을 밝히는 기술.

RAVIRGO는 광선을 뜻하는 **Radius**와 처녀자리 **Virgo**에서 이름을 가져왔습니다. 작은 빛에서 새로운 가능성을 발견한다는 생각으로 일상에 유용한 서비스를 만듭니다.

[RAVIRGO](https://ravirgo.com)에서는 각 서비스를 살펴보고 바로 이용할 수 있습니다. 빛과 별자리에서 출발한 브랜드 이야기는 [RAVIRGO 소개](https://ravirgo.com/about)에서 만나볼 수 있습니다.

## 서비스

- [PricePulse](https://price-pulse.ravirgo.com) — GPU·CPU·노트북의 가격 흐름을 살펴보는 서비스
- [영수증 OCR](https://receipt-to-excel.ravirgo.com/) — 영수증 정보를 엑셀로 정리하는 도구

## Spatial showcase / archive (2026-10-16)

새 구조와 서비스 등록 방법은 [docs/spatial-archive.md](docs/spatial-archive.md),
검증 결과는 [docs/qa-results.md](docs/qa-results.md)를 참고하세요.
`src/data/services.ts`의 `featured` 개수와 GPU 활성 모델 수는 분리되어 있으며
`/archive/`는 WebGL을 사용하지 않습니다. 기존 `/#services`와 상세 URL을 유지합니다.

```sh
npm ci
npm run build
npm run typecheck
npm run test:unit
npm run dev -- --port 4322
# 별도 터미널, 설치된 Chrome/Chromium 사용 (CHROME_PATH로 지정 가능)
npm test
node qa-model-quality.mjs
node qa-catalogue.mjs
node qa-navigation.mjs
node qa-registration.mjs
node qa-capture.mjs
node qa-performance.mjs
```

QA_URL로 실행 중인 dev/정적 서버 주소를 지정할 수 있습니다. 모델 topology/registry 검사는
소스 모듈을 읽으므로 dev 서버가 필요합니다. 결과 JSON과 비교 화면은 `docs/qa/`에 기록합니다.
기존 main 비교 촬영은 변경 전 서버를 4323 포트에 띄운 뒤 `node qa-baseline.mjs`로 수행합니다.
이 작업은 별도 브랜치에서 검토하며, main 병합/운영 배포는 사용자 승인 후 진행합니다.
