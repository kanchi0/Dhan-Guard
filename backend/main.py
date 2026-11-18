import io
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from auth import create_token, get_current_user, hash_password, verify_password
from database import get_db
from models import Disease, Prediction, User

# Importing predictor loads the model ONCE, when the server starts
from predictor import predict_from_bytes

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
LOW_CONFIDENCE_THRESHOLD = 0.70
MARGIN_THRESHOLD = 0.20

app = FastAPI(title="DhanGuard API")

# CORS lets the React app (running on port 5173) call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lets the browser load saved images from http://127.0.0.1:8000/uploads/<name>
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(min_length=6, max_length=64)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Please enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str


def disease_to_dict(d: Disease) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "description": d.description,
        "symptoms": d.symptoms,
        "cause": d.cause,
        "treatments": [
            {"type": t.type, "recommendation": t.recommendation}
            for t in d.treatments
        ],
    }


@app.get("/health")
def health():
    """Quick check that the server is running."""
    return {"status": "ok"}


@app.post("/register", status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="This email is already registered.")
    user = User(
        name=data.name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email}


@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.strip().lower()).first()
    # Same message for both cases, so attackers cannot tell which one was wrong
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return {
        "access_token": create_token(user.id),
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    """Test endpoint: works only with a valid token."""
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}


@app.get("/diseases")
def list_diseases(db: Session = Depends(get_db)):
    """Return all diseases with their treatments."""
    diseases = db.query(Disease).order_by(Disease.name).all()
    return [disease_to_dict(d) for d in diseases]


@app.post("/predict")
def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Read the file, but never more than the size limit
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Maximum size is 5 MB.")

    # 2. Check that it is a real JPG or PNG image (not just a renamed file)
    try:
        with Image.open(io.BytesIO(data)) as img:
            image_format = img.format
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="This file is not a valid image. Please upload a JPG or PNG photo.",
        )
    if image_format not in ("JPEG", "PNG"):
        raise HTTPException(status_code=415, detail="Only JPG and PNG images are supported.")

    # 3. Run the model
    try:
        result = predict_from_bytes(data)
    except Exception:
        raise HTTPException(status_code=400, detail="The image could not be processed. Please try another photo.")

    # 4. Look up the disease and its treatments in the database
    disease = db.query(Disease).filter(Disease.name == result["disease"]).first()
    if disease is None:
        raise HTTPException(
            status_code=500,
            detail=f"Disease '{result['disease']}' is missing from the database. Run seed.py.",
        )

    # 5. Save the image with a unique name
    extension = ".jpg" if image_format == "JPEG" else ".png"
    filename = f"{uuid.uuid4().hex}{extension}"
    (UPLOADS_DIR / filename).write_bytes(data)

    # 6. Save the prediction record
    record = Prediction(
        user_id=current_user.id,
        image_path=f"uploads/{filename}",
        disease_id=disease.id,
        confidence=result["confidence"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # 7. Decide whether the result is reliable enough to show as a diagnosis
    top3 = result["top3"]
    margin = top3[0]["confidence"] - top3[1]["confidence"]
    low_confidence = result["confidence"] < LOW_CONFIDENCE_THRESHOLD
    uncertain = low_confidence or margin < MARGIN_THRESHOLD

    return {
        "prediction_id": record.id,
        "image_url": f"/uploads/{filename}",
        "confidence": result["confidence"],
        "confidence_percent": round(result["confidence"] * 100, 1),
        "margin_percent": round(margin * 100, 1),
        "low_confidence": low_confidence,
        "uncertain": uncertain,
        "message": (
            "Could not identify the disease reliably. Please retake a clear, "
            "close photo of a single rice leaf in good light."
            if uncertain
            else None
        ),
        "top3": top3,
        # When uncertain, we hide the disease and treatment on purpose
        "disease": None if uncertain else disease_to_dict(disease),
        "created_at": record.created_at,
        "note": (
            "This result is decision support, not a final diagnosis. "
            "Please consult a local agricultural officer before applying any treatment."
        ),
    }
@app.get("/history")
def history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the logged-in user's own predictions, newest first."""
    limit = max(1, min(limit, 200))
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "prediction_id": r.id,
            "image_url": f"/{r.image_path}",
            "confidence": r.confidence,
            "confidence_percent": round(r.confidence * 100, 1),
            "low_confidence": r.confidence < LOW_CONFIDENCE_THRESHOLD,
            "created_at": r.created_at,
            "uncertain": r.confidence < LOW_CONFIDENCE_THRESHOLD,
            "disease": None if r.confidence < LOW_CONFIDENCE_THRESHOLD else disease_to_dict(r.disease),
        }
        for r in records
    ]
# ---------- Model performance (numbers from the Colab test evaluation) ----------
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
# Put confusion_matrix.png and training_history.png in backend/static
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

MODEL_METRICS = {
    "model": "MobileNetV2 (transfer learning, fine-tuned)",
    "test_images": 259,
    "test_accuracy_percent": 81.08,
    "macro_f1": 0.80,
    "weighted_f1": 0.81,
    "per_class": [
        {"disease": "Bacterial Leaf Blight", "f1": 0.71, "test_images": 27},
        {"disease": "Brown Spot", "f1": 0.79, "test_images": 41},
        {"disease": "Healthy Rice Leaf", "f1": 0.98, "test_images": 24},
        {"disease": "Leaf Blast", "f1": 0.76, "test_images": 46},
        {"disease": "Leaf scald", "f1": 0.74, "test_images": 29},
        {"disease": "Narrow Brown Leaf Spot", "f1": 0.61, "test_images": 18},
        {"disease": "Rice Hispa", "f1": 0.97, "test_images": 33},
        {"disease": "Sheath Blight", "f1": 0.87, "test_images": 41},
    ],
    "confusion_matrix_url": "/static/confusion_matrix.png",
    "limitations": [
        "About 81% of test images were classified correctly, so some predictions will be wrong.",
        "Narrow Brown Leaf Spot is the weakest class (fewest training images).",
        "Brown Spot is sometimes predicted as Leaf Blast.",
        "There is no 'not a leaf' class, so unrelated photos can still get a disease label.",
        "Results are decision support, not a final diagnosis.",
    ],
}


@app.get("/metrics")
def metrics():
    """Return the model's test results for the Model Performance page."""
    return MODEL_METRICS