"""
transformer_forecast.py
========================
Standalone Transformer-based time series forecasting module.
Tidak menyentuh file lain sama sekali — cukup di-import dari app.py.

Arsitektur:
  - Vanilla Transformer Encoder (PyTorch) dengan positional encoding
  - Input  : window N bulan terakhir  → prediksi M bulan ke depan
  - Output : dict berisi forecast values + confidence interval (±1 std via MC Dropout)

Dependensi tambahan: torch  (pip install torch --index-url https://download.pytorch.org/whl/cpu)
Jika torch tidak tersedia, modul fall back ke Exponential Smoothing (statsmodels/manual).
"""

from __future__ import annotations
import math
import json
import hashlib
import os
import time
from typing import List, Dict, Any

import numpy as np

# ── Optional: PyTorch ─────────────────────────────────────────────────────────
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# ── Optional: statsmodels (fallback) ─────────────────────────────────────────
try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False


# =============================================================================
#  POSITIONAL ENCODING
# =============================================================================

class PositionalEncoding(nn.Module):
    """Standard sinusoidal positional encoding."""

    def __init__(self, d_model: int, max_len: int = 512, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))  # (1, max_len, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq, d_model)
        x = x + self.pe[:, : x.size(1)]
        return self.dropout(x)


# =============================================================================
#  TRANSFORMER FORECASTER MODEL
# =============================================================================

class TransformerForecaster(nn.Module):
    """
    Time-series Transformer Encoder untuk forecasting univariat.

    Input  : (batch, seq_len, 1)   — nilai historis yang sudah dinormalisasi
    Output : (batch, horizon)      — prediksi H langkah ke depan
    """

    def __init__(
        self,
        seq_len: int = 12,
        horizon: int = 3,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        dim_ff: int = 128,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.seq_len = seq_len
        self.horizon = horizon
        self.d_model = d_model

        self.input_proj = nn.Linear(1, d_model)
        self.pos_enc    = PositionalEncoding(d_model, max_len=seq_len + 1, dropout=dropout)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_ff,
            dropout=dropout,
            batch_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.head    = nn.Linear(d_model, horizon)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq, 1)
        x = self.input_proj(x)          # → (batch, seq, d_model)
        x = self.pos_enc(x)
        x = self.encoder(x)             # → (batch, seq, d_model)
        x = x[:, -1, :]                 # ambil token terakhir
        return self.head(x)             # → (batch, horizon)


# =============================================================================
#  TRAINING HELPER
# =============================================================================

def _make_windows(series: np.ndarray, seq_len: int, horizon: int):
    """Buat sliding-window dataset dari series 1-D."""
    X, y = [], []
    for i in range(len(series) - seq_len - horizon + 1):
        X.append(series[i : i + seq_len])
        y.append(series[i + seq_len : i + seq_len + horizon])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def _train_transformer(
    values: List[float],
    seq_len: int = 12,
    horizon: int = 3,
    epochs: int = 300,
    lr: float = 1e-3,
) -> TransformerForecaster:
    """Latih model dari awal menggunakan data historis."""
    arr = np.array(values, dtype=np.float32)

    # Normalisasi min-max
    vmin, vmax = arr.min(), arr.max()
    eps = 1e-8
    arr_norm = (arr - vmin) / (vmax - vmin + eps)

    X, y = _make_windows(arr_norm, seq_len, horizon)
    if len(X) == 0:
        raise ValueError(
            f"Data terlalu pendek. Butuh minimal {seq_len + horizon} titik, "
            f"tersedia {len(values)}."
        )

    X_t = torch.tensor(X).unsqueeze(-1)  # (N, seq, 1)
    y_t = torch.tensor(y)                # (N, horizon)

    model = TransformerForecaster(seq_len=seq_len, horizon=horizon)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn   = nn.HuberLoss()

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        pred = model(X_t)
        loss = loss_fn(pred, y_t)
        loss.backward()
        optimizer.step()

    return model, vmin, vmax, eps


# =============================================================================
#  INFERENCE — MC DROPOUT CONFIDENCE INTERVAL
# =============================================================================

def _predict_with_uncertainty(
    model: TransformerForecaster,
    last_window: np.ndarray,
    vmin: float,
    vmax: float,
    eps: float,
    n_samples: int = 50,
) -> Dict[str, Any]:
    """
    MC Dropout: jalankan forward pass N kali dengan dropout aktif
    untuk mendapatkan mean + std sebagai confidence interval.
    """
    model.train()  # dropout aktif
    norm_win = (last_window - vmin) / (vmax - vmin + eps)
    x = torch.tensor(norm_win, dtype=torch.float32).unsqueeze(0).unsqueeze(-1)

    preds = []
    with torch.no_grad():
        for _ in range(n_samples):
            out = model(x).squeeze(0).numpy()
            preds.append(out)

    preds  = np.array(preds)           # (n_samples, horizon)
    mean   = preds.mean(axis=0)
    std    = preds.std(axis=0)

    # Denormalisasi
    def denorm(v):
        return float(v * (vmax - vmin + eps) + vmin)

    return {
        "mean": [denorm(m) for m in mean],
        "lower": [denorm(m - std[i]) for i, m in enumerate(mean)],
        "upper": [denorm(m + std[i]) for i, m in enumerate(mean)],
    }


