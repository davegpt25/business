# ClosetFit (클로젯핏) — Project Context

## 서비스 개요

**클로젯핏(ClosetFit)**은 집에 있는 옷을 등록하면 AI가 색상을 분석해 어울리는 코디를 추천해주는 모바일 앱 서비스입니다.

- **슬로건**: "이미 가진 옷으로, 더 잘 입는다"
- **타겟층**: 20~40대
- **GitHub**: https://github.com/davegpt25/business.git (branch: master)

---

## 아키텍처

```
모바일 앱 (React Native / Expo)  ← http://localhost:8081
        ↕
백엔드 API (Node.js / Express)   ← http://localhost:3000
        ↕
PostgreSQL DB (closetfit_dev)    ← localhost:5432
        ↕
AI 서비스 (FastAPI / Python)     ← http://localhost:8001
```

---

## 폴더 구조

```
기획서/
├── CLAUDE.md
├── README.md
├── .gitignore
├── backend/                     ← Node.js API 서버
│   ├── .env                     ← 환경변수 (gitignore됨)
│   ├── .env.example
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── closetController.js
│   │   │   ├── outfitController.js
│   │   │   └── uploadController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── closet.js
│   │   │   ├── outfit.js
│   │   │   └── upload.js
│   │   └── services/aiServiceClient.js
│   ├── tests/
│   │   ├── auth.test.js         ← 7개 테스트
│   │   ├── closet.test.js       ← 9개 테스트
│   │   └── outfit.test.js       ← 5개 테스트
│   └── uploads/                 ← 업로드된 이미지 저장 (gitignore됨)
├── ai-service/                  ← FastAPI AI 서비스
│   ├── main.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── models/schemas.py
│   ├── routers/
│   │   ├── color.py             ← POST /color/extract
│   │   └── item.py              ← POST /item/analyze-item
│   ├── services/color_extractor.py  ← K-means 색상 추출
│   └── tests/test_color_extractor.py ← 4개 테스트
└── mobile/                      ← React Native / Expo 앱
    ├── .env                     ← EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (gitignore됨)
    ├── App.js
    ├── src/
    │   ├── api/client.js        ← axios 클라이언트 + authAPI, closetAPI, uploadAPI
    │   ├── navigation/AppNavigator.js
    │   ├── store/
    │   │   ├── useAuthStore.js  ← Zustand 인증 상태
    │   │   └── useClosetStore.js ← Zustand 옷장 상태
    │   └── screens/
    │       ├── OnboardingScreen.js  ← Google OAuth 로그인
    │       ├── HomeScreen.js
    │       ├── ClosetScreen.js
    │       ├── AddItemScreen.js    ← 사진 업로드
    │       ├── ColorMatchScreen.js
    │       └── OutfitResultScreen.js
    └── package.json
```

---

## 로컬 실행 방법

### 1. PostgreSQL DB 설정 (최초 1회)

```powershell
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE closetfit_dev;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d closetfit_dev -f backend/migrations/001_initial_schema.sql
```

### 2. 백엔드 서버 실행

```powershell
cd backend
npm install
node src/server.js
# → http://localhost:3000
```

### 3. 모바일 앱 (웹) 실행

```powershell
cd mobile
npm install
npx expo start --web
# → http://localhost:8081
```

### 4. AI 서비스 실행 (선택)

```powershell
cd ai-service
pip install -r requirements.txt
uvicorn main:app --port 8001
# → http://localhost:8001/docs
```

---

## 환경변수

### backend/.env

```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=closetfit_dev
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key-for-testing-only
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001/api/v1
```

### mobile/.env

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=72533472124-9qdgkd0n97qksk1s1t1qdimrguhhejum.apps.googleusercontent.com
```

---

## Google OAuth 설정

- **Google Cloud 프로젝트**: `closetfit-496505`
- **Web Client ID**: `72533472124-9qdgkd0n97qksk1s1t1qdimrguhhejum.apps.googleusercontent.com`
- **승인된 리디렉션 URI**: `http://localhost:8081`
- **테스트 사용자**: `hp21647330@gmail.com`
- **관리 콘솔**: https://console.cloud.google.com/apis/credentials?project=closetfit-496505

---

## 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/v1/auth/social-login | 소셜 로그인 (google/kakao/apple) |
| PATCH | /api/v1/auth/profile | 프로필 업데이트 |
| POST | /api/v1/upload/image | 이미지 업로드 (multipart) |
| GET | /api/v1/closet/items | 옷장 목록 |
| POST | /api/v1/closet/items | 옷 등록 |
| GET | /api/v1/closet/items/:id | 아이템 상세 |
| PATCH | /api/v1/closet/items/:id | 아이템 수정 |
| DELETE | /api/v1/closet/items/:id | 아이템 삭제 |
| GET | /api/v1/outfit/recommendations | 코디 추천 (?base_item_id=) |

---

## 테스트 실행

```powershell
cd backend
npm test
# 21개 테스트 전부 통과 (auth 7 + closet 9 + outfit 5)
```

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 모바일 | React Native, Expo ~51, Zustand, Axios |
| 인증 | expo-auth-session, expo-web-browser (Google OAuth) |
| 백엔드 | Node.js, Express, JWT, Multer |
| DB | PostgreSQL 17, UUID PK, TIMESTAMPTZ |
| AI | FastAPI, OpenCV, K-means (5 clusters), scikit-learn |
| 테스트 | Jest, Supertest |

---

## 핵심 비즈니스 로직

### 색상 호환성 점수 (outfitController.js)
- 무채색 조합: 85점
- 보색 (색상차 150~210°): 90점
- 유사색 (색상차 ≤30°): 80점
- 톤온톤 (명도차 <20): 70점
- 그 외: 50점

### 코디 추천 로직
- base_item의 카테고리에 따라 COMPLEMENTARY_CATEGORIES로 후보 필터
- 각 카테고리에서 compatibility_score 최고 아이템 1개씩 선택 (최대 3개)

---

## MVP 현황

| 기능 | 상태 |
|------|------|
| Google 소셜 로그인 | ✅ 완료 |
| 옷 등록 / 조회 / 수정 / 삭제 | ✅ 완료 |
| 이미지 업로드 (로컬 저장) | ✅ 완료 |
| AI 색상 추출 (K-means) | ✅ 완료 |
| 색상 기반 코디 추천 | ✅ 완료 |
| 모바일 UI (웹 브라우저) | ✅ 완료 |

### Phase 2 예정
- S3 이미지 스토리지 전환
- 카카오 / 애플 로그인 연동
- 착용 기록 및 통계
- 소셜 피드 (코디 공유)
- 날씨 연동 추천

---

## 알려진 이슈

| 문제 | 해결책 |
|------|--------|
| psql 명령 인식 안됨 | `C:\Program Files\PostgreSQL\17\bin` PATH 추가 필요 |
| npm 스크립트 실행 오류 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` 실행 |
| Google 로그인 invalid_client | .env의 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 확인 |
| Expo 환경변수 미반영 | 서버 재시작 필요 (환경변수는 번들 시점에 주입됨) |
