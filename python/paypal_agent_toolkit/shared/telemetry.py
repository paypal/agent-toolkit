import logging
import platform
import sys
from importlib.metadata import version, PackageNotFoundError


class Telemetry:
    SDK_NAME = "Paypal Agent Toolkit Python"
    PACKAGE_NAME = "paypal-agent-toolkit"

    @classmethod
    def get_sdk_version(cls) -> str:
        try:
            return version(cls.PACKAGE_NAME)
        except PackageNotFoundError:
            return "unknown"

    @classmethod
    def get_env_info(cls) -> dict:
        return {
            "os": platform.system(),
            "os_version": platform.version(),
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "machine": platform.machine(),
            "hostname": platform.node()
        }


    @classmethod
    def generate_user_agent(cls, source: str) -> str:
        components = [
            f"{cls.SDK_NAME}: {source}",
            f"Version: {cls.get_sdk_version()}",
            f"on OS: {platform.system()} {platform.release()}"
        ]
        return ", ".join(filter(None, components))
    

    @classmethod
    def log(cls):
        telemetry_data = {
            "sdk_name": cls.SDK_NAME,
            "sdk_version": cls.get_sdk_version(),
            **cls.get_env_info()
        }
        logging.debug("Telemetry Info:", telemetry_data) 
