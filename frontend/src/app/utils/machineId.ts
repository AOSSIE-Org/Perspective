const MACHINE_ID_KEY = 'perspective_machine_id';

export function getOrCreateMachineId(): string {
    // Try to get existing machine ID from localStorage
    const existingId = localStorage.getItem(MACHINE_ID_KEY);
    if (existingId) {
        return existingId;
    }

    // Generate new machine ID if none exists
    const newId = crypto.randomUUID();
    localStorage.setItem(MACHINE_ID_KEY, newId);
    return newId;
}

export function getMachineId(): string | null {
    return localStorage.getItem(MACHINE_ID_KEY);
} 