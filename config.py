"""
Configuration module for Azure Communication Services
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for Azure Communication Services"""

    # Azure Communication Services settings
    AZURE_COMMUNICATION_CONNECTION_STRING = os.getenv('AZURE_COMMUNICATION_CONNECTION_STRING')
    AZURE_PHONE_NUMBER = os.getenv('AZURE_PHONE_NUMBER')
    CALLBACK_BASE_URL = os.getenv('CALLBACK_BASE_URL', 'http://localhost:5000')

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    @staticmethod
    def validate():
        """Validate that required configuration is present"""
        errors = []

        if not Config.AZURE_COMMUNICATION_CONNECTION_STRING:
            errors.append("AZURE_COMMUNICATION_CONNECTION_STRING is not set")

        if not Config.AZURE_PHONE_NUMBER:
            errors.append("AZURE_PHONE_NUMBER is not set")

        if errors:
            return False, errors

        return True, []
