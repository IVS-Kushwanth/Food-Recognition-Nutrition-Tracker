# Model Evaluation Report

## Executive Summary
- **Architecture**: MobileNetV3-Small (Fine-tuned Transfer Learning)
- **Target Classes**: 12 categories (Food-101 benchmarks + Indian cuisine)
- **Test Samples**: 36 unseen images (held out from training and validation)
- **Top-1 Accuracy**: **63.89%**
- **Top-5 Accuracy**: **91.67%**
- **Macro F1-Score**: **62.28%**
- **Weighted F1-Score**: **62.28%**
- **Mean CPU Inference Latency**: **16.19 ms** (std: 3.75 ms, p95: 19.06 ms)

## Per-Class Breakdown
| Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| `burger` | 66.7% | 66.7% | 66.7% | 3 |
| `caesar_salad` | 66.7% | 66.7% | 66.7% | 3 |
| `chapati` | 100.0% | 33.3% | 50.0% | 3 |
| `chicken_biryani` | 60.0% | 100.0% | 75.0% | 3 |
| `chole_bhature` | 50.0% | 100.0% | 66.7% | 3 |
| `dal_makhani` | 66.7% | 66.7% | 66.7% | 3 |
| `dosa` | 100.0% | 66.7% | 80.0% | 3 |
| `fried_rice` | 66.7% | 66.7% | 66.7% | 3 |
| `idli` | 33.3% | 33.3% | 33.3% | 3 |
| `paneer_tikka` | 50.0% | 33.3% | 40.0% | 3 |
| `pizza` | 75.0% | 100.0% | 85.7% | 3 |
| `samosa` | 100.0% | 33.3% | 50.0% | 3 |

## Macro & Weighted Averages
- **Macro Precision**: 69.58%
- **Macro Recall**: 63.89%
- **Macro F1-Score**: 62.28%
- **Weighted Precision**: 69.58%
- **Weighted Recall**: 63.89%
- **Weighted F1-Score**: 62.28%

## CPU Inference Speed & Memory Hierarchy Relevance
- **Mean Single-Image Latency**: 16.19 ms
- **Median (p50)**: 15.19 ms
- **95th Percentile (p95)**: 19.06 ms
- **Model Resident Memory**: ~15 MB RAM resident (loaded once on backend startup)

## Confusion Matrix
The confusion matrix plot has been generated and saved to:
`documentation/confusion_matrix.png`