# =============================================================================
#  FALLBACK — Exponential Smoothing / simple heuristic
# =============================================================================

def _fallback_forecast(values: List[float], horizon: int = 3) -> Dict[str, Any]:
    """Fallback kalau PyTorch tidak tersedia."""
    arr = np.array(values, dtype=np.float64)

    if STATSMODELS_AVAILABLE and len(arr) >= 6:
        try:
            model = ExponentialSmoothing(
                arr, trend="add", seasonal=None, initialization_method="estimated"
            ).fit(optimized=True, disp=False)
            fc = model.forecast(horizon)
            std_est = np.std(arr[-6:]) * 0.5
            return {
                "mean":  [float(v) for v in fc],
                "lower": [float(v - std_est) for v in fc],
                "upper": [float(v + std_est) for v in fc],
                "method": "ExponentialSmoothing (fallback)",
            }
        except Exception:
            pass

    # Heuristic terakhir: rata-rata 3 bulan terakhir
    last3 = arr[-3:].mean()
    trend  = (arr[-1] - arr[-min(3, len(arr))]) / max(min(3, len(arr)), 1)
    fc     = [last3 + trend * (i + 1) for i in range(horizon)]
    std_est = np.std(arr[-3:]) if len(arr) >= 3 else last3 * 0.1
    return {
        "mean":  [float(v) for v in fc],
        "lower": [float(v - std_est) for v in fc],
        "upper": [float(v + std_est) for v in fc],
        "method": "MovingAverage+Trend (fallback)",
    }


# =============================================================================
#  PUBLIC API
# =============================================================================

# Cache sederhana in-memory agar tidak re-train setiap request
_CACHE: Dict[str, Any] = {}
_CACHE_TTL = 300  # detik


def run_transformer_forecast(
    values: List[float],
    horizon: int = 3,
    seq_len: int = 12,
    epochs: int = 300,
    force_retrain: bool = False,
) -> Dict[str, Any]:
    """
    Entry point utama.

    Parameters
    ----------
    values       : list nilai historis (bulanan, sudah diurutkan ascending)
    horizon      : berapa bulan ke depan yang diprediksi
    seq_len      : panjang window konteks Transformer
    epochs       : jumlah epoch training
    force_retrain: paksa retrain meski ada cache

    Returns
    -------
    {
        "method"  : str,          # "Transformer" atau fallback
        "horizon" : int,
        "forecast": [             # list sepanjang horizon
            {
                "step" : int,     # 1-indexed
                "mean" : float,
                "lower": float,   # CI bawah
                "upper": float,   # CI atas
            }, ...
        ],
        "model_info": { ... },    # metadata
        "error": str | None,
    }
    """

    # ── Cache key ─────────────────────────────────────────────────────────────
    cache_key = hashlib.md5(
        json.dumps({"values": values, "horizon": horizon, "seq_len": seq_len}).encode()
    ).hexdigest()

    now = time.time()
    if not force_retrain and cache_key in _CACHE:
        entry = _CACHE[cache_key]
        if now - entry["ts"] < _CACHE_TTL:
            return entry["result"]

    # ── Validasi panjang data ─────────────────────────────────────────────────
    min_points = seq_len + horizon
    if len(values) < min_points:
        # Kurangi seq_len supaya bisa tetap jalan
        seq_len = max(2, len(values) - horizon)

    # ── Training / inference ──────────────────────────────────────────────────
    method = "Transformer (PyTorch)"
    error  = None

    if TORCH_AVAILABLE and len(values) >= (seq_len + horizon):
        try:
            t0 = time.time()
            model, vmin, vmax, eps = _train_transformer(
                values, seq_len=seq_len, horizon=horizon, epochs=epochs
            )
            last_window = np.array(values[-seq_len:], dtype=np.float32)
            pred = _predict_with_uncertainty(model, last_window, vmin, vmax, eps)
            elapsed = round(time.time() - t0, 2)
        except Exception as e:
            error  = str(e)
            method = "Fallback"
            pred   = _fallback_forecast(values, horizon)
            elapsed = 0
    else:
        if not TORCH_AVAILABLE:
            method = "ExponentialSmoothing/MovingAverage (PyTorch tidak tersedia)"
        pred    = _fallback_forecast(values, horizon)
        elapsed = 0

    # ── Susun output ──────────────────────────────────────────────────────────
    forecast_steps = []
    for i in range(horizon):
        forecast_steps.append({
            "step" : i + 1,
            "mean" : round(pred["mean"][i], 2),
            "lower": round(max(0, pred["lower"][i]), 2),
            "upper": round(pred["upper"][i], 2),
        })

    result = {
        "method"   : method,
        "horizon"  : horizon,
        "forecast" : forecast_steps,
        "model_info": {
            "seq_len"       : seq_len,
            "epochs"        : epochs if TORCH_AVAILABLE else 0,
            "train_seconds" : elapsed if TORCH_AVAILABLE else 0,
            "data_points"   : len(values),
            "torch_available": TORCH_AVAILABLE,
        },
        "error": error,
    }

    _CACHE[cache_key] = {"ts": now, "result": result}
    return result