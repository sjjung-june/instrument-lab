# SAM Lab — HBM example

공통 3D 제어: 시점 초기화·선택 강조·분해 보기. 선택은 녹색, 관련 부품은 황색, 나머지는 반투명입니다. 재생 속도는 장비별 0.1/0.25/0.5/1/2×, 기본 0.25×입니다. 문서의 취득 시간은 1× 기준 가상 시간이며 기본 재생에서는 실제 대기 시간이 약 4배입니다. 속도 변경은 데이터·측정 조건을 유지합니다. 공통 구현은 프로젝트 루트의 src/shared/에 있으므로 전체 소스를 함께 유지하세요.

제조사 비식별 8-Hi DRAM 적층/TSV·마이크로범프·베이스 다이·인터포저의 수침 음향 검사 교육 모델입니다. 특정 HBM 세대·제품의 규격이나 검사 레시피가 아닙니다. 주변 GPU·기판은 생략합니다.

## 모드와 사용

- C-Scan: 게이트 260 μm → 중간 접합부 박리 예시, 590 μm → 하부 보이드 예시. 520/690 μm에서는 상부 결함 아래의 합성 음향 그림자도 관찰합니다.
- A-Scan: 기준/박리/보이드 위치를 선택하고 2초 취득. RF 진폭과 시간, 게이트 위치를 비교합니다. C/B/Through 모드의 하단 파형은 현재 좌표의 합성 참고 파형이며 별도로 취득한 A 버퍼가 아닙니다.
- B-Scan: 선택 Y의 X–깊이 단면을 6초 동안 64열×128깊이로 취득합니다. 기본 Y=.45는 박리를, 보이드 위치 버튼의 Y=.66은 하부 보이드를 통과합니다.
- Through-Scan: 별도 하부 수신기로 8초 동안 투과 XY 영상을 만듭니다. 게이트를 적용하지 않으며 깊이를 특정할 수 없습니다. 실제 홀더/패키지에 하부 접근이 가능하다는 가정입니다.
- 시료·좌표·게이트·모드 변경은 새 취득으로 처리합니다. C/B의 부호/절댓값 표시 채널만 변경하면 원본 데이터를 보존합니다. 일시정지·재개, CSV 저장, 10개 파트 선택·강조·분해 보기와 4개 증상 점검 가이드를 제공합니다.
- 결함 위치 표시 버튼은 미리 설정한 정답 오버레이이며 실제 검출 결과가 아닙니다.

## 합성 모델의 정의와 한계

표면 깊이 0에서 DRAM+접합층 각 65 μm × 8, 베이스 70 μm, 인터포저 100 μm를 가정합니다. 계면은 65,130,195,260,325,390,455,520,590,690 μm입니다. 실제 두께/음속과 무관하며 전 구간 유효 음속을 5.5 μm/ns로 단순화합니다. 시간은 전면 반사 기준이고 `t=2d/c`입니다. 물 경로 시간은 제거한 것으로 가정하며 다층 음속 보정은 하지 않습니다.

RF는 100 MHz cosine × Gaussian 파형의 합입니다. 임의 크기의 두 결함(정규화 XY .36/.45의 260 μm 박리, .69/.66의 590 μm 보이드)은 공기층을 가정해 음의 강한 반사와 하부 감쇠를 갖게 했습니다. 정상 계면의 양의 반사계수도 설명을 위한 임의값입니다. C 픽셀은 게이트 내 최대 절댓값 RF 샘플의 부호 있는 진폭입니다. 투과는 같은 두 결함 영역에서 임의로 감쇠시킨 투영 모델입니다. 3D 결함·게이트·좌표는 같은 함수/설정과 연결됩니다.

실제 전파·회절·다중반사·빔 해상도·주파수별 감쇠·물 온도·렌즈 초점·실재 접합재 특성은 계산하지 않습니다. 실제 HBM에서 모든 층을 분해 관측할 수 있다는 뜻이 아니며 개별 범프/TSV 검출, 정량 두께·결함 크기·수율·품질 합격 판정에 사용할 수 없습니다. 모든 깊이/치수는 가상이며 XY는 0–1 정규화 좌표입니다. 시료의 수침 적합성과 안전한 제조사 절차를 우선합니다.

## 개발

루트에서 `npm test`, `npm run build:sam`, 또는 전체 `npm run build`를 실행합니다. 루트 서버의 SAM 탭에서 사용하며 소스 변경 후 SAM 재빌드 및 새로고침이 필요합니다. 숨겨진 문서에서는 취득을 일시정지합니다. 장비 탭을 바꿔도 iframe 상태는 유지됩니다.

## 원리 참고

- [KSI: A-Scan, TOF and time gating](https://www.ksisam.com/acousticmicroscopy-en/scanmodes-acoustic-microscopes.php?acoustic_scanmode=0)
- [PVA TePla: acoustic scan modes](https://www.pvatepla.live/products-technologies/advanced-packaging-inspection/)
- [SK hynix: HBM DRAM stack and base die](https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/)
- [Samsung: eight-layer DRAM stack example](https://semiconductor.samsung.com/news-events/news/samsung-to-advance-high-performance-computing-systems-with-launch-of-industrys-first-3rd-generation-16gb-hbm2e/)

XPS와 SIMS 표면 소재 쿠폰 예시는 통합 페이지의 별도 탭에서 제공합니다. SAM의 HBM 적층 내부를 해당 표면 분석 장비로 그대로 관측할 수 있다는 뜻은 아닙니다.
