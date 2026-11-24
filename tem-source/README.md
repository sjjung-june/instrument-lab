# TEM Lab

일반화된 투과전자현미경 교육 모델입니다. 10개 구성 요소의 3D 탐색·분해 보기, BF·DF·STEM ADF·EELS·회절 모드, 시료 두께 조절 및 증상별 점검 가이드를 제공합니다.

- BF: 투과파를 이용한 합성 밝은 바탕 영상.
- DF: 대물 조리개의 g₁/g₂ 선택에 따라 다른 합성 영역이 밝아집니다. 조성 분석이나 단순 BF 반전이 아닙니다.
- STEM: 집속 프로브를 64×64 래스터로 주사하고 ADF 개념 영상 픽셀을 순차적으로 채웁니다. 원자번호·수집각을 정량적으로 계산하지 않습니다.
- EELS: 제로로스, 저손실, 코어 에지 A/B(임의의 200/520 eV)를 갖는 합성 스펙트럼과 CSV를 제공합니다. 에지는 실제 원소를 지정하지 않습니다. 분광 경로는 개념도입니다.
- 시료 두께는 다음 취득 시작 시 적용됩니다. 일시정지 후 같은 모드 버튼으로 재개할 수 있습니다.

DF·STEM·EELS에서도 렌즈 수차, 다중 산란, 실제 결정구조·교정·화학 상태를 재현하지 않습니다.

시료의 합성 영상과 회절 점은 개념 시각화이며, 실제 결정구조나 물리적 전자 산란을 계산하지 않습니다. 장비 연결·제어, 진공 제어, 수차 및 실제 선량은 구현하지 않았습니다. 실제 장비의 운전과 정비는 제조사 매뉴얼을 따르세요.

참고: [JEOL TEM 원리](https://www.jeol.com/products/science/em.php), [Thermo Fisher Scientific TEM 영상·회절·STEM 경로](https://documents.thermofisher.com/TFS-Assets/MSD/posters/tfs-talos%20stem-poster-en.pdf).

확장 원리: [JEOL DF](https://www.jeol.com/words/emterms/20121023.001400.php), [JEOL STEM](https://www.jeol.com/words/emterms/20121023.055058.php), [JEOL EELS](https://www.jeol.com/words/emterms/20121023.065858.php).
