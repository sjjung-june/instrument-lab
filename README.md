# Instrument Lab — 14 Instrument Workspaces

## 부품 상세 · 이상 데이터 실습 (2026-11-25)

GitHub 소스에는 생성된 `dist/`가 없습니다. 처음 실행할 때 `npm ci && npm run build && node serve.mjs`를 사용하세요. 의존성 설치 없이 실행하려면 `public/download/instrument-lab.zip`을 받아 압축을 풀고 `node serve.mjs`를 실행하면 됩니다.

- 14종 공통: 부품 선택에 따라 입력, 출력, 작동 원리, 기준 확인, 이상 단서, 점검 순서, 장비 신호 경로를 표시합니다. 주요 부품 62개는 장비별 상세 설명, 나머지는 기존 역할/점검 설명을 제공합니다. 관련 부품 버튼은 3D 선택과 연결됩니다.
- 뷰어의 **이상 데이터 실습**에서 현재 취득 범위 또는 명시적으로 생성한 **고정 합성 예시**를 비교합니다. 예시는 독립 엔진으로 만들며 현재 장비를 시작하거나 원본 데이터를 바꾸지 않습니다. 취득 전에는 임의의 완성 데이터를 표시하지 않습니다.
- 장비별 2개, 총 28개 시나리오: AFM 이중 팁/줄무늬, APT TOF 영점/히트 누락, FIB Curtaining/흐림, FTIR 배경 불일치/약한 응답, Nanoindenter 깊이 드리프트/하중 영점, Raman 형광/축 이동, SAM 결합/잡음, SEM 초점/대전, SIMS 질량축/수율, TEM 분해능/배경, XPS 대전/감도, XRD 각도 영점/배경, XRM 검출 열/회전 중심, AFM-IR 접촉/지형 교차 영향.
- 공통 축/색 범위로 비교하며 미취득 픽셀은 비웁니다. XRR/EELS는 세로 로그 축, XPS/FTIR은 감소 방향 축, 압입은 시간순 하중–깊이 곡선을 유지합니다. 모드가 맞지 않는 시나리오는 비활성화합니다.
- XRM은 복제한 투영에 열 편차/위치 이동을 적용하고 같은 FBP를 다시 계산합니다. APT는 복제한 이벤트의 TOF→질량 재계산/누락 후 히스토그램을 만듭니다. FTIR은 변환 완료된 흡광도에 배경 비 오차를, AFM-IR 맵은 같은 좌표의 지형 혼입을 적용합니다. TEM은 원래 화면과 같은 분석 함수/취득 진행률에서 합성 표시값을 계산합니다.
- **예시 강도**는 교육용 배율이지 실제 고장 크기/확률이나 교정값이 아닙니다. 각 상황에 외형 변화, 적용 가정, 점검 순서, 비슷한 다른 원인을 표시합니다. 원본 자체의 정상 여부도 보장하지 않으며 실제 고장을 판정하지 않습니다.
- 기존 취득 그래프·물성 결과·원본 CSV는 유지합니다. 별도 **비교 CSV · 학습용**에 출처, 장비/모드/조건/단위, 왜곡 ID/강도, 원본 보존 여부를 기록합니다. 현재 취득 범위의 유한값만 내보냅니다.
- 구현: `src/shared/part-knowledge.js`, `learning-data.js`, `fault-catalog.js`, `fault-models.js`, `learning-panel.js`. 순수 데이터 변환과 DOM을 분리하고 모든 장비에서 같은 공통 제어로 연결합니다.

제조사 비식별 장비 유지보수·원리 학습용 인터랙티브 3D 웹사이트입니다. 장비 메뉴는 알파벳순 **AFM / AFM-IR / APT / FIB / FTIR / Nanoindenter / Raman / SAM / SEM / SIMS / TEM / XPS / XRD / XRM**이며 한 페이지에서 14종을 전환합니다. AFM은 XY 스테이지·Z 피드백, APT는 펄스 전계 증발·TOF·검출 XY·3D 점군, FIB는 가공·SEM 영상, TEM은 BF·DF·STEM·EELS·회절, XRD는 In-plane·Out-of-plane·XRR, SEM은 SE·BSE, SAM은 HBM A/B/C/Through, XPS는 Survey·Narrow·Depth, SIMS는 M-SIMS/ToF-SIMS를 제공합니다. XRM은 투영/단면 CT, Nanoindenter는 하중–변위, Raman·AFM-IR은 스펙트럼/화학 맵, FTIR은 배경/투과/ATR와 간섭신호 변환을 제공합니다. 모든 데이터는 교육용 합성값입니다.

