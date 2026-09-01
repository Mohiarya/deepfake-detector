"""
MesoNet (Meso4 architecture) — a compact CNN for detecting face-forgery
artifacts, from:

  Afchar, D., Nozick, V., Yamagishi, J., & Echizen, I. (2018).
  "MesoNet: a Compact Facial Video Forgery Detection Network."
  IEEE WIFS 2018. https://arxiv.org/abs/1809.00888

Architecture and pretrained weights (mesonet_weights/Meso4_DF.h5) are from
the authors' official repo (https://github.com/DariusAf/MesoNet, Apache 2.0
license — see mesonet_weights/MESONET_LICENSE and MESONET_NOTICE), reused
here rather than reimplemented from memory: getting a single layer shape
wrong would silently corrupt how the pretrained weights load, with no
error — using their exact code avoids that entire risk.

This module ONLY loads the model and runs inference. It says nothing about
how accurate the model actually is — that requires a real evaluation
against a labeled dataset (a separate, later step), not a claim made here.
"""

from pathlib import Path

import cv2
import numpy as np
from tensorflow.keras.layers import (
    BatchNormalization,
    Conv2D,
    Dense,
    Dropout,
    Flatten,
    Input,
    LeakyReLU,
    MaxPooling2D,
)
from tensorflow.keras.models import Model as KerasModel
from tensorflow.keras.optimizers import Adam

IMG_WIDTH = 256
WEIGHTS_PATH = Path(__file__).parent / "mesonet_weights" / "Meso4_DF.h5"


def _build_meso4():
    """Reproduces the Meso4 architecture exactly, so the pretrained weights
    (trained against this precise layer structure) load correctly."""
    x = Input(shape=(IMG_WIDTH, IMG_WIDTH, 3))

    x1 = Conv2D(8, (3, 3), padding="same", activation="relu")(x)
    x1 = BatchNormalization()(x1)
    x1 = MaxPooling2D(pool_size=(2, 2), padding="same")(x1)

    x2 = Conv2D(8, (5, 5), padding="same", activation="relu")(x1)
    x2 = BatchNormalization()(x2)
    x2 = MaxPooling2D(pool_size=(2, 2), padding="same")(x2)

    x3 = Conv2D(16, (5, 5), padding="same", activation="relu")(x2)
    x3 = BatchNormalization()(x3)
    x3 = MaxPooling2D(pool_size=(2, 2), padding="same")(x3)

    x4 = Conv2D(16, (5, 5), padding="same", activation="relu")(x3)
    x4 = BatchNormalization()(x4)
    x4 = MaxPooling2D(pool_size=(4, 4), padding="same")(x4)

    y = Flatten()(x4)
    y = Dropout(0.5)(y)
    y = Dense(16)(y)
    y = LeakyReLU(negative_slope=0.1)(y)
    y = Dropout(0.5)(y)
    y = Dense(1, activation="sigmoid")(y)

    return KerasModel(inputs=x, outputs=y)


def load_model(weights_path: Path = WEIGHTS_PATH):
    """Builds the Meso4 architecture and loads the pretrained weights."""
    model = _build_meso4()
    model.compile(optimizer=Adam(learning_rate=0.001), loss="mean_squared_error", metrics=["accuracy"])
    model.load_weights(str(weights_path))
    return model


def preprocess(face_image: np.ndarray) -> np.ndarray:
    """
    Prepares a cropped face image (BGR, as produced by face_detector.py /
    cv2.imread) for MesoNet: resize to 256x256, convert to RGB (the model
    was trained on RGB images via Keras's ImageDataGenerator, which reads
    via PIL — feeding it BGR would silently swap color channels), scale
    pixel values to [0, 1], and add the batch dimension Keras expects.
    """
    rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (IMG_WIDTH, IMG_WIDTH))
    normalized = resized.astype("float32") / 255.0
    return np.expand_dims(normalized, axis=0)


def predict_real_probability(model, face_image: np.ndarray) -> float:
    """
    Returns a score in [0, 1]. Per the original training data layout
    (class "df" < class "real" alphabetically, per Keras's default label
    ordering), HIGHER means more likely real — verified empirically in
    verify_mesonet.py against the authors' own labeled sample images,
    not assumed from this reasoning alone.
    """
    batch = preprocess(face_image)
    return float(model.predict(batch, verbose=0)[0][0])
