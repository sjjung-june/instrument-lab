# FIB Lab

일반화된 FIB–SEM 교육용 3D 모델입니다. 이온 컬럼, 전자 컬럼, 스테이지, 진공 챔버, 검출기, 가스 주입계, 펌프와 제어부를 클릭해 탐색할 수 있습니다. 드래그 회전·확대·분해 보기, 이온빔 가공 및 SEM 라인 취득, 증상별 점검 가이드를 제공합니다.

실제 장비와 연결하지 않으며, 가공 깊이와 영상은 합성입니다. 물리적인 스퍼터링 수율, 빔 전류·전압, 시료 충전, 가스 반응 및 진공 제어는 구현하지 않습니다. GIS는 구조 탐색만 가능합니다. 기종별 세부 구조와 정비 절차는 실제 제조사 문서를 우선합니다.

## 실행

Node.js 22 이상에서:

```sh
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. 배포용 파일은 `npm run build`, 자동 검증은 `npm test`로 만듭니다. 종료는 Ctrl+C입니다.

## 시뮬레이션

- 이온빔 가공: 18초 × 속도 배율 기준으로 합성 트렌치를 최대 180 nm까지 생성합니다. 가공 진행 중 일시정지와 재개가 가능합니다.
- SEM 취득: 취득 시작 시점의 합성 가공 형상을 64×64 픽셀로 6초 동안 순차적으로 표시합니다. 새 취득은 기존 이미지를 초기화합니다.
- 파트는 왼쪽 목록이나 3D 메쉬를 눌러 선택하며, 유지보수 증상 관련 파트는 금색으로 강조됩니다.

참고: [Thermo Fisher Scientific FIB–SEM 원리](https://www.thermofisher.com/in/en/home/materials-science/learning-center/fib-sem-industrial-scientific-applications/articles/principles-capabilities-applications.html), [ZEISS FIB–SEM 단면 가공 및 영상](https://www.zeiss.com/microscopy/en/applications/life-sciences/volume-em/fib-sem.html).
