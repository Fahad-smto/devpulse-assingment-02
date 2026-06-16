// src/utils/validate.ts

export const isRequired = (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
        return `${fieldName} is required`;
    }
    return null;
};


};

export const minLength = (value: string, min: number, fieldName: string): string | null => {
    if (value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
    }
    return null;
};

export const isOneOf = (value: string, allowed: string[], fieldName: string): string | null => {
    if (!allowed.includes(value)) {
        return `${fieldName} must be one of: ${allowed.join(', ')}`;
    }
    return null;
};

export const isValidEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please provide a valid email address';
    }
    return null;
};

// Collects all non-null error strings into one array
export const collectErrors = (...checks: (string | null)[]): string[] => {
    return checks.filter((e): e is string => e !== null);
};
