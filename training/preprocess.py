"""
Dataset Preprocessing and Split Pipeline for Food Recognition.
Splits data into train (70%), validation (15%), and test (15%) splits
with strict separation to prevent data leakage.
Applies standard ImageNet normalization and augmentation pipeline.
"""

import os
import shutil
import random
import json
from pathlib import Path
from torchvision import transforms
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
CLASS_MAPPING_FILE = BASE_DIR / "datasets" / "class_mapping.json"

RANDOM_SEED = 42

# ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Data augmentation for training to prevent overfitting on small/medium datasets
train_transforms = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# Deterministic transforms for validation, test, and inference
val_test_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def prepare_dataset_splits(train_ratio=0.70, val_ratio=0.15, test_ratio=0.15):
    """
    Reads from datasets/raw, splits images per class, and organizes
    into datasets/processed/{train, val, test}.
    """
    random.seed(RANDOM_SEED)

    if PROCESSED_DIR.exists():
        for item in PROCESSED_DIR.iterdir():
            if item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
            else:
                try:
                    item.unlink()
                except Exception:
                    pass
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    train_dir = PROCESSED_DIR / "train"
    val_dir = PROCESSED_DIR / "val"
    test_dir = PROCESSED_DIR / "test"

    for d in [train_dir, val_dir, test_dir]:
        d.mkdir(parents=True, exist_ok=True)

    class_dirs = sorted([d for d in RAW_DIR.iterdir() if d.is_dir()])
    class_names = [d.name for d in class_dirs]

    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    idx_to_class = {idx: name for idx, name in enumerate(class_names)}

    split_stats = {"train": {}, "val": {}, "test": {}}

    for class_path in class_dirs:
        class_name = class_path.name
        images = sorted(list(class_path.glob("*.jpg")) + list(class_path.glob("*.png")))
        random.shuffle(images)

        n = len(images)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        # Ensure at least 1 image in val and test
        if n_val == 0 and n > 2:
            n_val = 1
        n_test = n - n_train - n_val

        train_imgs = images[:n_train]
        val_imgs = images[n_train:n_train + n_val]
        test_imgs = images[n_train + n_val:]

        for split_name, img_list, target_base in [
            ("train", train_imgs, train_dir),
            ("val", val_imgs, val_dir),
            ("test", test_imgs, test_dir),
        ]:
            dest_dir = target_base / class_name
            dest_dir.mkdir(parents=True, exist_ok=True)
            for img in img_list:
                shutil.copy2(img, dest_dir / img.name)
            split_stats[split_name][class_name] = len(img_list)

    # Save class mappings
    mapping_data = {
        "classes": class_names,
        "class_to_idx": class_to_idx,
        "idx_to_class": {str(k): v for k, v in idx_to_class.items()},
        "split_stats": split_stats,
    }

    with open(CLASS_MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping_data, f, indent=2)

    print("=" * 60)
    print("Dataset Split Completed Successfully!")
    print(f"Total Classes: {len(class_names)}")
    print(f"Train images: {sum(split_stats['train'].values())}")
    print(f"Val images:   {sum(split_stats['val'].values())}")
    print(f"Test images:  {sum(split_stats['test'].values())}")
    print(f"Class mapping saved to: {CLASS_MAPPING_FILE}")
    print("=" * 60)
    return mapping_data


if __name__ == "__main__":
    prepare_dataset_splits()
