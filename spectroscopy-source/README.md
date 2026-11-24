# XPS / SIMS educational modules

통합 페이지의 XPS와 SIMS 탭으로 사용합니다. 두 장비는 UI·3D 프레임·취득/차트를 공유하되 별도 엔진·물리 가정·부품 설명을 사용합니다. `npm run build:spectroscopy`가 두 HTML과 공유 번들을 `public/spectroscopy/`로 생성합니다. 전체 빌드는 `npm run build`, 검증은 `npm test`입니다.

## XPS

- Survey: 600→0 eV, Si/O/C 합성 피크. Si 2p: 110→94 eV, 기판/산화물 응답.
- Si⁰ 99.4 eV, Si⁴⁺ 103.5 eV 부근을 사용하고 0.6 eV 이중선·2:1 상대 면적을 근사합니다. O 532.8 eV, C 284.8 eV도 교육용 위치이며 에너지 기준으로 자동 사용하지 않습니다. 선폭·배경·세기는 임의값입니다.
- Al Kα 1486.6 eV와 분석기 일함수 4.5 eV(가정)에 대해 EB=hν−EK−φ를 표시합니다. 중화 전 대전 0–4 eV를 이동량으로 사용하고 중화 ON에서는 10% 잔류 이동을 가정합니다. 실제 중화 성능·차등 대전·교정이 아닙니다.
- 가상 SiO₂ 2–12 nm에 대해 기판 응답 exp(−잔여막/3 nm), 산화막 응답 1−기판, 탄소 응답 .22exp(−제거깊이/1.5 nm). 이는 원자%·실측 막두께가 아닙니다.
- 패스 에너지 20/80 eV는 고분해능 모드의 Gaussian σ .35/.8 eV를 바꿉니다. 실제 장비의 전송함수나 계수율을 계산하지 않습니다.
- 깊이는 0–30 nm의 81개 명목 제거/분석 단계입니다. 스퍼터 손상·환원·혼합·거칠기·제거율은 물리적으로 계산하지 않습니다.

## SIMS

- 일반화 ToF-SIMS입니다. Static 질량 스펙트럼(1–70 nominal m/z), 64×64 이온 이미지, 이중 빔 깊이 프로파일(0–80 nominal nm)을 제공합니다. 실제 Static 선량 한계를 계산하지 않으며 무손상을 뜻하지 않습니다.
- 같은 `copperPattern(x,y)`를 Cu 메쉬와 이미지 신호에 사용합니다. Cu는 표면 8 nm까지의 가상 패턴, 그 아래 산화막 2–20 nm, B는 명목 35 nm 중심의 합성 분포입니다. Cu가 덮인 위치의 산화막/Si 계면은 노출 위치보다 8 nm 깊게 설정합니다. 스펙트럼과 프로파일의 관찰 위치는 정규화 X=.32/Y=.5이며 3D 입사 위치도 동일합니다. 특정 HBM 제품·배선·공정·농도 데이터가 아닙니다.
- 양이온 예시 ¹¹B⁺/²⁸Si⁺/⁶³Cu⁺ 및 ⁶⁵Cu⁺, 음이온 예시 ¹²C⁻/¹⁶O⁻/²⁸Si⁻/명목44(SiO⁻)를 사용합니다. 동위원소 상대값·선폭·양/음 이온 수율은 임의 설정이며 실제 식별·자연 존재비 정량이 아닙니다. 명목 m/z는 분자 간섭을 구분하지 못합니다.
- 극성에 따라 스펙트럼·선택 가능한 이미지 이온과 프로파일 채널이 실제로 바뀝니다. 깊이 CSV에서 선택 극성에 없는 채널은 빈칸이며 선택 이온은 signal_au 열 및 굵은 프로파일 선에 대응합니다. 깊이 분석에서는 양이온 O₂⁺/음이온 Cs⁺ 제거 빔을 개념 표시합니다.
- 단일 전하·L=1 m·|V|=2 kV의 이상적 t=L√(m/2qV)를 표시합니다. 실제 비행 경로·에너지 분산·질량 교정·검출기 응답을 계산하지 않습니다. 질량 스펙트럼의 순차 그리기는 교육용이며 실제 TOF가 각 질량을 순차 선택하는 방식이라는 뜻이 아닙니다.
- 매트릭스 효과 토글은 O/Cu 신호의 임의 배율 변화이며 농도 변경이 아닙니다. 표준 시료·RSF·깊이 교정 없이 정량할 수 없습니다.

## 공통 동작 / 한계

8개 메쉬 파트 선택·감광·분해 보기, 회전/확대, 3개 증상별 가이드, 일시정지/재개·CSV 저장을 제공합니다. 스펙트럼 801점/6초, 이미지 4096점/8초, 깊이 81점/12초이며 취득한 점만 저장합니다. 프로파일은 각 가상 제거/분석 주기가 끝날 때 점을 추가합니다. 이미지 CSV의 axis는 래스터 인덱스로 X=(axis%64)/63, Y=floor(axis/64)/63입니다. XPS axis는 결합에너지, SIMS spectrum axis는 m/z, depth axis는 명목 nm입니다. metadata 열은 CSV 규칙에 따라 인용한 JSON입니다. 깊이와 강도는 농도나 실측 제거율이 아닙니다.

조건 변경·새 시료/초기화·완료 후 재취득은 새 가상 시료로 교체합니다. 실제 파괴 분석을 되돌리는 동작이 아닙니다. 브라우저 문서가 숨겨지면 일시정지하며, 통합 장비 탭만 전환할 때는 iframe 상태를 유지합니다. HBM의 깊은 내부를 XPS/Static SIMS로 그대로 관측할 수 있다는 의미가 아니며 SAM 모델과 다른 표면 소재 쿠폰 예시입니다. 실장비 연결·물질 동정·피크 피팅·정량 농도·합격 판정은 지원하지 않습니다.

## 원리 참고

- [Thermo Fisher: silicon XPS reference](https://www.thermofisher.com/us/en/home/materials-science/learning-center/periodic-table/metalloid/silicon.html)
- [Thermo Fisher: X-ray generation](https://www.thermofisher.com/us/en/home/materials-science/learning-center/surface-analysis/x-ray-generation.html)
- [Thermo Fisher: XPS depth profiling](https://www.thermofisher.com/us/en/home/materials-science/learning-center/surface-analysis/monatomic-depth-profiling.html)
- [NIST: ToF-SIMS](https://www.nist.gov/programs-projects/time-flight-secondary-ion-mass-spectrometry)
- [CAMECA: SIMS technique and modes](https://www.cameca.com/products/sims/technique)
