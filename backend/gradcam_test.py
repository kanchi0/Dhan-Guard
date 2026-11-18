import sys

import numpy as np
import tensorflow as tf
from PIL import Image

from predictor import CLASS_NAMES, model, predict_from_path, preprocess

if len(sys.argv) < 2:
    print("Usage: python gradcam_test.py <image path>")
    sys.exit(1)

image_path = sys.argv[1]

base = model.get_layer("mobilenetv2_1.00_224")  # ends in a 7 x 7 x 1280 map
drop = model.get_layer("dropout")               # its output feeds the last layer
dense = model.get_layer("dense")
kernel, bias = dense.get_weights()

# Listen to two layers while the real model runs, and save what they output
saved = {}


def listen(layer, name):
    original_call = layer.call

    def wrapped(*args, **kwargs):
        out = original_call(*args, **kwargs)
        saved[name] = out
        return out

    layer.call = wrapped
    return original_call


restore_base = listen(base, "features")
restore_drop = listen(drop, "last_input")

with Image.open(image_path) as img:
    original = img.convert("RGB")
batch = tf.convert_to_tensor(preprocess(original))  # raw 0 to 255, as in predictor.py

normal = predict_from_path(image_path)
class_index = CLASS_NAMES.index(normal["disease"])

with tf.GradientTape() as tape:
    probs = model(batch, training=False)  # the real model, run as a whole
    features = saved.get("features")
    last_input = saved.get("last_input")
    if features is None or last_input is None:
        print("STOP: could not capture the inner layers. No heatmap was made.")
        sys.exit(1)
    logits = tf.matmul(last_input, kernel) + bias  # raw scores before softmax
    score = logits[:, class_index]

# Put the layers back as they were
base.call = restore_base
drop.call = restore_drop

grads = tape.gradient(score, features)

p = probs.numpy()[0]
check = tf.nn.softmax(logits).numpy()[0]
print()
print(f"Captured features shape : {tuple(features.shape)}")
print(f"Normal predictor        : {normal['disease']} {normal['confidence'] * 100:.1f}%")
print(f"Whole model answer      : {CLASS_NAMES[int(np.argmax(p))]} {float(np.max(p)) * 100:.1f}%")
print(f"Softmax of my scores    : {CLASS_NAMES[int(np.argmax(check))]} {float(np.max(check)) * 100:.1f}%")

ok = (
    tuple(features.shape) == (1, 7, 7, 1280)
    and int(np.argmax(p)) == class_index
    and abs(float(p[class_index]) - normal["confidence"]) < 0.001
    and int(np.argmax(check)) == class_index
    and abs(float(check[class_index]) - float(p[class_index])) < 0.001
    and grads is not None
)
if not ok:
    print()
    print("STOP: the checks failed (or no gradient). No heatmap was made.")
    sys.exit(1)
print("All checks passed.")

# Grad-CAM: how much does each of the 7 x 7 areas push toward the predicted class?
weights = tf.reduce_mean(grads, axis=(1, 2))  # one weight for each of the 1280 maps
cam = tf.reduce_sum(features * weights[:, None, None, :], axis=-1)[0]
cam = tf.nn.relu(cam).numpy()
cam = cam / (cam.max() + 1e-8)  # scale to 0..1

# Draw the heatmap over the photo
w, h = original.size
cam_img = Image.fromarray((cam * 255).astype("uint8")).resize((w, h), Image.BICUBIC)
c = np.asarray(cam_img, dtype=np.float32) / 255.0
r = np.clip(1.5 - np.abs(4 * c - 3), 0, 1)
g = np.clip(1.5 - np.abs(4 * c - 2), 0, 1)
b = np.clip(1.5 - np.abs(4 * c - 1), 0, 1)
heat = np.stack([r, g, b], axis=-1) * 255
photo = np.asarray(original, dtype=np.float32)
alpha = 0.6 * c[..., None]
overlay = (photo * (1 - alpha) + heat * alpha).astype("uint8")

side = Image.new("RGB", (w * 2, h))
side.paste(original, (0, 0))
side.paste(Image.fromarray(overlay), (w, 0))
side.save("gradcam_test.png")
print(f"Heatmap is for the class: {normal['disease']}")
print("Saved: gradcam_test.png (left: photo, right: heatmap)")