## 신규 5종 사용법과 입력–출력 연결

5종은 `multimodal-source/`의 별도 HTML 진입점과 공유 UI/엔진을 사용합니다. 기기별 3D 메쉬·측정식·상태·출력은 구분합니다. 공통 시점/메쉬 클릭/선택 강조/분해/0.1–2× 재생 속도/명시적 측정 시작·정지·재개/조건 변경 초기화/CSV/관련 파트 유지보수 가이드를 제공합니다. 문서가 숨겨질 때 일시정지하며 장비 탭 왕복은 상태를 유지합니다.

| 장비 | 동작 및 출력 | 범위와 주의 |
| --- | --- | --- |
| XRM | Radiography 한 각도 투과율 / CT 48각도 투영 → 로그 흡수 sinogram → 필터 역투영(FBP) 단면 | 각도 이동 중 X선 OFF, 정지 노출 후 기록. 투과율은 동일 팬텀 선적분에서 exp(−∫μdl)로 계산. 단순히 정답 이미지를 표시하지 않음. |
| Nanoindenter | 접근 → 하중 인가 → 유지 → 제하 → 후퇴, P–h/하중–시간 곡선·잔류 압흔 | 합성 벌크 Si/Cu/polymer 유사 재료, 200–2000 μN. 제하 종료 후 이상식 H/Eᵣ 표시. 초기화는 새 쿠폰. |
| Raman | 532/785 nm 연속 여기 → Rayleigh 차단 → 분광 CCD 전 채널 적분 / 32×32 선택 shift 맵 | 파장을 바꿔도 Raman shift는 유지되고 검출 Stokes 파장은 변함. 8회 동시 채널 누적. 화학 맵은 선택 shift의 산란 응답이며 농도가 아님. |
| FTIR | Background → Transmission 또는 ATR → OPD 간섭신호 256점 → 실제 DFT → 샘플/배경 비 → A/T | 광대역 동시 조사이며 파수를 한 개씩 스캔하지 않음. 액세서리별 배경 필수. ATR 선택 후 Background를 취득하면 빈 ATR 경로의 배경이 됨. |
| AFM-IR | 가변 IR 펄스 → 열팽창 → 접촉 캔틸레버 감쇠 진동 → 별도 가시광 레버 검출 → 국소 스펙트럼/32×32 맵 | IR 조사와 광학 읽기를 분리. 펄스 OFF 후 진동이 남고 응답 기록은 진동 이후. 지도는 대표 주기당 독립 위치 16개 묶음. 지형과 화학 응답은 다른 함수. |

### 계산·단위·한계

