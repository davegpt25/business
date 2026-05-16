# ClosetFit MVP 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 옷 사진을 업로드하면 AI가 색상을 분석해 매칭 코디를 추천하는 모바일 앱 MVP를 구축한다.

**Architecture:** FastAPI 백엔드 + React Native(Expo) 프론트엔드의 모노레포 구조. 색상 추출은 Python OpenCV/K-means로 처리하는 별도 AI 모듈, 의류 이미지는 AWS S3에 저장, 사용자 데이터는 PostgreSQL에 보관한다.

**Tech Stack:** React Native (Expo SDK 51), FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL 15, Redis 7, OpenCV + scikit-learn, AWS S3 (boto3), JWT + Kakao OAuth, Docker Compose

---

## 파일 구조 맵

```
closetfit/
├── api/                        # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py             # 앱 진입점, 라우터 등록
│   │   ├── config.py           # 환경변수 설정 (Pydantic Settings)
│   │   ├── database.py         # SQLAlchemy 엔진, 세션
│   │   ├── models/
│   │   │   ├── user.py         # User, SocialAccount 모델
│   │   │   └── closet.py       # ClothingItem 모델
│   │   ├── schemas/
│   │   │   ├── user.py         # UserCreate, UserResponse Pydantic
│   │   │   └── closet.py       # ItemCreate, ItemResponse Pydantic
│   │   ├── routers/
│   │   │   ├── auth.py         # POST /auth/kakao, POST /auth/refresh
│   │   │   ├── closet.py       # CRUD /closet/items
│   │   │   └── matching.py     # GET /matching/{item_id}
│   │   ├── services/
│   │   │   ├── auth.py         # JWT 발급/검증, 카카오 OAuth
│   │   │   ├── s3.py           # S3 업로드/URL 생성
│   │   │   └── matching.py     # 컬러 매칭 추천 로직
│   │   └── deps.py             # 공통 의존성 (현재 유저, DB 세션)
│   ├── ai/
│   │   └── color_extractor.py  # K-means 기반 색상 추출
│   ├── alembic/                # DB 마이그레이션
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_closet.py
│   │   └── test_matching.py
│   ├── Dockerfile
│   └── requirements.txt
├── app/                        # React Native (Expo)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts       # axios 인스턴스, 토큰 인터셉터
│   │   ├── store/
│   │   │   └── auth.ts         # Zustand auth 스토어
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ClosetScreen.tsx
│   │   │   ├── MatchingScreen.tsx
│   │   │   └── ReportScreen.tsx
│   │   ├── components/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ColorPalette.tsx
│   │   │   └── OutfitCard.tsx
│   │   └── navigation/
│   │       └── index.tsx       # Stack + Tab 네비게이터
│   ├── app.json
│   └── package.json
├── docker-compose.yml          # PostgreSQL, Redis, API 통합 실행
└── .env.example
```

---

## Task 1: 모노레포 & 개발 환경 셋업

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `api/requirements.txt`
- Create: `api/app/config.py`

- [ ] **Step 1: 루트 디렉토리 생성 및 git 초기화**

```bash
mkdir closetfit && cd closetfit
git init
echo "node_modules/\n.env\n__pycache__/\n*.pyc\n.venv/\ndist/" > .gitignore
```

- [ ] **Step 2: `.env.example` 작성**

```bash
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://closetfit:password@localhost:5432/closetfit_db
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=closetfit-images

# Kakao OAuth
KAKAO_REST_API_KEY=your-kakao-key

# App
DEBUG=true
ALLOWED_ORIGINS=http://localhost:8081
EOF
cp .env.example .env
```

- [ ] **Step 3: `docker-compose.yml` 작성**

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: closetfit_db
      POSTGRES_USER: closetfit
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./api
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
      - redis
    volumes:
      - ./api:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  pgdata:
```

- [ ] **Step 4: `api/requirements.txt` 작성**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
boto3==1.34.101
httpx==0.27.0
redis==5.0.4
opencv-python-headless==4.9.0.80
scikit-learn==1.4.2
Pillow==10.3.0
pytest==8.2.0
pytest-asyncio==0.23.6
httpx==0.27.0
```

- [ ] **Step 5: `api/app/config.py` 작성**

```python
# api/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "ap-northeast-2"
    s3_bucket_name: str
    kakao_rest_api_key: str
    debug: bool = False
    allowed_origins: str = "http://localhost:8081"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 6: Docker Compose 실행 확인**

```bash
docker compose up -d db redis
docker compose ps
# db, redis 상태가 "running" 이어야 함
```

- [ ] **Step 7: 커밋**

```bash
git add .
git commit -m "chore: initial monorepo setup with Docker Compose"
```

---

## Task 2: FastAPI 앱 코어 & DB 연결

**Files:**
- Create: `api/app/main.py`
- Create: `api/app/database.py`
- Create: `api/Dockerfile`
- Create: `api/alembic.ini` (alembic 초기화)

- [ ] **Step 1: `api/app/database.py` 작성**

```python
# api/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 2: `api/app/main.py` 작성**

