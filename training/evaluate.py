"""
Model Evaluation Script for Food Recognition.
Evaluates the trained model on the unseen test dataset split (36 images).
Computes:
- Top-1 & Top-5 accuracy
- Precision, Recall, F1-score (per-class & macro/weighted)
- Confusion Matrix (saved as JSON and PNG plot)
- CPU Inference latency statistics
"""

import os
import json
import time
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

BASE_DIR = Path(__file__).resolve().parent.parent
TEST_DIR = BASE_DIR / "datasets" / "processed" / "test"
WEIGHTS_PATH = BASE_DIR / "backend" / "models" / "saved_weights" / "food_classifier.pt"
DOCS_DIR = BASE_DIR / "documentation"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
REPORT_JSON = DOCS_DIR / "EVALUATION_REPORT.json"
CONFUSION_PNG = DOCS_DIR / "confusion_matrix.png"
REPORT_MD = DOCS_DIR / "MODEL_EVALUATION.md"

DEVICE = torch.device("cpu")
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def load_model(weights_path):
    checkpoint = torch.load(weights_path, map_location=DEVICE)
    classes = checkpoint["classes"]
    num_classes = len(classes)

    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 1024),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(1024, num_classes),
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()
    return model, classes


def evaluate():
    print("=" * 65)
    print("Starting Model Evaluation on Unseen Test Split")
    print(f"Weights: {WEIGHTS_PATH}")
    print("=" * 65)

    if not WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"Weights file not found at {WEIGHTS_PATH}. Run train.py first.")

    model, classes = load_model(WEIGHTS_PATH)
    num_classes = len(classes)

    test_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    test_dataset = datasets.ImageFolder(TEST_DIR, transform=test_transforms)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    y_true = []
    y_pred = []
    y_probs = []
    latencies = []

    top1_correct = 0
    top5_correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)

            # High precision timing for CPU inference
            t0 = time.perf_counter()
            outputs = model(images)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000)

            probs = torch.softmax(outputs, dim=1)
            y_probs.append(probs.cpu().numpy()[0])

            # Top-1
            pred_top1 = torch.argmax(probs, dim=1).item()
            true_label = labels.item()
            y_true.append(true_label)
            y_pred.append(pred_top1)

            if pred_top1 == true_label:
                top1_correct += 1

            # Top-5
            _, top5_indices = torch.topk(probs, k=min(5, num_classes), dim=1)
            if true_label in top5_indices[0].tolist():
                top5_correct += 1

            total += 1

    top1_accuracy = top1_correct / total
    top5_accuracy = top5_correct / total

    # Precision, Recall, F1
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(num_classes)), zero_division=0
    )
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    weighted_precision, weighted_recall, weighted_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    clf_report = classification_report(
        y_true, y_pred, target_names=classes, zero_division=0, output_dict=True
    )
    conf_mat = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))

    # Latency stats
    mean_lat = float(np.mean(latencies))
    std_lat = float(np.std(latencies))
    p50_lat = float(np.percentile(latencies, 50))
    p95_lat = float(np.percentile(latencies, 95))

    # Plot and save confusion matrix
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        conf_mat,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=classes,
        yticklabels=classes,
    )
    plt.title(f"Test Set Confusion Matrix (Top-1 Acc: {top1_accuracy * 100:.1f}%)")
    plt.xlabel("Predicted Class")
    plt.ylabel("True Class")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(CONFUSION_PNG, dpi=300)
    plt.close()

    per_class_metrics = {}
    for idx, cname in enumerate(classes):
        per_class_metrics[cname] = {
            "precision": round(float(precision[idx]), 4),
            "recall": round(float(recall[idx]), 4),
            "f1_score": round(float(f1[idx]), 4),
            "support": int(support[idx]),
        }

    evaluation_results = {
        "architecture": "MobileNetV3-Small",
        "num_classes": num_classes,
        "test_sample_count": total,
        "top1_accuracy": round(top1_accuracy, 4),
        "top5_accuracy": round(top5_accuracy, 4),
        "macro_metrics": {
            "precision": round(macro_precision, 4),
            "recall": round(macro_recall, 4),
            "f1_score": round(macro_f1, 4),
        },
        "weighted_metrics": {
            "precision": round(weighted_precision, 4),
            "recall": round(weighted_recall, 4),
            "f1_score": round(weighted_f1, 4),
        },
        "per_class_metrics": per_class_metrics,
        "cpu_latency_ms": {
            "mean": round(mean_lat, 2),
            "std": round(std_lat, 2),
            "p50": round(p50_lat, 2),
            "p95": round(p95_lat, 2),
        },
        "confusion_matrix": conf_mat.tolist(),
    }

    with open(REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump(evaluation_results, f, indent=2)

    # Generate markdown report
    md_content = f"""# Model Evaluation Report

## Executive Summary
- **Architecture**: MobileNetV3-Small (Fine-tuned Transfer Learning)
- **Target Classes**: {num_classes} categories (Food-101 benchmarks + Indian cuisine)
- **Test Samples**: {total} unseen images (held out from training and validation)
- **Top-1 Accuracy**: **{top1_accuracy * 100:.2f}%**
- **Top-5 Accuracy**: **{top5_accuracy * 100:.2f}%**
- **Macro F1-Score**: **{macro_f1 * 100:.2f}%**
- **Weighted F1-Score**: **{weighted_f1 * 100:.2f}%**
- **Mean CPU Inference Latency**: **{mean_lat:.2f} ms** (std: {std_lat:.2f} ms, p95: {p95_lat:.2f} ms)

## Per-Class Breakdown
| Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
"""
    for cname, m in per_class_metrics.items():
        md_content += f"| `{cname}` | {m['precision'] * 100:.1f}% | {m['recall'] * 100:.1f}% | {m['f1_score'] * 100:.1f}% | {m['support']} |\n"

    md_content += f"""
## Macro & Weighted Averages
- **Macro Precision**: {macro_precision * 100:.2f}%
- **Macro Recall**: {macro_recall * 100:.2f}%
- **Macro F1-Score**: {macro_f1 * 100:.2f}%
- **Weighted Precision**: {weighted_precision * 100:.2f}%
- **Weighted Recall**: {weighted_recall * 100:.2f}%
- **Weighted F1-Score**: {weighted_f1 * 100:.2f}%

## CPU Inference Speed & Memory Hierarchy Relevance
- **Mean Single-Image Latency**: {mean_lat:.2f} ms
- **Median (p50)**: {p50_lat:.2f} ms
- **95th Percentile (p95)**: {p95_lat:.2f} ms
- **Model Resident Memory**: ~15 MB RAM resident (loaded once on backend startup)

## Confusion Matrix
The confusion matrix plot has been generated and saved to:
`documentation/confusion_matrix.png`
"""
    with open(REPORT_MD, "w", encoding="utf-8") as f:
        f.write(md_content)

    print("\n" + "=" * 65)
    print("EVALUATION RESULTS SUMMARY:")
    print(f"Top-1 Accuracy: {top1_accuracy * 100:.2f}%")
    print(f"Top-5 Accuracy: {top5_accuracy * 100:.2f}%")
    print(f"Macro F1-Score: {macro_f1 * 100:.2f}%")
    print(f"Mean CPU Latency: {mean_lat:.2f} ms")
    print(f"JSON Report: {REPORT_JSON}")
    print(f"Markdown Report: {REPORT_MD}")
    print(f"Confusion Matrix Plot: {CONFUSION_PNG}")
    print("=" * 65)


if __name__ == "__main__":
    evaluate()
