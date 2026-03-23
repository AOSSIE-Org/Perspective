import logging
import sys

def setup_logger(name: str) -> logging.Logger:
    """
    Creates and configures a logger with console + file output.

    Args:
        name (str): The logger's name (usually __name__ of the calling module).

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)  # Log everything from DEBUG and above

    # Avoid adding duplicate handlers if logger already set
    if logger.handlers:
        return logger

    # Formatter with timestamp, log level, module name
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler with UTF-8 encoding for Windows support
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    # Enable UTF-8 encoding to handle emoji and special characters on Windows
    if hasattr(console_handler.stream, 'reconfigure'):
        try:
            console_handler.stream.reconfigure(encoding='utf-8')
        except (AttributeError, ValueError):
            pass
    logger.addHandler(console_handler)

    # File Handler with UTF-8 encoding
    file_handler = logging.FileHandler("app.log", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)  # Keep detailed logs in file
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
