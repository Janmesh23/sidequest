from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from pydantic import BaseModel

# NextAuth typically doesn't use the standard OAuth2 token URL flow from FastAPI Swagger, 
# but this allows FastAPI to extract the Bearer token from the Authorization header easily.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# This must match the AUTH_SECRET in the frontend .env
# We fallback to the same dev secret if not provided
SECRET_KEY = os.getenv("AUTH_SECRET", "fallback_secret_for_dev_only_12345")
ALGORITHM = "HS256"

class User(BaseModel):
    id: str
    email: str | None = None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or missing token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        # Fallback for dev testing if no token provided at all
        # Normally you would raise credentials_exception here, but since the frontend 
        # might still be loading sessions, we can temporarily allow user_1 for dev
        # return User(id="user_1")
        raise credentials_exception

    try:
        # Decode the JWT signed by jose in frontend/src/auth.ts
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            raise credentials_exception
            
        return User(id=user_id, email=email)
        
    except JWTError as e:
        print(f"JWT Verification Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT Error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
