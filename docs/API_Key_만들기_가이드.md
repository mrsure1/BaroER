# 🔑 API Key 만들기 가이드 (BaroER)

이 문서는 **바로응급실(BaroER)** 프로젝트 개발을 위해 필요한 주요 API 키의 발급 방법과 설정 값을 정리한 가이드입니다.

---

## 1. 공공데이터포털 (응급의료 실시간 데이터)
가장 핵심적인 데이터 소스입니다.

*   **URL**: [공공데이터포털 (data.go.kr)](https://www.data.go.kr)
*   **신청 서비스**: `국립중앙의료원_전국 응급의료기관 정보 조회 서비스`
*   **활용 신청 후**: 마이페이지 → 개발계정 → `일반 인증서(Encoding/Decoding)` 키 확인
*   **.env 설정**: `EXPO_PUBLIC_DATA_SERVICE_KEY` 항목에 입력

---

## 2. Kakao Developers (지도 및 로그인)
카카오맵 표시와 카카오 로그인 처리에 사용됩니다.

*   **URL**: [카카오 개발자 콘솔](https://developers.kakao.com/)
*   **설정 정보**:
    *   **패키지 이름 / 번들 ID**: `com.mrsure.baroer` 등록 필수
*   **주요 키**:
    *   **네이티브 앱 키 (Native App Key)**: 모바일 앱 지도 표시용 (`KAKAO_APP_KEY`)
    *   **REST API 키**: 주소 변환 및 인증용 (`EXPO_PUBLIC_KAKAO_REST_API_KEY`)
    *   **JavaScript 키**: 웹뷰 기반 지도 사용 시 필요

---

## 3. Google Cloud Console / Firebase (구글 로그인)
구글 로그인을 위한 OAuth 클라이언트 설정입니다.

*   **URL**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
*   **애플리케이션 정보**:
    *   **Android 패키지 이름**: `com.mrsure.baroer`
    *   **iOS 번들 ID**: `com.mrsure.baroer`
*   **로컬 개발용 SHA-1 지문 (매우 중요)**:
    *   `E3:D1:35:73:C9:47:37:30:80:19:43:3E:EE:00:13:04:14:A8:30:66`
*   **필요한 클라이언트 ID**:
    *   **웹 클라이언트 ID**: Expo Go 환경 개발 시 필수
    *   **Android/iOS 클라이언트 ID**: 배포용 빌드 시 필요

---

## 4. Firebase (인증 및 데이터베이스)
사용자 계정과 출동 로그를 저장합니다.

*   **URL**: [Firebase 콘솔](https://console.firebase.google.com/)
*   **활용 서비스**:
    *   **Authentication**: 이메일/비밀번호, Google, Kakao 제공업체 활성화 필요
    *   **Cloud Firestore**: `users`, `patient_records`, `dispatch_logs` 콜렉션 사용

---

> [!TIP]
> 모든 키는 프로젝트 루트의 `.env` 파일에 저장하며, `.env.example` 형식을 참고하여 작성합니다. 비밀키가 유출되지 않도록 `.env` 파일은 절대 Git에 커밋하지 마세요.