- **XRM:** 정규화 팬텀의 원형 영역 3개를 해석적으로 선적분합니다. 48채널, 각도 0–176.25°(3.75° 간격)의 평행빔 투영에 Ram–Lak 이산 필터와 선형 보간 역투영을 적용합니다. 미취득 투영은 비워두며 초기 제한 각도 단면에 줄무늬가 보일 수 있습니다. 3D 장비 메쉬의 검출판은 선택한 한 행을 대표합니다. **완전한 3D CT·cone-beam·위상 대비 XRM이 아닙니다.** 재구성 좌표/흡수계수는 무차원 합성값이며 실제 HBM 결함 판정이 아닙니다. CSV는 원시 투영의 각도·정규화 검출 위치·로그 흡수·투과율을 저장합니다.
- **Nanoindenter:** 이상적 Berkovich 면적 `A=24.5h_c²`, 제하 `P=Pmax[(h−hf)/(hmax−hf)]^1.5`, `hf=0.6hmax`, `S=1.5Pmax/(hmax−hf)`, `hc=hmax−0.75Pmax/S`, `H=Pmax/A`, `Er=√π S/(2β√A)`, `β=1.034`를 사용합니다. P는 μN, h는 nm로 생성하고 GPa 계산 시 단위를 변환합니다. 재료별 합성 경도 12/3/0.25 GPa로 곡선을 생성한 후 재계산하므로 **독립 검증이나 실측 물성값이 아닙니다.** Eᵣ는 reduced modulus이며 Young 탄성률과 구분합니다. 크리프·pile-up·기판·팁 교정·열 드리프트는 생략합니다.
- **Raman:** Si 유사 520 cm⁻¹ 및 가상 폴리머 1000/1600/2900 cm⁻¹ Gaussian 피크입니다. `1/λStokes=1/λlaser−shift`, 여기 파장에 따른 λ⁻⁴ 응답 스케일은 단순 근사입니다. 256채널을 8단계 동시 적분하며 순차 파수 스캔이 아닙니다. 실제 분광 분해능·공명·형광·손상·편광·계수 통계는 계산하지 않습니다. 맵은 독립 위치 적분의 시간 압축 표현입니다.
- **FTIR:** 동일 단일 빔 스펙트럼으로 cosine 합성한 256점 간섭신호를 실제 DFT로 복원합니다. Δ파수=32 cm⁻¹, OPD 간격 `1/(256×32) cm`, 최대 OPD 약 311.3 μm, 거울 이동 약 155.6 μm입니다. 600–3600 cm⁻¹ 범위의 격자점을 표시합니다. `T=Ssample/Sbackground`, `A=−log10(T)`이며 배경을 빼는 모델이 아닙니다. 미완료 간섭신호에서 흡광도를 만들지 않습니다. 배경은 Transmission/ATR별 별도 유지·삭제하며 동일 빈 광학 경로라는 가정에서만 재사용합니다. ATR은 파수·접촉 가중치 근사이고 Fresnel·굴절률·침투 깊이·실제 ATR 보정은 생략합니다. 잡음·위상 보정·apodization·실제 분해능 교정은 생략합니다.
- **AFM-IR:** 900–1900 cm⁻¹ 국소 스펙트럼 64점 또는 32×32 맵. 독립적인 두 폴리머 유사 IR 밴드 혼합에 기계응답 가중치를 적용합니다. 대표 감쇠 진동은 `a exp(−4t) sin(2π6t)`이며 t는 정규화된 교육 시간이지 실제 ms/공진 주파수가 아닙니다. 지도 주기는 16개 독립 위치의 여러 실제 펄스를 압축한 대표 장면입니다. 별도 가시광 레버는 정렬/읽기를 위해 대기에도 표시합니다. 이는 photothermal 접촉 AFM-IR 개념이며 특정 RE/PLL·tapping·s-SNOM 장비를 재현하지 않습니다. 열·기계·두께·출력 정규화 영향 때문에 응답을 곧바로 흡수 계수/농도로 해석할 수 없습니다.
- 모든 샘플은 독립 합성 예시입니다. XRM의 패키지 단면, 압입 쿠폰, Raman/IR 폴리머 도메인은 같은 실제 HBM을 모든 기법으로 그대로 관측한다는 뜻이 아닙니다. 모든 형상·광학 경로·변위는 확대된 개념 메쉬이고 정량 광선/열/접촉 역학 계산이 아닙니다.

