from typing import Optional

def get_machine_id(client_machine_id: Optional[str] = None) -> Optional[str]:
    """
    Get the machine ID from the client.
    
    Args:
        client_machine_id: Machine ID provided by the client.
    
    Returns:
        Optional[str]: The machine ID if provided, None otherwise
    """
    return client_machine_id 