import json
import tensorflow as tf

model = tf.keras.models.load_model("model/dhanguard_model.keras")
class_names = json.load(open("model/class_names.json"))

print("Model loaded OK")
print("Classes:", class_names)
print("Input shape:", model.input_shape)