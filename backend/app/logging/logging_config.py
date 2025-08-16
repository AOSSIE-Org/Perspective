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

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File Handler
    file_handler = logging.FileHandler("app.log")
    file_handler.setLevel(logging.DEBUG)  # Keep detailed logs in file
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
