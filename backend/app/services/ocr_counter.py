import cv2
import numpy as np
import easyocr
import json
import os
from typing import Optional, Dict, List, Tuple
from pathlib import Path


class CounterOCR:
    def __init__(self, calibration_dir: str = "./pdfs/calibration"):
        self.reader = easyocr.Reader(['en'], gpu=False)
        self.calibration_dir = calibration_dir
        os.makedirs(calibration_dir, exist_ok=True)

    def preprocess_image(
        self,
        image_path: str,
        region: Optional[Dict] = None,
        brightness: int = 0,
        contrast: int = 2,
        threshold: int = 128
    ) -> np.ndarray:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"No se pudo cargar la imagen: {image_path}")

        if region:
            x, y, w, h = region['x'], region['y'], region['width'], region['height']
            img = img[y:y+h, x:x+w]

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        alpha = contrast / 2.0
        beta = brightness
        adjusted = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)

        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(adjusted)

        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)

        _, binary = cv2.threshold(blurred, threshold, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        return cleaned

    def read_counter(
        self,
        image_path: str,
        region: Optional[Dict] = None,
        brightness: int = 0,
        contrast: int = 2,
        threshold: int = 128
    ) -> Dict:
        preprocessed = self.preprocess_image(image_path, region, brightness, contrast, threshold)

        temp_path = "temp_counter.jpg"
        cv2.imwrite(temp_path, preprocessed)

        results = self.reader.readtext(temp_path)

        numbers = []
        all_text = []
        for (bbox, text, prob) in results:
            all_text.append({"text": text, "confidence": prob})
            if prob > 0.3:
                clean = ''.join(c for c in text if c.isdigit() or c == '.')
                if clean:
                    numbers.append(clean)

        os.remove(temp_path)

        full_reading = ''.join(numbers)

        kwh_value = None
        if full_reading:
            try:
                if '.' in full_reading:
                    kwh_value = float(full_reading)
                else:
                    kwh_value = float(full_reading)
            except ValueError:
                kwh_value = None

        avg_confidence = 0
        if results:
            avg_confidence = sum(r[2] for r in results) / len(results)

        return {
            "reading_kwh": kwh_value,
            "raw_text": numbers,
            "all_detections": all_text,
            "confidence": round(avg_confidence, 3),
        }

    def calibrate(
        self,
        image_path: str,
        expected_reading: float,
        user_region: Optional[Dict] = None
    ) -> Dict:
        best_result = None
        best_score = -1
        best_params = {}

        brightness_range = [-10, 0, 10, 20]
        contrast_range = [1.5, 2.0, 2.5, 3.0]
        threshold_range = [100, 128, 150, 180]

        for brightness in brightness_range:
            for contrast in contrast_range:
                for threshold in threshold_range:
                    try:
                        result = self.read_counter(
                            image_path,
                            user_region,
                            brightness,
                            int(contrast * 2),
                            threshold
                        )

                        if result["reading_kwh"] is not None:
                            diff = abs(result["reading_kwh"] - expected_reading)
                            score = result["confidence"] * 100 - diff * 10

                            if score > best_score:
                                best_score = score
                                best_result = result
                                best_params = {
                                    "brightness": brightness,
                                    "contrast": int(contrast * 2),
                                    "threshold": threshold,
                                    "region": user_region
                                }
                    except Exception:
                        continue

        calibration_data = {
            "success": best_result is not None and best_result["reading_kwh"] == expected_reading,
            "detected_reading": best_result["reading_kwh"] if best_result else None,
            "expected_reading": expected_reading,
            "best_params": best_params,
            "confidence": best_result["confidence"] if best_result else 0,
            "error": abs(best_result["reading_kwh"] - expected_reading) if best_result and best_result["reading_kwh"] else None
        }

        return calibration_data

    def save_calibration(self, client_id: int, calibration_data: Dict, image_path: str):
        cal_file = os.path.join(self.calibration_dir, f"client_{client_id}_calibration.json")

        data = {
            "client_id": client_id,
            "image_path": image_path,
            "params": calibration_data["best_params"],
            "expected": calibration_data["expected_reading"],
            "detected": calibration_data["detected_reading"],
            "success": calibration_data["success"]
        }

        with open(cal_file, 'w') as f:
            json.dump(data, f, indent=2)

        return cal_file

    def load_calibration(self, client_id: int) -> Optional[Dict]:
        cal_file = os.path.join(self.calibration_dir, f"client_{client_id}_calibration.json")

        if os.path.exists(cal_file):
            with open(cal_file, 'r') as f:
                return json.load(f)
        return None

    def read_with_calibration(self, client_id: int, image_path: str) -> Dict:
        calibration = self.load_calibration(client_id)

        if calibration and calibration.get("success"):
            params = calibration["params"]
            return self.read_counter(
                image_path,
                params.get("region"),
                params.get("brightness", 0),
                params.get("contrast", 2),
                params.get("threshold", 128)
            )

        return self.read_counter(image_path)

    def detect_display_region(self, image_path: str) -> Optional[Dict]:
        img = cv2.imread(image_path)
        if img is None:
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        edges = cv2.Canny(gray, 50, 150)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_rect = None
        best_area = 0

        h, w = img.shape[:2]
        min_area = (h * w) * 0.02
        max_area = (h * w) * 0.3

        for contour in contours:
            x, y, cw, ch = cv2.boundingRect(contour)
            area = cw * ch

            if min_area < area < max_area:
                aspect_ratio = cw / ch if ch > 0 else 0
                if 1.5 < aspect_ratio < 5.0:
                    if area > best_area:
                        best_area = area
                        best_rect = {"x": x, "y": y, "width": cw, "height": ch}

        return best_rect


ocr_instance = CounterOCR()