```python
# api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="ClosetFit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: `api/Dockerfile` 작성**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

- [ ] **Step 4: Alembic 초기화**

```bash
cd api
pip install -r requirements.txt
alembic init alembic
```

`alembic/env.py`의 `target_metadata` 부분을 수정:

```python
# alembic/env.py (수정 부분만)
import asyncio
from app.database import Base, engine
from app import models  # 모델 임포트 (마이그레이션 감지용)

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine.sync_engine
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

asyncio.run(run_migrations_online())
```

- [ ] **Step 5: 헬스체크 확인**

```bash
cd api && uvicorn app.main:app --reload &
curl http://localhost:8000/health
# {"status": "ok"}
```

- [ ] **Step 6: 커밋**

```bash
git add api/
git commit -m "chore: FastAPI core setup with async DB connection"
```

---

## Task 3: DB 모델 — User & ClothingItem

**Files:**
- Create: `api/app/models/user.py`
- Create: `api/app/models/closet.py`
- Create: `api/app/models/__init__.py`

- [ ] **Step 1: `api/app/models/user.py` 작성**

```python
# api/app/models/user.py
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    nickname: Mapped[str] = mapped_column(String(50))
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    kakao_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list["ClothingItem"]] = relationship(back_populates="owner")
```

- [ ] **Step 2: `api/app/models/closet.py` 작성**

```python
# api/app/models/closet.py
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, JSON, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.database import Base

class Category(str, enum.Enum):
    TOP = "top"
    BOTTOM = "bottom"
    OUTER = "outer"
    SHOES = "shoes"
    ACCESSORY = "accessory"

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[Category] = mapped_column(Enum(Category))
    image_url: Mapped[str] = mapped_column(String(500))
    # 색상 정보: [{"hex": "#C8B89A", "name": "Beige", "ratio": 0.45}, ...]
    colors: Mapped[list] = mapped_column(JSON, default=list)
    tags: Mapped[list] = mapped_column(JSON, default=list)   # ["캐주얼", "슬림핏"]
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    owner: Mapped["User"] = relationship(back_populates="items")
```

- [ ] **Step 3: `api/app/models/__init__.py` 작성**

```python
# api/app/models/__init__.py
from app.models.user import User
from app.models.closet import ClothingItem, Category
```

- [ ] **Step 4: Alembic 마이그레이션 생성 및 적용**

```bash
cd api
alembic revision --autogenerate -m "create users and clothing_items tables"
alembic upgrade head
```

Expected output: `INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, create users and clothing_items tables`

- [ ] **Step 5: 커밋**

```bash
git add api/app/models/ api/alembic/
git commit -m "feat: add User and ClothingItem database models"
```

---

## Task 4: JWT 인증 서비스 & 카카오 OAuth

**Files:**
- Create: `api/app/services/auth.py`
- Create: `api/app/schemas/user.py`
- Create: `api/app/routers/auth.py`
- Create: `api/app/deps.py`
- Create: `api/tests/test_auth.py`

- [ ] **Step 1: 테스트 먼저 작성**

```python
# api/tests/test_auth.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_kakao_login_missing_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/auth/kakao", json={})
    assert response.status_code == 422  # Unprocessable Entity (missing access_token)
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd api && pytest tests/test_auth.py -v
# test_kakao_login_missing_token FAILED — /auth/kakao 404
```

- [ ] **Step 3: `api/app/services/auth.py` 작성**

```python
# api/app/services/auth.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
import httpx
from app.config import settings

ALGORITHM = "HS256"

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.secret_key, ALGORITHM)

def create_refresh_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": str(user_id), "exp": expire, "type": "refresh"}, settings.secret_key, ALGORITHM)

def decode_token(token: str) -> int:
    """토큰 검증 후 user_id 반환. 실패시 ValueError."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise ValueError("Invalid token")

async def get_kakao_user_info(access_token: str) -> dict:
    """카카오 API로 사용자 정보 조회."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()
    kakao_account = data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    return {
        "kakao_id": str(data["id"]),
        "nickname": profile.get("nickname", "사용자"),
        "profile_image_url": profile.get("profile_image_url"),
        "email": kakao_account.get("email"),
    }
```

- [ ] **Step 4: `api/app/schemas/user.py` 작성**

```python
# api/app/schemas/user.py
from pydantic import BaseModel

class KakaoLoginRequest(BaseModel):
    access_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    nickname: str
    profile_image_url: str | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: `api/app/routers/auth.py` 작성**

```python
# api/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import KakaoLoginRequest, TokenResponse
from app.services.auth import get_kakao_user_info, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/kakao", response_model=TokenResponse)
async def kakao_login(body: KakaoLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        info = await get_kakao_user_info(body.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Kakao token")

    result = await db.execute(select(User).where(User.kakao_id == info["kakao_id"]))
    user = result.scalar_one_or_none()

    if not user:
        user = User(**info)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
```

- [ ] **Step 6: `api/app/deps.py` 작성**

```python
# api/app/deps.py
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token

async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        user_id = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

- [ ] **Step 7: `main.py`에 라우터 등록**

```python
# api/app/main.py (수정)
from app.routers import auth

