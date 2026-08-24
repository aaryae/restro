export const trimFormData = <T extends Record<string, any>>(data: T): T => {
  return Object.keys(data).reduce((accumulator, key) => {
    const value = data[key];
    const result = { ...accumulator } as T;

    if (typeof value === "string") {
      result[key as keyof T] = value.trim() as T[keyof T];
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map((item) =>
        typeof item === "object"
          ? trimFormData(item)
          : typeof item === "string"
            ? item.trim()
            : item,
      ) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      result[key as keyof T] = trimFormData(value) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }

    return result;
  }, {} as T);
};

/**
 * Converts empty strings to null for specified nullable fields
 * @param data - The form data object
 * @param nullableFields - Array of field names that should be converted from empty strings to null
 * @returns The processed data with empty strings converted to null for specified fields
 */
export const convertEmptyStringsToNull = <T extends Record<string, any>>(
  data: T,
  nullableFields: (keyof T)[]
): T => {
  return Object.keys(data).reduce((accumulator, key) => {
    const value = data[key];
    const result = { ...accumulator } as T;

    if (nullableFields.includes(key as keyof T) && value === "") {
      result[key as keyof T] = null as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }

    return result;
  }, {} as T);
};
