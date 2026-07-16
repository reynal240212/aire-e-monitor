from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:tu_password@localhost:5432/aire_monitor"
    NIC_DEFAULT: str = "7566507"
    PDF_DIR: str = "./pdfs"
    CALIBRATION_DIR: str = "./pdfs/calibration"
    SCRAPER_URL: str = "https://consultatufactura.air-e.com/"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
