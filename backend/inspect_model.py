import keras
import tensorflow as tf

print("TF", tf.__version__, "| Keras", keras.__version__)
model = tf.keras.models.load_model("model/dhanguard_model.keras", compile=False)
print("Input shape:", model.input_shape)
print("Top-level layers:")

for i, layer in enumerate(model.layers):
    try:
        shape = layer.output.shape
    except Exception:
        shape = "?"
    print(i, layer.name, type(layer).__name__, shape)

    # If a layer is itself a model (the MobileNetV2 base), show its last layers
    if isinstance(layer, tf.keras.Model):
        print("   inside", layer.name, "- last 6 layers:")
        for inner in layer.layers[-6:]:
            try:
                s = inner.output.shape
            except Exception:
                s = "?"
            print("     ", inner.name, type(inner).__name__, s)