원리 대조: [ZEISS XRM](https://www.zeiss.com/microscopy/en/products/software/advanced-reconstruction-toolbox.html), [Oliver–Pharr 원 논문](https://web.mit.edu/cortiz/www/3.052/3.052CourseReader/45_OliverPharr1992Nanoindentation.pdf), [HORIBA Raman](https://www.horiba.com/int/scientific/technologies/raman-imaging-and-spectroscopy/raman-spectrometer-presentation/), [Thermo Fisher FTIR](https://www.thermofisher.com/us/en/home/industrial/spectroscopy-elemental-isotope-analysis/molecular-spectroscopy/fourier-transform-infrared-spectroscopy/faqs.html), [Shimadzu FT/배경](https://www.ssi.shimadzu.com/service-support/technical-support/analysis-basics/tips-ftir/apodization.html), [Bruker AFM-IR](https://www.bruker.com/en/products-and-solutions/infrared-and-raman/nanoscale-infrared-spectrometers/re-afm-ir.html).

## 입력–출력 개연성 점검 · 2026-11-25

다음은 코드와 공개 원리 자료를 대조한 교육 모델 수준의 점검입니다. 실제 장비 검증·교정이나 완전한 입자/파동 시뮬레이션이 아닙니다.

| 장비 | 입력 → 상호작용 → 출력 | 점검 결과 및 반영 |
| --- | --- | --- |
| AFM | 연속 광학 읽기 + XY 이동 → 휨 검출/Z 추종 → Trace/Retrace 높이 | 같은 표면·좌표·오차를 사용. 정렬용 레이저는 대기 중 유지 가능. 실제 PID·힘 교정은 없음. |
| APT | DC 바이어스 + 레이저/전압 펄스 → 전계 증발 → 이온 비행 → TOF/XY 검출 → 점군 | 독립적으로 반복하던 입자 이동 제거. 펄스 OFF 후 비행하고 검출 게이트 이후에만 데이터를 기록. 팁 소모는 검출 수가 아니라 증발 단계에 연결. |
| FIB | 이온 조사 → 제거 / 전자빔 주사 → SE 영상 | 가공·관찰 경로 분리 유지. 이전 SEM 영상에 촬영 시 깊이를 표시해 현재 가공면의 실시간 영상으로 오해하지 않도록 함. |
| SAM | 송신 펄스 → 실제 가상 계면 반사 또는 투과 → RF → 게이트/XY 영상 | 수신 게이트를 반사면으로 쓰던 오류 수정. 같은 RF 계면 중 강한 반사 1개를 3D 대표 표시. Through는 XY 정렬된 아래 수신기로 편도 이동. 완료 위치 보존. |
| SEM | 연속 전자빔 래스터 → SE/BSE → 픽셀 | 검출 모드·좌표·합성 영상 연결 확인. 완료/대기/일시정지 시 활성 빔·신호 숨김. 실제 상호작용 부피 계산은 없음. |
| SIMS | M: 연속 스퍼터/분석 → ESA·자기 섹터 / ToF: 입사 펄스 → 이차이온 비행 → 질량 신호 | M 연속 입력과 ToF 펄스 OFF 후 비행을 분리. ToF 깊이 제거/분석 경로는 상호 배타적. 최초 0 nm 분석 후 제거. |
| TEM | 전자 조사 → BF/DF 선택·STEM 래스터·EELS 에너지 분리 → 해당 영상/스펙트럼 | 모드·취득 상태 연결 확인. 노출 중에만 광로 표시. 실제 산란·회절·다중산란 계산은 없음. |
| XPS | 연속 X선 → 광전자 → 에너지 분석 → 스펙트럼 / 제거 후 깊이 분석 | 최초 0 nm 표면을 제거 전에 분석. 다음 깊이의 제거가 분석/기록보다 먼저 진행되도록 표면 메쉬 연결. 제거 중 광전자 분석 경로 차단. |
| XRD | 연속 X선 + 각도 스윕 → 산란/반사 → 각도별 강도 | In/Out/XRR 기하와 곡선 조건 연결 확인. 측정 중에만 활성 입사/출사선 표시. q 화살표는 대기 시에도 정적 기하 안내로 유지. |

### 시간 및 데이터 해석

- APT는 **32개 대표 주기 × 독립 합성 이벤트 128개 = 4,096개**입니다. 실제 한 펄스에 128개 이온이 나온다는 뜻이 아닙니다. 한 주기에서 입자 1개를 대표 표시하고 도착 후 묶음을 기록합니다. 실제 펄스율, 무검출 펄스·다중 히트·지연 증발·비동기 배경은 계산하지 않습니다. 실제 APT에서는 펄스 사이의 배경 증발도 가능하므로 “펄스 ON인 순간에만 이온이 존재한다”는 뜻은 아닙니다.
- APT의 표시 시간은 확대·정규화된 교육 시간입니다. CSV TOF만 이상식의 ns이며 화면의 주기 길이는 물리적 TOF가 아닙니다. 같은 주기의 상대 비행 속도에 질량/전하 차이를 반영하지만 전압에 따른 실제 ns는 수치 읽기에서 비교합니다.
- SAM·ToF-SIMS의 3D 입자는 대표 신호입니다. 모든 RF 시간 빈·이미지 픽셀·스펙트럼 취득점과 1:1 동기화된 사건 기반 모델이 아닙니다. SAM RF에는 여러 계면을 합성하지만 3D는 강한 반사 1개만 표시합니다. ToF 스펙트럼의 순차 그리기는 실제 질량 스캔이 아니며 여러 펄스 누적 결과의 점진 표시입니다.
- 깊이 프로파일의 표면 소모와 최근 기록 깊이는 다를 수 있습니다. 제거가 먼저 진행되고 다음 분석이 끝난 후 기록되기 때문입니다. M-SIMS는 연속 제거/분석을 단순화했고 실제 peak-hopping 체류 시간은 계산하지 않습니다.
- 완료 후 저장된 그래프는 남지만 활성 신호는 멈춥니다. 일시정지는 학습용 시간 정지이며 실제 장비의 blanker·셔터·전원·진공 상태를 제어하지 않습니다. 조건 변경/초기화는 새 가상 시료입니다.

### 원리 대조 자료

- [CAMECA APT 트리거·TOF](https://www.cameca.com/Products/APT/Introduction-to-APT), [CAMECA 펄스 사이 배경 증발](https://www.cameca.com/Products/APT/LEAP-6000-XR)
- [NIST ToF-SIMS](https://www.nist.gov/programs-projects/time-flight-secondary-ion-mass-spectrometry), [NIST 자기 섹터 SIMS](https://www.nist.gov/programs-projects/magnetic-sector-secondary-ion-mass-spectrometry)
- [Thermo Fisher XPS 입력·분석·제거](https://www.thermofisher.com/us/en/home/electron-microscopy/products/xps-instruments/features.html), [PVA TePla SAM](https://www.pvatepla.com/products-technologies/faq-sam/)
- [JEOL DF](https://www.jeol.com/words/emterms/20121023.001400.php), [JEOL STEM](https://www.jeol.com/words/emterms/20121023.055058.php), [JEOL SE](https://www.jeol.com/words/semterms/20121024.070758.php)
- [Rigaku XRR](https://rigaku.com/resources/techniques/x-ray-reflectometry-xrr), [Bruker AFM 접촉 모드](https://www.bruker.com/en/products-and-solutions/microscopes/materials-afm/afm-modes/contact-mode.html)

## 가장 간단한 실행

Node.js 22 이상을 설치한 뒤 이 폴더에서 실행합니다. 배포용 `dist/`가 패키지에 포함되어 있어 별도 의존성 설치가 필요 없습니다. 배포 사이트의 상단 '전체 코드 다운로드' 버튼으로 이 패키지를 받을 수 있습니다. 다운로드한 패키지 내 로컬 실행에서는 재귀적인 압축을 피하기 위해 다운로드 버튼의 ZIP이 포함되지 않습니다.

```sh
node serve.mjs
```

브라우저에서 http://127.0.0.1:4173 을 엽니다. 종료는 터미널에서 Ctrl+C입니다. 포트가 사용 중이면 macOS/Linux에서는 `PORT=4174 node serve.mjs`로 다른 포트를 사용할 수 있습니다. HTML 파일을 직접 더블클릭하지 말고 HTTP 서버로 여세요.

## 코드 수정 및 재빌드

```sh
npm ci
npm run dev
```

화면에 출력된 로컬 주소를 엽니다. 수정사항은 자동 반영됩니다.

```sh
npm test
npm run build
node serve.mjs
```

`npm ci`에는 최초 네트워크 연결이 필요합니다. Three.js는 빌드에 포함됩니다. Google Fonts를 받을 수 없으면 시스템 글꼴로 자동 표시되며, 시뮬레이션은 네트워크 없이 동작합니다. WebGL 2를 지원하는 브라우저가 필요합니다. 실행 서버는 기본적으로 내 컴퓨터에서만 접근할 수 있습니다.

`npm run build`는 `apt-source/`, `fib-source/`, `tem-source/`, `xrd-source/`, `sem-source/`, `sam-source/`, `spectroscopy-source/`, `multimodal-source/`를 먼저 빌드하고 AFM 화면과 함께 `dist/`에 묶습니다. `npm run dev`도 하위 모델을 먼저 빌드합니다. 수정 후에는 각각 `npm run build:apt`, `npm run build:fib`, `npm run build:tem`, `npm run build:xrd`, `npm run build:sem`, `npm run build:sam`, `npm run build:spectroscopy`, `npm run build:multimodal`을 실행하고 해당 모델 화면을 새로고침해야 반영됩니다. XPS/SIMS는 마지막 공통 빌드를 사용합니다. 전환 시 각 세션은 페이지를 새로고침할 때까지 유지됩니다. 장비 탭만 전환하면 실행 중인 시뮬레이션은 자동으로 일시정지하지 않습니다. APT/SEM/SAM/XPS/SIMS와 신규 5종은 브라우저 문서가 숨겨질 때 일시정지합니다.

## 확장 모드 사용

- **모든 장비 공통**: 시점 초기화 / 선택 강조 / 분해 보기와 재생 속도 선택을 3D 뷰어에 제공합니다. 선택 파트는 녹색, 유지보수 관련 파트는 황색, 나머지는 16% 불투명도로 표시합니다. 선택 강조를 끄면 원래 색상·불투명도로 복원합니다(유리·별도 투명 보기·관련 파트 표시는 보존).
- **학습 재생 속도**: 장비별 독립 선택 `0.1× / 0.25× / 0.5× / 1× / 2×`, 기본 `0.25×`. 가상 취득·스캔·신호 애니메이션을 함께 늦춥니다. 속도를 변경해도 데이터·모드·측정 조건을 초기화하지 않습니다. 장비를 왕복해도 각 속도가 유지되며 새로고침하면 기본값으로 돌아갑니다. 아래 모듈의 취득 시간은 1× 기준 가상 시간이고 기본 재생의 실제 대기 시간은 약 4배입니다. 실제 하드웨어의 속도 설정이 아닙니다.
- **TEM 측정 제어**: BF·DF·STEM·EELS·Diffraction 선택 후 별도 **측정 시작**을 누르세요. 일시정지 후 **측정 재개**로 이어갑니다. 모드·두께·회절파 변경은 초기화하고 대기하며 자동 측정하지 않습니다.
- APT → Laser-pulsed / Voltage-pulsed: 니들형 합성 시료에서 4,096개 이온 이벤트를 취득합니다. TOF·질량 스펙트럼·XY 히트맵·회전 가능한 3D 점군을 함께 누적합니다. 전하 상태 1+/2+와 유효 가속전압 가정에 따른 m/z·비행시간 변화를 비교하고 Si/Cu/B 표시 필터로 층을 확인하세요. 실제 물리 재구성·정량이 아닌 개념 모델입니다. `apt-source/README.md`에 가정·CSV 단위·한계를 설명했습니다.
- XPS → Survey / Narrow / Depth Profiling: Survey에서 넓은 에너지 범위를 보고, Narrow에서 Si 2p·C 1s·O 1s를 선택합니다. 산화막·대전·중화·패스 에너지를 바꾸고 재취득하세요. Depth Profiling은 가상 0–30 nm 제거/분석 교대입니다.
- SIMS → 분석기 방식: M-SIMS는 연속 빔·정전 에너지 필터·자기 섹터 및 선택 질량 수집, ToF-SIMS는 펄스 빔·비행시간 분석을 표시합니다. 방식 전환 시 3D 분석기·신호 경로·부품 설명·가이드·CSV 메타데이터도 바뀝니다.
- 두 SIMS 방식 모두 스펙트럼·64×64 이미지·0–80 nm 명목 깊이 모드를 제공합니다. M-SIMS는 연속 제거/분석과 단일 수집기의 질량 순차 전환을, ToF-SIMS 깊이는 별도 제거 빔과 분석 펄스 교대를 모사합니다. Cu/SiO₂/Si·B 합성 쿠폰이며 HBM 내부 검사나 장비 간 성능 비교가 아닙니다.
- XPS/SIMS의 초기화·조건 변경·재취득은 새 가상 시료로 교체하는 동작입니다. 실제 스퍼터는 파괴적이며 되돌릴 수 없습니다. 깊이·수율·피크 강도는 정량 농도나 실제 제거율이 아닙니다. 상세 가정과 CSV 축 단위는 `spectroscopy-source/README.md`를 참조하세요.

- SAM → HBM 예시: 기본 샘플은 8단 DRAM/접합층·베이스 다이·인터포저와 가상 박리/보이드입니다. 정상 샘플이나 한 종류 결함만 있는 샘플과 비교할 수 있습니다.
- SAM → C-Scan: 260 μm 게이트로 중간 박리를, 590 μm 게이트로 하부 보이드를 취득합니다. A-Scan의 반사 시간, B-Scan의 단면, Through-Scan의 깊이 투영과 연결해 관찰합니다.
- SAM의 깊이·음속·치수·RF 파형은 임의 합성입니다. 특정 HBM 세대나 제품의 구조·검사 성능을 재현하지 않으며 개별 TSV/범프 검출 및 합격 판정에 사용할 수 없습니다. 자세한 가정은 `sam-source/README.md`를 참조하세요.

- SEM → SE/BSE: 같은 시료를 표면 형상/상대 조성 신호로 취득합니다. 3D 입사빔·검출·취득 경로와 마지막 취득 좌표가 연동됩니다. 시료 스테이지는 고정입니다.
- SEM → 초점 흐림: 0–100%를 조절하고 재취득하면 합성 공간 평균 효과가 반영됩니다. 모드나 흐림 변경은 취득을 초기화합니다. CSV에는 취득한 픽셀만 저장합니다.
- SEM → 증상 선택: 흐림·약한 신호·대전·드리프트별 점검 순서와 관련 파트를 확인합니다. 고전압·진공 부품은 직접 분해하지 마세요.

- XRD → Out-of-plane: 면외 격자 간격을 조절하고 측정을 시작하면 Bragg 피크가 생성됩니다.
- XRD → In-plane: 면내 격자 간격과 표면에 평행한 산란벡터를 확인합니다. 입출사각은 0.6°로 고정합니다.
- XRD → XRR: 박막 두께·거칠기를 조절해 정반사 곡선을 log₁₀ 축으로 관찰합니다. 모드·파라미터 변경은 이전 데이터를 초기화합니다.
- TEM → DF: g₁/g₂ 회절파 선택에 따라 밝아지는 합성 영역이 바뀝니다.
- TEM → STEM: 집속 프로브가 이동하며 64×64 ADF 개념 영상을 채웁니다.
- TEM → EELS: 제로로스·저손실·합성 에지 A/B의 스펙트럼을 관찰하고 CSV로 저장합니다.
- TEM의 두께·모드·DF 회절파 변경은 초기화 후 대기합니다. 별도 측정 시작/측정 재개 버튼으로 취득을 제어합니다.

XRD의 피크 위치만 Bragg 식을 사용하고 상대 세기·폭은 합성값입니다. XRR은 임계각이 고정된 개념식으로 실제 박막 피팅을 수행하지 않습니다. TEM의 DF/STEM/EELS도 실제 결정구조·원소·화학 상태를 정량 해석하지 않습니다. 자세한 모델 범위는 `xrd-source/README.md`와 `tem-source/README.md`를 확인하세요.

## 사용 흐름

1. 3D 모델을 드래그해 회전하고 스크롤로 확대합니다. 오른쪽 버튼 드래그는 이동입니다.
2. 메쉬 또는 왼쪽 목록을 클릭해 역할과 점검 포인트를 확인합니다.
3. 분해 보기, 투명 보기, 파트 숨기기/모두 표시로 내부 구조를 탐색합니다.
4. 시료를 선택하고 스캔 시작을 누릅니다. 약 1.2초의 접근 후 스캔합니다.
5. Trace는 X 증가 방향, Retrace는 같은 Y에서 X 감소 방향으로 이동합니다. 왕복 후 다음 Y 라인으로 진행합니다.
6. 높이맵의 Trace/Retrace 버튼으로 채널을 전환합니다. 라인 프로파일은 현재 Y 라인의 두 채널을 비교합니다.
7. 속도를 높이거나 Z 추종 이득을 낮추면 모델의 추종 오차가 커집니다. 일시정지·재개·후퇴를 사용할 수 있습니다.
8. 유지보수 가이드에서 6가지 증상을 선택합니다. 관련 파트 버튼을 누르면 가이드가 닫히고 강조된 모델을 확인할 수 있습니다.
9. CSV 내보내기는 `x_um,y_um,trace_nm,retrace_nm`를 저장합니다. 취득하지 않은 데이터는 빈칸이며, 측정값 0과 구별됩니다.

## 구현 범위

| 영역 | 구현 |
| --- | --- |
| 3D | 9개 파트 그룹, 개별 메쉬 raycast, 자유 회전·확대·이동, 선택 파트 강조 |
| 표시 | 부드러운 분해/조립 전환, 투명화, 숨김/복원, 시점 초기화 |
| 시료 | Nano islands, Calibration steps, Periodic waves, 10 nm 간격 높이 등고선 |
| 스캔 | 64 × 64, 5 × 5 μm, Trace/Retrace 독립 버퍼, 일시정지·재개·후퇴 |
| 계측 | 취득 순서에 따른 높이맵 생성, 현재 라인 왕복 프로파일, CSV |
| 신호 | 레이저 → 캔틸레버 → 광검출기 광로, 제어기 → Z 신호 애니메이션 |
| 유지보수 | 노이즈, 줄무늬, 피드백 불안정, 접근 실패, 정렬 불량, Z 범위 이상 |
| 화면 | 데스크톱과 모바일 반응형, 키보드 선택, 안내 대화상자 |

## 모델과 데이터 해석

실제 장비와 연결하지 않는 교육용 시뮬레이터입니다. 실제 AFM 장비의 정밀 CAD, 교정된 측정, 진단 판정 또는 안전 제어를 제공하지 않습니다.

- XY 스테이지는 시료 좌표의 반대 방향으로 이동하고 광학 헤드의 XY 위치는 고정됩니다. Z 스캐너와 프로브는 피드백에 따라 움직입니다. 실제 AFM의 구조는 기종에 따라 다릅니다.
- 시료의 10 nm 간격 등고선은 합성 표면의 동일 높이 지점을 연결합니다. 돌출 형상과 이동량은 관찰을 위해 확대했습니다.
- 3D 표면과 스캔 엔진은 같은 `surfaceHeight()` 함수를 사용합니다. 3D에서 보이는 표면은 합성 기준 표면이고, Height Map은 Z 추종 결과입니다.
- 각 픽셀에서 `response = 1 - exp(-8 × gain / rate)`, `z ← z + response × (height - z)`를 적용합니다. 오차는 `height - z`입니다.
- 정규화된 휨/검출 신호는 `error / 100`으로 표현합니다. 실제 전압, 힘, 레이저 출력, 검출기 교정값을 의미하지 않습니다. 광점 이동은 오차와 연동합니다.
- 실제 PID 제어기, 압전 히스테리시스, 공진, 접촉역학, 팁 형상에 따른 영상 왜곡은 구현 범위 밖입니다. 이득이 높아도 실제 장비처럼 발진하는 모델은 아닙니다.
- 3D 형상, 팁 크기와 Z 이동량은 설명을 위해 확대·축소했습니다. `nm`/`μm` 단위는 합성 데이터 좌표에만 해당합니다.
- 스캔 속도 `line/s`는 한 Y 라인의 Trace와 Retrace를 모두 취득하는 속도입니다. 1 line/s에서 64라인은 스캔 시간 기준 약 64초입니다. 백그라운드·저성능 환경에서는 시뮬레이션 시간이 천천히 진행될 수 있습니다.
- 브라우저를 새로고침하면 세션과 측정 데이터가 초기화됩니다. 시료 변경·초기화·후퇴 후 새 스캔도 이전 데이터를 지웁니다. 후퇴 자체는 현재 데이터를 보존합니다.
- 점검 가이드는 일반적인 확인 순서이며 제조사 정비 절차를 대체하지 않습니다.

## 코드 구성

- `src/scene.js`: 3D 파트 생성, 광로·신호 경로, 카메라 및 선택
- `src/simulation.js`: 스캔 상태, 합성 표면, 피드백 모델, 파트와 유지보수 데이터
- `src/main.js`: 조작 이벤트, 캔버스 차트, 실시간 UI, CSV
- `src/style.css`: 반응형 화면 스타일
- `tests/simulation.test.js`: 스캔 및 데이터 정합성 검증
- `serve.mjs`: 의존성 없는 로컬 정적 서버
- `dist/`: 재빌드한 브라우저 실행 파일
- `VALIDATION.md`: 실행한 검증과 한계

별도 장비로 확장할 때는 `PARTS`/`GUIDES` 데이터와 `scene.js`의 메쉬 구성을 수정하면 됩니다. 서버 API, 사용자 계정, 장비 드라이버는 필요하지 않습니다.

## 참조 및 이전 자료

이전 「AFM 모델링 시작」 대화의 요구사항을 조회했지만 구현 표준서 및 압축 패키지의 실파일은 제공되지 않아 재사용하지 않았습니다. 이 코드와 문서는 조회 가능한 요구사항을 바탕으로 새로 작성했습니다.

- [Universität Mainz AFM 실험 안내](https://interaktiv.chemie.uni-mainz.de/vpcf1/afm-man.en.html): 광학 검출·접촉 모드 피드백의 개념
- [Park Systems 접촉 모드 설명](https://www.youtube.com/watch?v=tAeCUDnpcOU): 휨 검출과 Z 보정 흐름
- [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls): 3D 탐색 API

위 자료는 원리를 확인하는 용도로 참조했습니다. 본 구현의 치수·수식·유지보수 가이드는 특정 제조사의 공식 모델 또는 서비스 매뉴얼이 아닙니다.
