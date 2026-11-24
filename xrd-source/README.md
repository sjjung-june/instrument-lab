# XRD Lab

In-plane(면내), Out-of-plane(면외), XRR의 일반화 교육 모델입니다. 3D 광원·광학계·시료·검출기, 산란벡터, 순차 곡선 취득, CSV와 점검 가이드를 제공합니다.

입출사 방향은 `geometry()`로 계산합니다. 면외는 대칭 θ–2θ, 면내는 입출사각 0.6°의 면내 방위각 회전, XRR은 정반사 기하입니다. λ=0.15406 nm이며 회절 피크 위치는 Bragg 식을 사용합니다. 상대 세기, 폭과 XRR 반사율은 교육용 합성 모델입니다. XRR은 임계각 0.22°를 고정하고 qz=4πsinθ/λ, 박막 두께 간섭과 거칠기 감쇠를 결합합니다. 다층 Parratt 피팅·밀도 추정·재료 동정·실제 장비 제어를 제공하지 않습니다.

참고: [Rigaku XRR](https://rigaku.com/resources/techniques/x-ray-reflectometry-xrr), [Rigaku 박막 측정 기하](https://resources.rigaku.com/hubfs/2024%20Rigaku%20Global%20Site/Resource%20Hub/Knowledge%20Library/Rigaku%20Journals/Volume%2026%281%29%20-%20Winter%202010/RJ26-1_3-11.pdf?hsLang=en).
