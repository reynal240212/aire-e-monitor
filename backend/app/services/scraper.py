# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import sys
import io
import time
import os
import glob
import logging
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

# Forzar stdout en UTF-8 para Windows (evita errores charmap)
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


COLOR_MAP = {
    "Amarillo": "yellow",
    "Naranja": "orange",
    "Marrón": "brown",
    "Morado": "purple",
    "Verde": "green",
    "Azul": "blue",
    "Rojo": "red",
    "Rosado": "pink",
    "Gris": "gray",
    "Negro": "black"
}

# Mapa de colores Tailwind/PrimeFlex → nombre español
TAILWIND_COLOR_MAP = {
    "red": "Rojo",
    "blue": "Azul",
    "yellow": "Amarillo",
    "green": "Verde",
    "purple": "Morado",
    "violet": "Morado",
    "indigo": "Morado",
    "orange": "Naranja",
    "pink": "Rosado",
    "rose": "Rosado",
    "gray": "Gris",
    "slate": "Gris",
    "zinc": "Gris",
    "black": "Negro",
    "brown": "Marrón",
    "amber": "Marrón",
    "teal": "Verde",
    "cyan": "Azul",
    "sky": "Azul",
    "lime": "Verde",
    "emerald": "Verde",
    "fuchsia": "Morado",
    "neutral": "Gris",
    "stone": "Marrón",
}