app.include_router(auth.router)
```

- [ ] **Step 8: 테스트 실행 — PASS 확인**

```bash
cd api && pytest tests/test_auth.py -v
# test_health PASSED
# test_kakao_login_missing_token PASSED
```

- [ ] **Step 9: 커밋**

```bash
git add api/app/services/auth.py api/app/schemas/ api/app/routers/auth.py api/app/deps.py api/tests/
git commit -m "feat: Kakao OAuth login with JWT token issuance"
```

---

## Task 5: S3 이미지 업로드 서비스

**Files:**
- Create: `api/app/services/s3.py`

- [ ] **Step 1: `api/app/services/s3.py` 작성**

```python
# api/app/services/s3.py
import uuid
import boto3
from botocore.exceptions import ClientError
from app.config import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)

def upload_image(file_bytes: bytes, content_type: str, folder: str = "items") -> str:
    """S3에 이미지를 업로드하고 public URL을 반환."""
    ext = content_type.split("/")[-1]  # "image/jpeg" -> "jpeg"
    key = f"{folder}/{uuid.uuid4()}.{ext}"
    try:
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")
    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"

def delete_image(image_url: str) -> None:
    """URL로부터 S3 키를 추출해 삭제."""
    key = image_url.split(".amazonaws.com/")[-1]
    s3_client.delete_object(Bucket=settings.s3_bucket_name, Key=key)
