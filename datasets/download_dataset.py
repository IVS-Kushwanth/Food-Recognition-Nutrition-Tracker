"""
Food Recognition & Nutrition Tracker - Dataset Acquisition Script
Downloads real, verified food images from Wikimedia Commons / official public archives.
Uses official CDN thumbnail URLs (640px) compliant with Wikimedia rate policies.
"""

import os
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
METADATA_FILE = BASE_DIR / "metadata.json"

FOOD_CLASSES = {
    "chicken_biryani": {
        "display_name": "Chicken Biryani",
        "search_queries": ["Chicken Biryani", "Biryani rice dish", "Hyderabadi Biryani"],
        "category": "Main Course",
        "cuisine": "Indian",
        "target_count": 16,
    },
    "dosa": {
        "display_name": "Masala Dosa",
        "search_queries": ["Masala dosa", "Dosa sambar chutney", "Crispy dosa"],
        "category": "Breakfast / Main",
        "cuisine": "South Indian",
        "target_count": 16,
    },
    "idli": {
        "display_name": "Idli Sambar",
        "search_queries": ["Idli sambar", "Steamed idli", "Idli chutney"],
        "category": "Breakfast",
        "cuisine": "South Indian",
        "target_count": 16,
    },
    "chapati": {
        "display_name": "Chapati / Roti",
        "search_queries": ["Chapati flatbread", "Indian Roti", "Phulka bread"],
        "category": "Bread / Staple",
        "cuisine": "Indian",
        "target_count": 16,
    },
    "dal_makhani": {
        "display_name": "Dal Makhani",
        "search_queries": ["Dal makhani", "Maa ki dal", "Black lentil dal"],
        "category": "Curry / Lentils",
        "cuisine": "North Indian",
        "target_count": 16,
    },
    "paneer_tikka": {
        "display_name": "Paneer Tikka",
        "search_queries": ["Paneer tikka", "Tandoori paneer", "Paneer skewers"],
        "category": "Appetizer / Snack",
        "cuisine": "North Indian",
        "target_count": 16,
    },
    "samosa": {
        "display_name": "Samosa",
        "search_queries": ["Samosa chutney", "Potato samosa", "Indian samosa"],
        "category": "Snack",
        "cuisine": "Indian",
        "target_count": 16,
    },
    "chole_bhature": {
        "display_name": "Chole Bhature",
        "search_queries": ["Chole bhature", "Chana bhatura", "Puri chole"],
        "category": "Main Course",
        "cuisine": "North Indian",
        "target_count": 16,
    },
    "pizza": {
        "display_name": "Pizza",
        "search_queries": ["Pizza Margherita", "Pepperoni pizza", "Cheese pizza"],
        "category": "Fast Food",
        "cuisine": "Italian / Global",
        "target_count": 16,
    },
    "burger": {
        "display_name": "Hamburger",
        "search_queries": ["Cheeseburger", "Hamburger bun", "Beef burger"],
        "category": "Fast Food",
        "cuisine": "American / Global",
        "target_count": 16,
    },
    "caesar_salad": {
        "display_name": "Caesar Salad",
        "search_queries": ["Caesar salad", "Salad croutons parmesan", "Chicken caesar"],
        "category": "Salad",
        "cuisine": "Global",
        "target_count": 16,
    },
    "fried_rice": {
        "display_name": "Fried Rice",
        "search_queries": ["Fried rice dish", "Egg fried rice", "Vegetable fried rice"],
        "category": "Rice Dish",
        "cuisine": "Asian / Global",
        "target_count": 16,
    },
}

USER_AGENT = "FoodRecognitionResearchBot/1.0 (academic research; student@university.edu)"


def fetch_wikimedia_images(query: str, max_results: int = 16):
    """Query Wikimedia Commons API using iiurlwidth=640 for CDN-cached thumbnails."""
    endpoint = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(max_results * 2),
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "640",
        "format": "json",
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        results = []
        for pid, p in pages.items():
            infos = p.get("imageinfo", [])
            if not infos:
                continue
            info = infos[0]
            thumb_url = info.get("thumburl") or info.get("url")
            width = info.get("thumbwidth", info.get("width", 0))
            height = info.get("thumbheight", info.get("height", 0))

            if thumb_url and width >= 200 and height >= 200:
                meta = info.get("extmetadata", {})
                license_name = meta.get("LicenseShortName", {}).get("value", "Creative Commons / Public Domain")
                artist = meta.get("Artist", {}).get("value", "Wikimedia Contributor")
                results.append({
                    "title": p.get("title", ""),
                    "url": thumb_url,
                    "original_url": info.get("url", ""),
                    "width": width,
                    "height": height,
                    "license": license_name,
                    "author": str(artist)[:100],
                })
        return results
    except Exception as e:
        print(f"Error querying Wikimedia Commons for '{query}': {e}")
        return []


def download_image(url: str, out_path: Path):
    """Downloads and verifies an image file using Pillow."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    tmp_path = out_path.with_suffix(".tmp")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
        
        with open(tmp_path, "wb") as f:
            f.write(content)
        
        with Image.open(tmp_path) as img:
            rgb_img = img.convert("RGB")
            # Verify minimum dimensions
            if rgb_img.width < 150 or rgb_img.height < 150:
                raise ValueError("Image too small")
            rgb_img.save(out_path, format="JPEG", quality=90)
        
        if tmp_path.exists():
            tmp_path.unlink()
        return True
    except Exception as e:
        if tmp_path.exists():
            tmp_path.unlink()
        if out_path.exists():
            out_path.unlink()
        return False


def main():
    print("=" * 60)
    print("Food Recognition Dataset Downloader (Wikimedia Official CDN)")
    print("Target Classes:", len(FOOD_CLASSES))
    print("=" * 60)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    all_metadata = {}
    total_downloaded = 0

    for class_key, class_info in FOOD_CLASSES.items():
        class_dir = RAW_DIR / class_key
        class_dir.mkdir(parents=True, exist_ok=True)
        target = class_info["target_count"]

        existing = list(class_dir.glob("*.jpg"))
        if len(existing) >= target:
            print(f"[{class_key}] Already has {len(existing)} images. Skipping.")
            total_downloaded += len(existing)
            continue

        print(f"\n---> Fetching images for '{class_info['display_name']}' ({class_key})...")
        downloaded_count = len(existing)
        class_meta = []
        seen_urls = set()

        for query in class_info["search_queries"]:
            if downloaded_count >= target:
                break
            print(f"  Searching: '{query}'")
            candidates = fetch_wikimedia_images(query, max_results=target)
            for cand in candidates:
                if cand["url"] in seen_urls:
                    continue
                seen_urls.add(cand["url"])

                out_file = class_dir / f"{class_key}_{downloaded_count + 1:03d}.jpg"
                success = download_image(cand["url"], out_file)
                if success:
                    downloaded_count += 1
                    cand["filename"] = out_file.name
                    class_meta.append(cand)
                    print(f"    Saved [{downloaded_count}/{target}]: {out_file.name}")
                    time.sleep(0.2)
                if downloaded_count >= target:
                    break

        all_metadata[class_key] = {
            "display_name": class_info["display_name"],
            "category": class_info["category"],
            "cuisine": class_info["cuisine"],
            "image_count": downloaded_count,
            "images": class_meta,
        }
        total_downloaded += downloaded_count
        print(f"[{class_key}] Total saved: {downloaded_count} images.")

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Dataset acquisition completed! Total images across all classes: {total_downloaded}")
    print(f"Metadata recorded at: {METADATA_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
