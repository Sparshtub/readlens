import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db import models
from backend.app.db.schemas import TokenData
import time

security = HTTPBearer(auto_error=False)

# Cache JWKS key keys to prevent fetching it on every request
jwks_cache = {
    "keys": [],
    "expiry": 0
}

async def get_jwks_keys():
    now = time.time()
    if jwks_cache["keys"] and jwks_cache["expiry"] > now:
        return jwks_cache["keys"]
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.CLERK_JWKS_URL)
            if response.status_code == 200:
                data = response.json()
                jwks_cache["keys"] = data.get("keys", [])
                jwks_cache["expiry"] = now + 3600  # Cache for 1 hour
                return jwks_cache["keys"]
    except Exception as e:
        print(f"Failed to fetch JWKS keys: {e}")
    return []

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    # If mock auth is enabled, return a default mock user if no auth is passed
    if settings.MOCK_AUTH:
        if not credentials:
            return TokenData(user_id="mock_user_123", email="mockuser@example.com")
        
        token = credentials.credentials
        if token.startswith("mock_user_"):
            return TokenData(user_id=token, email=f"{token}@example.com")
            
        # Try parsing without verification
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
            email = payload.get("email")
            if user_id:
                return TokenData(user_id=user_id, email=email)
        except Exception:
            pass
        return TokenData(user_id="mock_user_123", email="mockuser@example.com")

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials missing",
        )
        
    token = credentials.credentials
    
    try:
        # Retrieve headers to find 'kid' (Key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token headers",
            )
            
        keys = await get_jwks_keys()
        jwk = next((k for k in keys if k.get("kid") == kid), None)
        if not jwk:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Key signature not found",
            )
            
        # Convert JWK to PEM public key
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
        
        # Verify and decode token
        # Clerk JWTs are signed with RS256
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False} # Set to false unless you configure audience
        )
        
        user_id = payload.get("sub")
        email = payload.get("email") or payload.get("sub") + "@example.com"
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sub claim missing",
            )
            
        return TokenData(user_id=user_id, email=email)
        
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )

def get_current_active_user(
    token_data: TokenData = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> models.User:
    # Auto-register/ensure user exists in DB
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if not user:
        user = models.User(
            id=token_data.user_id,
            email=token_data.email or f"{token_data.user_id}@example.com"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