```

- [ ] **Step 2: AWS S3 버킷 생성 (콘솔 또는 CLI)**

```bash
aws s3 mb s3://closetfit-images --region ap-northeast-2
# 버킷 퍼블릭 액세스 정책 설정 (ACL 없이 URL 직접 접근)
aws s3api put-bucket-policy --bucket closetfit-images --policy '{
  "Version": "2012-10-17",
  "Statement": [{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::closetfit-images/*"}]
}'
```

- [ ] **Step 3: 커밋**

```bash
git add api/app/services/s3.py
git commit -m "feat: S3 image upload service"
```

---

## Task 6: AI 색상 추출 모듈

**Files:**
- Create: `api/ai/color_extractor.py`
- Create: `api/tests/test_color_extractor.py`

- [ ] **Step 1: 테스트 먼저 작성**

```python
# api/tests/test_color_extractor.py
import numpy as np
from ai.color_extractor import extract_colors, hex_to_color_name

def test_extract_colors_returns_list():
    # 순수 빨간색 이미지 (100x100)
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [255, 0, 0]  # BGR
    colors = extract_colors(img, n_colors=3)
    assert isinstance(colors, list)
    assert len(colors) >= 1
    assert "hex" in colors[0]
    assert "ratio" in colors[0]

def test_extract_colors_dominant_is_red():
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [0, 0, 255]  # BGR -> RGB: (255, 0, 0) = red
    colors = extract_colors(img, n_colors=1)
    assert colors[0]["hex"].upper() == "#FF0000"

def test_hex_to_color_name_white():
    assert hex_to_color_name("#FFFFFF") == "화이트"

def test_hex_to_color_name_black():
    assert hex_to_color_name("#000000") == "블랙"
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd api && pytest tests/test_color_extractor.py -v
# ImportError: cannot import name 'extract_colors'
```

- [ ] **Step 3: `api/ai/color_extractor.py` 작성**

```python
# api/ai/color_extractor.py
import numpy as np
from sklearn.cluster import KMeans

# 색상명 근사 테이블 (hex -> 한국어)
COLOR_NAMES = [
    ((255, 255, 255), "화이트"),
    ((0, 0, 0), "블랙"),
    ((128, 128, 128), "그레이"),
    ((0, 0, 128), "네이비"),
    ((0, 0, 255), "블루"),
    ((255, 0, 0), "레드"),
    ((255, 165, 0), "오렌지"),
    ((255, 255, 0), "옐로우"),
    ((0, 128, 0), "그린"),
    ((128, 0, 128), "퍼플"),
    ((255, 192, 203), "핑크"),
    ((200, 184, 154), "베이지"),
    ((139, 90, 43), "브라운"),
    ((43, 43, 43), "차콜"),
    ((255, 255, 240), "아이보리"),
]

def _closest_color_name(rgb: tuple) -> str:
    r, g, b = rgb
    min_dist = float("inf")
    closest = "기타"
    for (cr, cg, cb), name in COLOR_NAMES:
        dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if dist < min_dist:
            min_dist = dist
            closest = name
    return closest

def extract_colors(img_bgr: np.ndarray, n_colors: int = 5) -> list[dict]:
    """
    BGR 이미지에서 K-means로 주요 색상 추출.
    반환: [{"hex": "#RRGGBB", "name": "화이트", "ratio": 0.45}, ...]
    """
    img_rgb = img_bgr[:, :, ::-1]  # BGR -> RGB
    pixels = img_rgb.reshape(-1, 3).astype(float)

    k = min(n_colors, len(pixels))
    kmeans = KMeans(n_clusters=k, n_init=5, random_state=42)
    kmeans.fit(pixels)

    centers = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    total = len(labels)

    results = []
    for i, center in enumerate(centers):
        r, g, b = int(center[0]), int(center[1]), int(center[2])
        ratio = float(np.sum(labels == i)) / total
        results.append({
            "hex": f"#{r:02X}{g:02X}{b:02X}",
            "name": _closest_color_name((r, g, b)),
            "ratio": round(ratio, 3),
        })

    return sorted(results, key=lambda x: x["ratio"], reverse=True)

def hex_to_color_name(hex_color: str) -> str:
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return _closest_color_name((r, g, b))
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd api && pytest tests/test_color_extractor.py -v
# 4 passed
```

- [ ] **Step 5: 커밋**

```bash
git add api/ai/ api/tests/test_color_extractor.py
git commit -m "feat: K-means color extraction AI module"
```

---

## Task 7: 옷장 CRUD API (업로드 + 색상 자동 추출)

**Files:**
- Create: `api/app/schemas/closet.py`
- Create: `api/app/routers/closet.py`
- Create: `api/tests/test_closet.py`

- [ ] **Step 1: `api/app/schemas/closet.py` 작성**

```python
# api/app/schemas/closet.py
from pydantic import BaseModel
from app.models.closet import Category

class ColorInfo(BaseModel):
    hex: str
    name: str
    ratio: float

class ItemCreate(BaseModel):
    name: str
    category: Category
    tags: list[str] = []

class ItemResponse(BaseModel):
    id: int
    name: str
    category: Category
    image_url: str
    colors: list[dict]
    tags: list[str]

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: `api/app/routers/closet.py` 작성**

```python
# api/app/routers/closet.py
import io
import numpy as np
import cv2
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.closet import ClothingItem, Category
from app.schemas.closet import ItemResponse
from app.services.s3 import upload_image, delete_image
from ai.color_extractor import extract_colors

router = APIRouter(prefix="/closet", tags=["closet"])

@router.post("/items", response_model=ItemResponse)
async def create_item(
    name: str = Form(...),
    category: Category = Form(...),
    tags: str = Form(""),          # 쉼표 구분 문자열 "캐주얼,슬림핏"
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")

    file_bytes = await file.read()
    image_url = upload_image(file_bytes, file.content_type)

    # 색상 추출
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    colors = extract_colors(img, n_colors=5)

    item = ClothingItem(
        user_id=current_user.id,
        name=name,
        category=category,
        image_url=image_url,
        colors=colors,
        tags=[t.strip() for t in tags.split(",") if t.strip()],
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/items", response_model=list[ItemResponse])
async def list_items(
    category: Category | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(ClothingItem).where(ClothingItem.user_id == current_user.id)
    if category:
        stmt = stmt.where(ClothingItem.category == category)
    result = await db.execute(stmt.order_by(ClothingItem.created_at.desc()))
    return result.scalars().all()

@router.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ClothingItem).where(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    delete_image(item.image_url)
    await db.delete(item)
    await db.commit()
```

- [ ] **Step 3: `main.py`에 closet 라우터 등록**

```python
# api/app/main.py (추가)
from app.routers import auth, closet
app.include_router(closet.router)
```

- [ ] **Step 4: 커밋**

```bash
git add api/app/schemas/closet.py api/app/routers/closet.py
git commit -m "feat: closet items CRUD API with auto color extraction"
```

---

## Task 8: 컬러 매칭 추천 API

**Files:**
- Create: `api/app/services/matching.py`
- Create: `api/app/routers/matching.py`
- Create: `api/tests/test_matching.py`

- [ ] **Step 1: 테스트 먼저 작성**

```python
# api/tests/test_matching.py
from app.services.matching import get_complementary_colors, score_item_pair

def test_complementary_of_navy_includes_white():
    navy_hex = "#001F5B"
    suggestions = get_complementary_colors(navy_hex)
    names = [s["name"] for s in suggestions]
    assert "화이트" in names or "아이보리" in names

def test_score_item_pair_same_category_returns_zero():
    top1 = {"category": "top", "colors": [{"hex": "#FFFFFF", "ratio": 1.0}]}
    top2 = {"category": "top", "colors": [{"hex": "#000000", "ratio": 1.0}]}
    assert score_item_pair(top1, top2) == 0
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
pytest tests/test_matching.py -v
# ImportError
```

- [ ] **Step 3: `api/app/services/matching.py` 작성**

```python
# api/app/services/matching.py
"""
컬러 이론 기반 매칭 점수 계산.
- 보색(Complementary): 색상환 180도 반대
- 유사색(Analogous): 색상환 ±30도
- 중립(Neutral): 흰/검/회는 모든 색과 어울림
"""
import colorsys

NEUTRAL_NAMES = {"화이트", "블랙", "그레이", "차콜", "아이보리", "베이지"}

# 추천 색상 테이블 (주요 색상 hex -> 어울리는 색상 목록)
MATCHING_TABLE = {
    "네이비": [
        {"hex": "#FFFFFF", "name": "화이트", "type": "중립"},
        {"hex": "#F5F5DC", "name": "베이지", "type": "유사"},
        {"hex": "#D2691E", "name": "브라운", "type": "유사"},
        {"hex": "#808080", "name": "그레이", "type": "중립"},
    ],
    "화이트": [
        {"hex": "#001F5B", "name": "네이비", "type": "대비"},
        {"hex": "#000000", "name": "블랙", "type": "대비"},
        {"hex": "#D2B48C", "name": "카멜", "type": "유사"},
        {"hex": "#808080", "name": "그레이", "type": "중립"},
    ],
    "블랙": [
        {"hex": "#FFFFFF", "name": "화이트", "type": "대비"},
        {"hex": "#FF0000", "name": "레드", "type": "포인트"},
        {"hex": "#808080", "name": "그레이", "type": "중립"},
        {"hex": "#D2B48C", "name": "카멜", "type": "유사"},
    ],
    "베이지": [
        {"hex": "#FFFFFF", "name": "화이트", "type": "유사"},
        {"hex": "#001F5B", "name": "네이비", "type": "대비"},
        {"hex": "#8B4513", "name": "브라운", "type": "유사"},
        {"hex": "#808080", "name": "그레이", "type": "중립"},
        {"hex": "#D2691E", "name": "카멜", "type": "유사"},
    ],
    "그레이": [
        {"hex": "#FFFFFF", "name": "화이트", "type": "중립"},
        {"hex": "#000000", "name": "블랙", "type": "중립"},
        {"hex": "#001F5B", "name": "네이비", "type": "대비"},
        {"hex": "#FF4500", "name": "레드오렌지", "type": "포인트"},
    ],
}

def get_complementary_colors(base_hex: str) -> list[dict]:
    """주어진 색상에 어울리는 추천 컬러 팔레트 반환."""
    from ai.color_extractor import hex_to_color_name
    color_name = hex_to_color_name(base_hex)
    return MATCHING_TABLE.get(color_name, MATCHING_TABLE["그레이"])

def score_item_pair(item_a: dict, item_b: dict) -> float:
    """
    두 아이템의 매칭 점수(0.0~1.0) 계산.
    같은 카테고리끼리는 0점.
    """
    if item_a["category"] == item_b["category"]:
        return 0.0

    color_a = item_a["colors"][0]["hex"] if item_a["colors"] else "#808080"
    color_b = item_b["colors"][0]["hex"] if item_b["colors"] else "#808080"

    suggestions = get_complementary_colors(color_a)
    suggested_names = {s["name"] for s in suggestions}

    from ai.color_extractor import hex_to_color_name
    name_b = hex_to_color_name(color_b)

    if name_b in NEUTRAL_NAMES:
        return 0.85
    if name_b in suggested_names:
        return 0.95
    return 0.60
```

- [ ] **Step 4: `api/app/routers/matching.py` 작성**

```python
# api/app/routers/matching.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.closet import ClothingItem
from app.services.matching import get_complementary_colors, score_item_pair

router = APIRouter(prefix="/matching", tags=["matching"])

@router.get("/{item_id}")
async def get_matching(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ClothingItem).where(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id)
    )
    base_item = result.scalar_one_or_none()
    if not base_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 사용자의 다른 아이템들 가져오기
    all_result = await db.execute(
        select(ClothingItem).where(
            ClothingItem.user_id == current_user.id,
            ClothingItem.id != item_id,
        )
    )
    candidates = all_result.scalars().all()

    base_color = base_item.colors[0]["hex"] if base_item.colors else "#808080"
    palette = get_complementary_colors(base_color)

    # 각 후보 아이템 점수 계산
    scored = []
    for c in candidates:
        score = score_item_pair(
            {"category": base_item.category.value, "colors": base_item.colors},
            {"category": c.category.value, "colors": c.colors},
        )
        if score > 0:
            scored.append({"item": c, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "base_item": {
            "id": base_item.id,
            "name": base_item.name,
            "image_url": base_item.image_url,
            "primary_color": base_color,
            "color_name": base_item.colors[0]["name"] if base_item.colors else "알 수 없음",
        },
        "palette": palette,
        "recommendations": [
            {
                "id": s["item"].id,
                "name": s["item"].name,
                "image_url": s["item"].image_url,
                "category": s["item"].category.value,
                "score": round(s["score"] * 100),
            }
            for s in scored[:5]
        ],
    }
```

- [ ] **Step 5: `main.py`에 matching 라우터 등록**

```python
from app.routers import auth, closet, matching
app.include_router(matching.router)
```

- [ ] **Step 6: 테스트 실행 — PASS 확인**

```bash
pytest tests/test_matching.py -v
# 2 passed
```

- [ ] **Step 7: 커밋**

```bash
git add api/app/services/matching.py api/app/routers/matching.py api/tests/test_matching.py
git commit -m "feat: color matching recommendation API"
```

---

## Task 9: React Native 앱 셋업 (Expo)

**Files:**
- Create: `app/` (Expo 프로젝트 전체)
- Create: `app/src/api/client.ts`
- Create: `app/src/store/auth.ts`

- [ ] **Step 1: Expo 프로젝트 생성**

```bash
npx create-expo-app@latest app --template blank-typescript
cd app
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install axios zustand @react-native-async-storage/async-storage
npx expo install expo-image-picker expo-camera
```

- [ ] **Step 2: `app/src/api/client.ts` 작성**

```typescript
// app/src/api/client.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = __DEV__ ? "http://localhost:8000" : "https://api.closetfit.app";

export const apiClient = axios.create({ baseURL: API_BASE });

// 요청마다 저장된 토큰 자동 주입
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 시 자동 로그아웃 처리
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 3: `app/src/store/auth.ts` 작성**

```typescript
// app/src/store/auth.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../api/client";

interface AuthState {
  isLoggedIn: boolean;
  userId: number | null;
  nickname: string | null;
  login: (kakaoAccessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userId: null,
  nickname: null,

  login: async (kakaoAccessToken: string) => {
    const { data } = await apiClient.post("/auth/kakao", {
      access_token: kakaoAccessToken,
    });
    await AsyncStorage.setItem("access_token", data.access_token);
    await AsyncStorage.setItem("refresh_token", data.refresh_token);
    set({ isLoggedIn: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    set({ isLoggedIn: false, userId: null, nickname: null });
  },

  hydrate: async () => {
    const token = await AsyncStorage.getItem("access_token");
    set({ isLoggedIn: !!token });
  },
}));
```

- [ ] **Step 4: `app/src/navigation/index.tsx` 작성**

```tsx
// app/src/navigation/index.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/auth";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ClosetScreen from "../screens/ClosetScreen";
import MatchingScreen from "../screens/MatchingScreen";
import ReportScreen from "../screens/ReportScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="옷장" component={ClosetScreen} />
      <Tab.Screen name="매칭" component={MatchingScreen} />
      <Tab.Screen name="리포트" component={ReportScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { isLoggedIn } = useAuthStore();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 5: `app/App.tsx` 업데이트**

```tsx
// app/App.tsx
import React, { useEffect } from "react";
import { useAuthStore } from "./src/store/auth";
import Navigation from "./src/navigation";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, []);
  return <Navigation />;
}
```

- [ ] **Step 6: Expo 실행 확인**

```bash
cd app && npx expo start
# QR 코드 스캔 또는 iOS/Android 시뮬레이터에서 앱 실행 확인
```

- [ ] **Step 7: 커밋**

```bash
git add app/
git commit -m "feat: React Native Expo app setup with navigation and auth store"
```

---

## Task 10: 로그인 화면 & 카카오 로그인 연동

**Files:**
- Create: `app/src/screens/LoginScreen.tsx`

- [ ] **Step 1: `app/src/screens/LoginScreen.tsx` 작성**

```tsx
// app/src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useAuthStore } from "../store/auth";

// 실제 카카오 SDK 대신 개발 단계에서는 테스트 토큰 사용
// 프로덕션: react-native-kakao-login 패키지 연동 필요
export default function LoginScreen() {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      // TODO: 실제 카카오 SDK에서 accessToken 획득
      // const { accessToken } = await KakaoLogin.login();
      // await login(accessToken);

      // 개발 테스트용 — 실제 카카오 토큰으로 교체
      Alert.alert("안내", "카카오 SDK 연동 후 실제 토큰으로 교체하세요");
    } catch (e) {
      Alert.alert("로그인 실패", "다시 시도해 주세요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👗 ClosetFit</Text>
      <Text style={styles.subtitle}>내 옷장 속 옷으로{"\n"}더 잘 입는 방법</Text>
      <TouchableOpacity style={styles.kakaoBtn} onPress={handleKakaoLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#3C1E1E" /> : (
          <Text style={styles.kakaoText}>카카오로 시작하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A", alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 40, color: "#fff", fontWeight: "900", marginBottom: 12 },
  subtitle: { fontSize: 18, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 28, marginBottom: 60 },
  kakaoBtn: { backgroundColor: "#FEE500", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, width: "100%" },
  kakaoText: { color: "#3C1E1E", fontWeight: "800", fontSize: 16, textAlign: "center" },
});
```

- [ ] **Step 2: 커밋**

```bash
git add app/src/screens/LoginScreen.tsx
git commit -m "feat: login screen with Kakao OAuth button"
```

---

## Task 11: 옷장 화면 — 아이템 목록 & 업로드

**Files:**
- Create: `app/src/screens/ClosetScreen.tsx`
- Create: `app/src/components/ItemCard.tsx`

- [ ] **Step 1: `app/src/components/ItemCard.tsx` 작성**

```tsx
// app/src/components/ItemCard.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface ItemCardProps {
  item: { id: number; name: string; image_url: string; tags: string[] };
  onPress: () => void;
}

export default function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.tags}>
          {item.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: "48%", backgroundColor: "#1A1A2E", borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  info: { padding: 10 },
  name: { color: "#fff", fontWeight: "700", fontSize: 13, marginBottom: 6 },
  tags: { flexDirection: "row", gap: 4 },
  tag: { backgroundColor: "rgba(124,111,247,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { color: "#7C6FF7", fontSize: 10, fontWeight: "600" },
});
```

- [ ] **Step 2: `app/src/screens/ClosetScreen.tsx` 작성**

```tsx
// app/src/screens/ClosetScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../api/client";
import ItemCard from "../components/ItemCard";

interface ClothingItem {
  id: number; name: string; image_url: string; category: string; tags: string[];
}

export default function ClosetScreen() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/closet/items");
      setItems(data);
    } catch {
      Alert.alert("오류", "아이템을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("file", { uri: asset.uri, type: "image/jpeg", name: "photo.jpg" } as any);
    formData.append("name", "새 아이템");
    formData.append("category", "top");
    formData.append("tags", "캐주얼");

    try {
      await apiClient.post("/closet/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchItems();
    } catch {
      Alert.alert("업로드 실패", "다시 시도해 주세요");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#7C6FF7" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 옷장</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleUpload}>
          <Text style={styles.addBtnText}>+ 추가</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => {}} />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  addBtn: { backgroundColor: "#7C6FF7", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  row: { justifyContent: "space-between" },
});
```

- [ ] **Step 3: 커밋**

```bash
git add app/src/screens/ClosetScreen.tsx app/src/components/ItemCard.tsx
git commit -m "feat: closet screen with image upload and item grid"
```

---

## Task 12: 컬러 매칭 화면

**Files:**
- Create: `app/src/screens/MatchingScreen.tsx`
- Create: `app/src/components/ColorPalette.tsx`

- [ ] **Step 1: `app/src/components/ColorPalette.tsx` 작성**

```tsx
// app/src/components/ColorPalette.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

interface ColorChip {
  hex: string; name: string; type: string;
}

export default function ColorPalette({ colors, label }: { colors: ColorChip[]; label: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {colors.map((c) => (
          <View key={c.hex} style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: c.hex, borderWidth: c.hex === "#FFFFFF" ? 1 : 0, borderColor: "#333" }]} />
            <Text style={styles.name}>{c.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12, paddingHorizontal: 20 },
  chip: { alignItems: "center", marginRight: 16, marginLeft: 4 },
  dot: { width: 44, height: 44, borderRadius: 22, marginBottom: 6 },
  name: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
```

- [ ] **Step 2: `app/src/screens/MatchingScreen.tsx` 작성**

```tsx
// app/src/screens/MatchingScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert
} from "react-native";
import { apiClient } from "../api/client";
import ColorPalette from "../components/ColorPalette";

export default function MatchingScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);

  useEffect(() => {
    apiClient.get("/closet/items").then(({ data }) => setItems(data));
  }, []);

  const handleSelect = async (item: any) => {
    setSelected(item);
    try {
      const { data } = await apiClient.get(`/matching/${item.id}`);
      setMatchResult(data);
    } catch {
      Alert.alert("오류", "매칭 분석 중 오류가 발생했습니다");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>컬러 매칭</Text>
      <Text style={styles.subtitle}>아이템을 선택해 어울리는 조합을 확인하세요</Text>

      {/* 아이템 선택 가로 스크롤 */}
      <FlatList
        horizontal
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            style={[styles.thumb, selected?.id === item.id && styles.thumbSelected]}
          >
            <Image source={{ uri: item.image_url }} style={styles.thumbImg} />
          </TouchableOpacity>
        )}
      />

      {matchResult && (
        <View style={{ marginTop: 24 }}>
          {/* 선택 아이템 색상 정보 */}
          <View style={styles.selectedInfo}>
            <View style={[styles.colorDot, { backgroundColor: matchResult.base_item.primary_color }]} />
            <Text style={styles.colorName}>{matchResult.base_item.color_name} • {matchResult.base_item.primary_color}</Text>
          </View>

          {/* 팔레트 */}
          <ColorPalette
            colors={matchResult.palette}
            label={`👕 ${matchResult.base_item.name}에 어울리는 상의 추천 컬러`}
          />

          {/* 추천 아이템 */}
          <Text style={styles.sectionTitle}>✨ 추천 코디</Text>
          {matchResult.recommendations.map((rec: any) => (
            <View key={rec.id} style={styles.recCard}>
              <Image source={{ uri: rec.image_url }} style={styles.recImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recName}>{rec.name}</Text>
                <Text style={styles.recScore}>{rec.score}% 매칭</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", padding: 20, paddingTop: 60 },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 14, paddingHorizontal: 20, marginBottom: 20 },
  thumb: { width: 70, height: 90, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  thumbSelected: { borderColor: "#7C6FF7" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  selectedInfo: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 },
  colorDot: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  colorName: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", paddingHorizontal: 20, marginVertical: 12 },
  recCard: { flexDirection: "row", alignItems: "center", margin: 12, marginTop: 0, backgroundColor: "#1A1A2E", borderRadius: 16, overflow: "hidden" },
  recImg: { width: 70, height: 80, resizeMode: "cover" },
  recName: { color: "#fff", fontWeight: "700", marginLeft: 14, fontSize: 14 },
  recScore: { color: "#7C6FF7", fontWeight: "700", marginLeft: 14, marginTop: 4 },
});
```

- [ ] **Step 3: 커밋**

```bash
git add app/src/screens/MatchingScreen.tsx app/src/components/ColorPalette.tsx
git commit -m "feat: color matching screen with palette and recommendations"
```

---

## Task 13: 홈 화면 & 스타일 리포트 화면

**Files:**
- Create: `app/src/screens/HomeScreen.tsx`
- Create: `app/src/screens/ReportScreen.tsx`

- [ ] **Step 1: `app/src/screens/HomeScreen.tsx` 작성**

```tsx
// app/src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { apiClient } from "../api/client";

export default function HomeScreen() {
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get("/closet/items").then(({ data }) => setRecentItems(data.slice(0, 6)));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>안녕하세요 👋</Text>
      <Text style={styles.name}>오늘의 코디</Text>

      <View style={styles.banner}>
        <Text style={styles.bannerBadge}>✦ CLOSETFIT</Text>
        <Text style={styles.bannerText}>
          내 옷장 속 옷을 고르면{"\n"}
          <Text style={styles.bannerHighlight}>AI가 컬러 팔레트</Text>와 추천 룩을 제안해요
        </Text>
      </View>

      <Text style={styles.sectionTitle}>최근 등록 아이템</Text>
      <ScrollView horizontal contentContainerStyle={styles.itemRow}>
        {recentItems.map((item) => (
          <View key={item.id} style={styles.itemThumb}>
            <Image source={{ uri: item.image_url }} style={styles.itemImg} />
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  greeting: { color: "rgba(255,255,255,0.6)", fontSize: 14, padding: 20, paddingTop: 60, paddingBottom: 4 },
  name: { color: "#fff", fontSize: 26, fontWeight: "900", paddingHorizontal: 20, marginBottom: 16 },
  banner: { margin: 20, marginTop: 0, padding: 16, backgroundColor: "rgba(124,111,247,0.12)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,111,247,0.3)" },
  bannerBadge: { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  bannerText: { color: "#fff", fontSize: 15, fontWeight: "700", lineHeight: 22 },
  bannerHighlight: { color: "#7C6FF7" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", paddingHorizontal: 20, marginBottom: 12 },
  itemRow: { paddingHorizontal: 20, gap: 12 },
  itemThumb: { width: 90 },
  itemImg: { width: 90, height: 110, borderRadius: 14, resizeMode: "cover", marginBottom: 6 },
  itemName: { color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center" },
});
```

- [ ] **Step 2: `app/src/screens/ReportScreen.tsx` 작성**

```tsx
// app/src/screens/ReportScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { apiClient } from "../api/client";

export default function ReportScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get("/closet/items").then(({ data }) => setItems(data));
  }, []);

  // 카테고리별 집계
  const counts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 주요 색상 집계
  const colorCount: Record<string, number> = {};
  items.forEach((item) => {
    if (item.colors?.[0]) {
      const name = item.colors[0].name;
      colorCount[name] = (colorCount[name] || 0) + 1;
    }
  });
  const topColors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>스타일 리포트</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 옷장 현황</Text>
        <Text style={styles.total}>총 {items.length}개 아이템</Text>
        {Object.entries(counts).map(([cat, count]) => (
          <View key={cat} style={styles.row}>
            <Text style={styles.catLabel}>{cat}</Text>
            <Text style={styles.catCount}>{count}개</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎨 자주 쓰는 컬러</Text>
        {topColors.map(([name, count]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.catLabel}>{name}</Text>
            <Text style={styles.catCount}>{count}개</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", padding: 20, paddingTop: 60 },
  card: { margin: 16, marginTop: 0, backgroundColor: "#1A1A2E", borderRadius: 20, padding: 20, marginBottom: 16 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 16 },
  total: { color: "#7C6FF7", fontSize: 28, fontWeight: "900", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  catLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  catCount: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
```

- [ ] **Step 3: 커밋**

```bash
git add app/src/screens/HomeScreen.tsx app/src/screens/ReportScreen.tsx
git commit -m "feat: home and report screens"
```

---

## Task 14: 통합 테스트 & 최종 확인

- [ ] **Step 1: 백엔드 전체 테스트 실행**

```bash
cd api && pytest tests/ -v
# Expected: 모든 테스트 PASS
```

- [ ] **Step 2: Docker Compose로 전체 스택 실행**

```bash
docker compose up --build
# api: http://localhost:8000/docs (Swagger UI)
# db: localhost:5432
# redis: localhost:6379
```

- [ ] **Step 3: API 동작 확인 (Swagger UI)**

Swagger UI (`http://localhost:8000/docs`)에서 순서대로 확인:
1. `POST /auth/kakao` — 실제 카카오 액세스 토큰으로 JWT 발급 확인
2. `POST /closet/items` — 이미지 업로드 + 색상 자동 추출 확인
3. `GET /closet/items` — 목록 조회 확인
4. `GET /matching/{item_id}` — 색상 팔레트 + 추천 반환 확인

- [ ] **Step 4: Expo 앱 실제 기기 확인**

```bash
cd app && npx expo start --tunnel
```

QR 코드로 실제 기기에서 확인:
- 로그인 → 홈 화면 진입
- 옷장 탭 → 이미지 업로드
- 매칭 탭 → 아이템 선택 후 추천 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add .
git commit -m "chore: MVP phase 1 complete — backend + AI + React Native app"
```

---

## 다음 단계 (Phase 2)

MVP 완료 후 진행할 기능:
- 퍼스널 컬러 진단 (봄웜/여름쿨/가을웜/겨울쿨)
- 스타일 무드 필터 (캐주얼/오피스/데이트)
- 룩북 저장 및 공유
- 쇼핑 연동 (부족 아이템 커머스 연결)
- 푸시 알림 (미착용 아이템 알림)
