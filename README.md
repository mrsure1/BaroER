# 바로응급실 (BaroER) 🏥

> 긴급할 때, 바로 찾는 가장 가까운 응급실

## 프로젝트 개요
응급 환자의 상태를 입력하면 인근 수용 가능한 응급실을 실시간으로 검색하여 지도/리스트로 안내하는 모바일 앱입니다.

## 핵심 기능
1. **사용자 인증** — 자동 로그인 및 일반/구급대원 프로필 관리 (완료)
2. **환자 상태 입력** — 증상 체크리스트 + 음성 입력(STT) 보강 (완료)
3. **KTAS 중증도 판정** — 한국 응급환자 중증도 분류 기준 자동 계산 엔진 탑재 (신규)
4. **응급실 검색 (지도/리스트)** — 실시간 병상 정보 API 연동 및 시각화 (신규)
5. **다이나믹 UI** — 시안 1번(Radial) 기반 가용률 그래프 및 Glassmorphism 디자인 적용
6. **상세 컬러 카드** — 병상 상태(가용/혼잡/불가)에 따른 배경색 차별화로 시인성 극대화 (신규)
7. **내비게이션 연동** — 카카오내비 등 주요 맵 연동 지원 (완료)

## 기술 스택
| 영역 | 기술 |
|------|------|
| 모바일 | React Native + Expo (TypeScript) |
| 상태관리 | Zustand + TanStack Query |
| 백엔드 | Firebase (Auth + Firestore + Functions) |
| 지도 | 카카오맵 SDK |
| 로컬저장소 | MMKV |

## 실행 방법
```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 실제 API 키 입력

# 개발 서버 실행
npx expo start

# Android
npm run android

# iOS (macOS 필요)
npm run ios
```

## 프로젝트 구조
```
app/              # Expo Router 페이지
├── (auth)/       # 로그인, 회원가입
└── (main)/       # 대시보드, 검색, 기록, 설정
src/
├── types/        # TypeScript 타입 정의
├── stores/       # Zustand 상태 관리
├── constants/    # 증상, 설정 상수
└── services/     # API 서비스 레이어
constants/        # 디자인 토큰 (Colors)
docs/             # 설계 문서 (PRD, 기능명세, 화면설계, DB/API)
```

## 설계 문서
- [제품 요구사항 정의서 (PRD)](docs/PRD.md)
- [기능 명세서](docs/Feature_Specification.md)
- [화면 설계서](docs/Screen_Design.md)
- [DB 설계서](docs/DB_Design.md)
- [API 설계서](docs/API_Design.md)
- [화면 목업 (HTML)](docs/screen_mockup.html)
