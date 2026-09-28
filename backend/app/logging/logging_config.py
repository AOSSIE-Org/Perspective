import logging
import sys
import os

# Ensure standard output supports UTF-8 on Windows consoles without charmap encode errors
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def setup_logger(name: str) -> logging.Logger:
    """
    Creates and configures a logger with console + file output.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler with safe encoding
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File Handler with UTF-8
    try:
        file_handler = logging.FileHandler("app.log", encoding="utf-8", errors="replace")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as file_exc:
        console_handler.emit(
            logging.LogRecord(
                name=name,
                level=logging.WARNING,
                pathname=__file__,
                lineno=0,
                msg=f"File logging disabled (app.log could not be opened): {file_exc}",
                args=(),
                exc_info=None,
            )
        )

    return logger
