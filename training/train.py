"""
Model Training Script for Food Recognition.
Performs transfer learning fine-tuning on MobileNetV3-Small.
Trains on processed dataset splits, tracks train/val loss & accuracy,
and saves the best model checkpoint to backend/models/saved_weights/food_classifier.pt.
"""

import os
import sys
import time
import json
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
WEIGHTS_DIR = BASE_DIR / "backend" / "models" / "saved_weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
BEST_MODEL_PATH = WEIGHTS_DIR / "food_classifier.pt"
HISTORY_PATH = BASE_DIR / "training" / "training_history.json"
CLASS_MAPPING_FILE = BASE_DIR / "datasets" / "class_mapping.json"

# Hyperparameters
BATCH_SIZE = 16
NUM_EPOCHS = 15
LEARNING_RATE_HEAD = 1e-3
LEARNING_RATE_BACKBONE = 1e-4
WEIGHT_DECAY = 1e-4
DEVICE = torch.device("cpu")  # Designed explicitly for CPU evaluation and COA profiling

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_dataloaders():
    train_dir = PROCESSED_DIR / "train"
    val_dir = PROCESSED_DIR / "val"

    train_transforms = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    val_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transforms)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transforms)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    return train_loader, val_loader, train_dataset.classes


def build_model(num_classes):
    print("Initializing MobileNetV3-Small backbone with pretrained ImageNet weights...")
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)

    # Freeze earlier feature extractor layers for stable transfer learning
    for param in model.features[:8].parameters():
        param.requires_grad = False

    # Unfreeze later layers for fine-tuning
    for param in model.features[8:].parameters():
        param.requires_grad = True

    # Replace classifier head
    in_features = model.classifier[0].in_features  # 576 in mobilenet_v3_small
    # mobilenet_v3_small classifier: Sequential(Linear(576, 1024), Hardswish, Dropout, Linear(1024, num_classes))
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 1024),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(1024, num_classes),
    )
    return model


def train_model():
    print("=" * 65)
    print("Starting Model Training & Fine-Tuning Pipeline")
    print(f"Device: {DEVICE} | Epochs: {NUM_EPOCHS} | Batch Size: {BATCH_SIZE}")
    print("=" * 65)

    train_loader, val_loader, class_names = get_dataloaders()
    num_classes = len(class_names)
    print(f"Number of classes: {num_classes} -> {class_names}")

    model = build_model(num_classes).to(DEVICE)

    # Optimizer with differential learning rates: lower for backbone, higher for head
    backbone_params = [p for p in model.features.parameters() if p.requires_grad]
    head_params = [p for p in model.classifier.parameters() if p.requires_grad]

    optimizer = optim.AdamW([
        {"params": backbone_params, "lr": LEARNING_RATE_BACKBONE, "weight_decay": WEIGHT_DECAY},
        {"params": head_params, "lr": LEARNING_RATE_HEAD, "weight_decay": WEIGHT_DECAY},
    ])

    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-5)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)

    best_val_acc = 0.0
    best_val_loss = float("inf")
    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "epochs": [],
        "training_time_s": 0,
        "classes": class_names,
    }

    start_time = time.time()

    for epoch in range(1, NUM_EPOCHS + 1):
        epoch_start = time.time()

        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += images.size(0)

        scheduler.step()

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += images.size(0)

        epoch_train_loss = train_loss / train_total
        epoch_train_acc = train_correct / train_total
        epoch_val_loss = val_loss / val_total
        epoch_val_acc = val_correct / val_total
        epoch_elapsed = time.time() - epoch_start

        history["epochs"].append(epoch)
        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 4))

        print(
            f"Epoch [{epoch:02d}/{NUM_EPOCHS:02d}] ({epoch_elapsed:.1f}s) | "
            f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc * 100:.1f}% | "
            f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc * 100:.1f}%"
        )

        # Save checkpoint if best validation accuracy or loss improves
        if epoch_val_acc > best_val_acc or (epoch_val_acc == best_val_acc and epoch_val_loss < best_val_loss):
            best_val_acc = epoch_val_acc
            best_val_loss = epoch_val_loss
            print(f"  --> Saved new best checkpoint! Val Acc: {best_val_acc * 100:.1f}%, Val Loss: {best_val_loss:.4f}")
            checkpoint = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": best_val_acc,
                "val_loss": best_val_loss,
                "classes": class_names,
                "architecture": "MobileNetV3-Small",
            }
            torch.save(checkpoint, BEST_MODEL_PATH)

    total_training_time = time.time() - start_time
    history["training_time_s"] = round(total_training_time, 2)
    history["best_val_acc"] = round(best_val_acc, 4)
    history["best_val_loss"] = round(best_val_loss, 4)

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print("\n" + "=" * 65)
    print(f"Training successfully completed in {total_training_time:.1f}s!")
    print(f"Best Validation Accuracy: {best_val_acc * 100:.1f}%")
    print(f"Best Model Weights saved to: {BEST_MODEL_PATH}")
    print(f"Training History saved to: {HISTORY_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    train_model()