class AireScraper:
    def __init__(self, pdf_dir: str = "./pdfs"):
        self.pdf_dir = pdf_dir
        os.makedirs(pdf_dir, exist_ok=True)

        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")

        # Configurar descarga automática de PDFs
        prefs = {
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "download.default_directory": os.path.abspath(self.pdf_dir),
            "plugins.always_open_pdf_externally": True,
            "safebrowsing.enabled": False,
            "profile.managed_default_content_settings.popups": 0
        }
        chrome_options.add_experimental_option("prefs", prefs)

        try:
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
        except Exception as e:
            # Fallback: intentar sin service manager
            logger.warning(f"ChromeDriverManager falló ({e}), intentando con chromedriver del PATH...")
            self.driver = webdriver.Chrome(options=chrome_options)

        self.wait = WebDriverWait(self.driver, 20)

    def _wait_for_pdf_download(self, expected_filename: str, timeout: int = 15) -> Optional[str]:
        """Espera a que se descargue un PDF en la carpeta de descargas"""
        start_time = time.time()
        pdf_pattern = os.path.join(self.pdf_dir, "*.pdf")

        while time.time() - start_time < timeout:
            try:
                pdf_files = glob.glob(pdf_pattern)
                for pdf_file in pdf_files:
                    file_mtime = os.path.getmtime(pdf_file)
                    current_time = time.time()
                    if (current_time - file_mtime) < 30:
                        crdownload_file = pdf_file + ".crdownload"
                        if not os.path.exists(crdownload_file):
                            return pdf_file
                time.sleep(0.5)
            except Exception as e:
                logger.error(f"Error esperando PDF: {e}")
                time.sleep(0.5)

        return None

    def detect_captcha_color_from_element(self) -> str:
        """
        Detecta el color del CAPTCHA leyendo las clases CSS del ícono en la página de Air-E.
        El portal usa clases PrimeFlex como 'text-red-600', 'text-blue-500', etc.
        """
        try:
            # Buscar el div con clase .pi que contiene la figura de color
            icon_el = self.driver.find_element(By.CSS_SELECTOR, ".pi[class*='text-']")
            class_attr = icon_el.get_attribute("class")
            logger.info(f"Clases del ícono CAPTCHA: {class_attr}")

            color_class = None
            for token in class_attr.split():
                # Buscar clases text-<color>-<shade>
                if token.startswith("text-") and "-" in token[5:]:
                    color_class = token
                    break

            if not color_class:
                logger.warning("No se encontro clase de color en el icono")
                return "Azul"

            # Extraer el nombre base del color (e.g., "red" de "text-red-600")
            color_name = color_class.replace("text-", "").split("-")[0]
            result = TAILWIND_COLOR_MAP.get(color_name.lower(), "Azul")
            logger.info(f"Color detectado: {color_class} -> {result}")
            return result

        except Exception as e:
            logger.error(f"Error detectando color desde elemento: {e}")
            # Intento alternativo: leer el color del inline style
            try:
                icon_el = self.driver.find_element(By.CSS_SELECTOR, ".pi")
                style = self.driver.execute_script(
                    "return window.getComputedStyle(arguments[0]).color;", icon_el
                )
                logger.info(f"Color computed style: {style}")
                # Parsear rgb(r, g, b)
                if "rgb" in style:
                    parts = style.replace("rgb(", "").replace(")", "").split(",")
                    r, g, b = int(parts[0].strip()), int(parts[1].strip()), int(parts[2].strip())
                    return self._rgb_to_color_name(r, g, b)
            except Exception as e2:
                logger.error(f"Fallback de color también falló: {e2}")
            return "Azul"

    def _rgb_to_color_name(self, r: int, g: int, b: int) -> str:
        """Convierte valores RGB a nombre de color español aproximado."""
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        diff = max_c - min_c

        if diff < 30:
            if max_c < 80:
                return "Negro"
            elif max_c > 180:
                return "Gris"
            return "Gris"

        if r > g and r > b:
            if b > 100:
                return "Rosado"
            return "Rojo"
        elif g > r and g > b:
            return "Verde"
        elif b > r and b > g:
            return "Azul"
        elif r > 150 and g > 150 and b < 80:
            return "Amarillo"
        elif r > 150 and g < 100 and b > 150:
            return "Morado"
        elif r > 180 and g > 100 and b < 50:
            return "Naranja"
        return "Azul"

    def scrape_invoices(self, nic: str, captcha_color: Optional[str] = None) -> Dict:
        try:
            # Navegar al portal si aún no estamos ahí
            try:
                current_url = self.driver.current_url
            except Exception:
                current_url = ""

            if "consultatufactura.air-e.com" not in current_url:
                logger.info("Abriendo portal Air-E...")
                self.driver.get("https://consultatufactura.air-e.com/")
                time.sleep(3)

            # Ingresar el NIC
            nic_input = None
            for selector_type, selector_val in [
                (By.ID, "form:account"),
                (By.NAME, "form:account"),
                (By.CSS_SELECTOR, "input[type='text']"),
            ]:
                try:
                    nic_input = self.wait.until(
                        EC.presence_of_element_located((selector_type, selector_val))
                    )
                    break
                except Exception:
                    continue

            if not nic_input:
                self.driver.save_screenshot("debug_nic_field.png")
                return {
                    "success": False,
                    "error": "No se encontró el campo NIC. El sitio puede estar bloqueando acceso.",
                    "nic": nic
                }

            nic_input.clear()
            nic_input.send_keys(nic)
            time.sleep(1)

            # Detectar o usar el color del CAPTCHA
            if not captcha_color:
                captcha_color = self.detect_captcha_color_from_element()
            logger.info(f"Color CAPTCHA a usar: {captcha_color}")

            # Buscar el dropdown de color (hidden select dentro del componente PrimeFaces)
            color_input = None
            for selector_type, selector_val in [
                (By.ID, "form:color_input"),
                (By.CSS_SELECTOR, "select"),
            ]:
                try:
                    color_input = self.wait.until(
                        EC.presence_of_element_located((selector_type, selector_val))
                    )
                    break
                except Exception:
                    continue

            if not color_input:
                return {
                    "success": False,
                    "error": "No se encontró el selector de color",
                    "nic": nic,
                    "captcha_color": captcha_color
                }

            # El select de PrimeFaces esta oculto; sus options no tienen texto visible.
            # Hay que: 1) leer opciones del hidden select via JS, 2) simular click en el
            # label visible del componente y luego en el item de la lista desplegable.
            time.sleep(0.5)

            # Leer todas las opciones del select oculto via JavaScript
            options_data = self.driver.execute_script("""
                const select = arguments[0];
                return Array.from(select.options).map(o => ({text: o.textContent.trim(), value: o.value}));
            """, color_input)

            logger.info(f"Opciones disponibles: {[o['text'] for o in options_data]}")
            logger.info(f"Buscando color: {captcha_color}")

            matched = None
            for opt in options_data:
                if opt['text'].lower() == captcha_color.lower():
                    matched = opt
                    break
            if not matched:
                for opt in options_data:
                    if captcha_color.lower() in opt['text'].lower():
                        matched = opt
                        break

            if not matched and len(options_data) > 1:
                matched = options_data[1]  # fallback: primera opcion real
                logger.warning(f"Fallback al primer color: {matched['text']}")

            if matched:
                logger.info(f"Seleccionando: {matched['text']} (value={matched['value']})")
                # Seleccionar via JS en el select oculto
                self.driver.execute_script("""
                    const select = arguments[0];
                    select.value = arguments[1];
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    select.dispatchEvent(new Event('input',  { bubbles: true }));
                """, color_input, matched['value'])

                # PrimeFaces tambien necesita que se actualice el label visible
                try:
                    label_el = self.driver.find_element(By.CSS_SELECTOR, "#form\\:color_label")
                    self.driver.execute_script(
                        "arguments[0].textContent = arguments[1];", label_el, matched['text']
                    )
                except Exception:
                    pass

            time.sleep(0.5)

            # Click en el botón Buscar
            search_button = None
            for selector_type, selector_val in [
                (By.ID, "form:j_idt25"),
                (By.XPATH, "//button[contains(., 'Buscar')]"),
                (By.CSS_SELECTOR, "button[type='submit']"),
                (By.CSS_SELECTOR, ".ui-button-success"),
            ]:
                try:
                    search_button = self.driver.find_element(selector_type, selector_val)
                    break
                except Exception:
                    continue

            if not search_button:
                self.driver.save_screenshot("debug_button.png")
                return {
                    "success": False,
                    "error": "Botón de búsqueda no encontrado",
                    "nic": nic,
                    "captcha_color": captcha_color
                }

            self.driver.execute_script("arguments[0].scrollIntoView(true);", search_button)
            time.sleep(0.5)
            try:
                search_button.click()
            except Exception:
                self.driver.execute_script("arguments[0].click();", search_button)

            logger.info("Botón Buscar clickeado. Esperando resultados...")
            time.sleep(4)

            # Esperar tabla de resultados
            try:
                self.wait.until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "tbody tr"))
                )
                logger.info("Tabla de resultados encontrada.")
            except Exception:
                logger.warning("Tabla no encontrada tras el timeout, revisando estado...")

            self.driver.save_screenshot("debug_after_search.png")

            # Buscar enlaces/botones de facturas
            invoice_links = []

            for selector_type, selector_val in [
                (By.XPATH, "//button[contains(., 'Ver factura')]"),
                (By.XPATH, "//a[contains(., 'factura')]"),
                (By.CSS_SELECTOR, "table button"),
                (By.CSS_SELECTOR, "table a"),
                (By.CSS_SELECTOR, "tbody button"),
            ]:
                try:
                    found = self.driver.find_elements(selector_type, selector_val)
                    if found:
                        invoice_links = found
                        logger.info(f"Facturas encontradas ({selector_val}): {len(found)}")
                        break
                except Exception:
                    continue

            if not invoice_links:
                # Debug info desde JS
                debug_info = self.driver.execute_script("""
                    return {
                        rowCount: document.querySelectorAll('tbody tr').length,
                        buttons: Array.from(document.querySelectorAll('button')).slice(0, 10).map(b => b.textContent.trim()),
                        pageTitle: document.title,
                        url: window.location.href
                    };
                """)
                self.driver.save_screenshot("debug_no_invoices.png")
                return {
                    "success": False,
                    "error": "No se encontraron facturas para descargar.",
                    "nic": nic,
                    "captcha_color": captcha_color,
                    "debug": debug_info
                }

            logger.info(f"Total facturas: {len(invoice_links)}")

            downloaded = []
            initial_windows = set(self.driver.window_handles)

            for i, link in enumerate(invoice_links[:5]):
                try:
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", link)
                    time.sleep(0.5)
                    logger.info(f"Descargando factura {i + 1}...")
                    link.click()
                    time.sleep(3)

                    pdf_file = self._wait_for_pdf_download(f"factura_{nic}_{i + 1}.pdf", timeout=15)
                    if pdf_file:
                        downloaded.append({
                            "filename": os.path.basename(pdf_file),
                            "path": pdf_file,
                            "index": i + 1
                        })
                        logger.info(f"PDF descargado: {os.path.basename(pdf_file)}")
                    else:
                        logger.warning(f"Timeout esperando PDF {i + 1}")

                    # Cerrar ventanas extras
                    current_windows = set(self.driver.window_handles)
                    for window in current_windows - initial_windows:
                        self.driver.switch_to.window(window)
                        self.driver.close()

                    main_window = list(initial_windows)[0] if initial_windows else self.driver.window_handles[0]
                    self.driver.switch_to.window(main_window)

                except Exception as e:
                    logger.error(f"Error descargando factura {i + 1}: {e}")
                    try:
                        self.driver.switch_to.window(self.driver.window_handles[0])
                    except Exception:
                        pass

            return {
                "success": len(downloaded) > 0,
                "nic": nic,
                "captcha_color": captcha_color,
                "invoices_found": len(invoice_links),
                "downloaded": downloaded
            }

        except Exception as e:
            import traceback
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "nic": nic
            }

    def capture_captcha_image(self, nic: str) -> Dict:
        """Captura la imagen del CAPTCHA sin completar la descarga"""
        import base64
        try:
            self.driver.get("https://consultatufactura.air-e.com/")

            nic_input = self.wait.until(
                EC.presence_of_element_located((By.ID, "form:account"))
            )
            nic_input.clear()
            nic_input.send_keys(nic)
            time.sleep(2)

            # Intentar capturar el ícono CAPTCHA
            captcha_element = None
            for selector in [".pi.pi-circle-on", ".pi[class*='text-']", ".pi", "img[id*='captcha']"]:
                try:
                    captcha_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if captcha_element:
                        break
                except Exception:
                    continue

            screenshot_path = "temp_captcha.png"
            if captcha_element:
                captcha_element.screenshot(screenshot_path)
            else:
                self.driver.save_screenshot(screenshot_path)

            with open(screenshot_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')

            if os.path.exists(screenshot_path):
                os.remove(screenshot_path)

            detected_color = self.detect_captcha_color_from_element()

            return {
                "success": True,
                "nic": nic,
                "captcha_image": f"data:image/png;base64,{image_data}",
                "detected_color": detected_color
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "nic": nic
            }

    def close(self):
        if hasattr(self, 'driver') and self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass