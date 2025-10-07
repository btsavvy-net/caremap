// Generic validator for any enum — supports string, number, boolean, null, etc.

export function isValidEnumValue<T extends Record<string, any>>(
    enumObj: T,
    value: unknown
): boolean {
    return Object.values(enumObj).includes(value);
}
