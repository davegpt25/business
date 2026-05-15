# ClosetFit MVP

이미 가진 옷으로, 더 잘 입는다.

## 서비스 구조

| 서브시스템 | 기술 | 포트 |
|---|---|---|
| AI 서비스 | FastAPI + OpenCV | 8001 |
| 백엔드 API | Node.js + Express | 3000 |
| 모바일 앱 | React Native (Expo) | — |
| 데이터베이스 | PostgreSQL | 5432 |

## 시작하기

### 사전 요구사항
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

### 1. AI 서비스

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 2. 데이터베이스 설정

```bash
psql -U postgres -c "CREATE DATABASE closetfit_dev;"
psql -U postgres -d closetfit_dev -f backend/migrations/001_initial_schema.sql
```

### 3. 백엔드 API

```bash
cd backend
cp .env.example .env
# .env에서 JWT_SECRET 설정 필수: openssl rand -hex 64
npm install
npm run dev
```

### 4. 모바일 앱

```bash
cd mobile
npm install
npx expo start
```

## 테스트

```bash
# AI 서비스
cd ai-service && pytest tests/ -v

# 백엔드
cd backend && npm test
```

## Phase 1 MVP 기능

- ✅ 소셜 로그인 (카카오 / 구글 / 애플)
- ✅ 의류 아이템 등록/조회/수정/삭제
- ✅ AI 컬러 추출 (K-means 클러스터링)
- ✅ 컬러 기반 코디 추천 (HSL 호환성 점수)
- ✅ React Native 앱 (온보딩, 홈, 옷장, 코디 추천)
