import io
import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "dhanguard_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "model" / "class_names.json"
IMAGE_SIZE = (224, 224)

# Load the model and class names ONCE, when this file is first imported.
# Loading takes 10 to 30 seconds, so we never do it per request.
print("Loading DhanGuard model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES = json.load(f)
print(f"Model loaded. Classes: {CLASS_NAMES}")


def preprocess(image: Image.Image) -> np.ndarray:
    """Turn a PIL image into the array the model expects.

    The saved model already contains MobileNetV2 preprocessing,
    so we feed RAW pixel values (0 to 255). Do NOT divide by 255 here.
    """
    image = image.convert("RGB")
    image = image.resize(IMAGE_SIZE)
    array = np.asarray(image, dtype=np.float32)
    return np.expand_dims(array, axis=0)  # shape: (1, 224, 224, 3)


def predict_image(image: Image.Image) -> dict:
    """Run the model and return the top prediction and the top 3 classes."""
    batch = preprocess(image)
    probabilities = model.predict(batch, verbose=0)[0]

    top_index = int(np.argmax(probabilities))
    top3_indices = np.argsort(probabilities)[::-1][:3]

    return {
        "disease": CLASS_NAMES[top_index],
        "confidence": float(probabilities[top_index]),  # between 0 and 1
        "top3": [
            {"disease": CLASS_NAMES[int(i)], "confidence": float(probabilities[i])}
            for i in top3_indices
        ],
    }


def predict_from_path(path) -> dict:
    with Image.open(path) as img:
        return predict_image(img)


def predict_from_bytes(data: bytes) -> dict:
    with Image.open(io.BytesIO(data)) as img:
        return predict_image(img)


if __name__ == "__main__":
    # Usage: python predictor.py test_images\leaf.jpg
    if len(sys.argv) < 2:
        print("Please give an image path, for example: python predictor.py test_images\\leaf.jpg")
        sys.exit(1)

    result = predict_from_path(sys.argv[1])
    print()
    print(f"Prediction : {result['disease']}")
    print(f"Confidence : {result['confidence'] * 100:.1f}%")
    print("Top 3:")
    for item in result["top3"]:
        print(f"  {item['disease']}: {item['confidence'] * 100:.1f}%")