// Error handling utilities for RuneSight frontend

export class RiotIdValidationError extends Error {
    public readonly errors: string[];

    constructor(errors: string[]) {
        super(errors.join(', '));
        this.name = 'RiotIdValidationError';
        this.errors = errors;
    }
}

export class ApiError extends Error {
    public readonly status?: number;
    public readonly code?: string;

    constructor(message: string, status?: number, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

export class NetworkError extends Error {
    constructor(message: string = 'Network connection failed') {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ValidationError extends Error {
    public readonly field: string;

    constructor(field: string, message: string) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Error handler for API responses
 */
export function handleApiError(error: any): ApiError {
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.error || error.response.data?.message || 'Server error';
        const code = error.response.data?.code;

        return new ApiError(message, status, code);
    } else if (error.request) {
        // Request was made but no response received
        return new NetworkError('Network error - please check your connection');
    } else {
        // Something else happened
        return new ApiError(error.message || 'Unknown error occurred');
    }
}

/**
 * User-friendly error messages
 */
export function getErrorMessage(error: Error): string {
    if (error instanceof RiotIdValidationError) {
        return error.errors[0]; // Show first error for UI
    }

    if (error instanceof ApiError) {
        switch (error.status) {
            case 400:
                return error.message || 'Invalid request. Please check your input.';
            case 401:
                return 'Authentication failed. Please check your API key.';
            case 403:
                return 'Access denied. You may not have permission for this action.';
            case 404:
                return 'Player not found. Please check the RiotID and region.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
                return 'Server error. Please try again later.';
            case 503:
                return 'Service temporarily unavailable. Please try again later.';
            default:
                return error.message || 'An unexpected error occurred.';
        }
    }

    if (error instanceof NetworkError) {
        return 'Connection failed. Please check your internet connection.';
    }

    if (error instanceof ValidationError) {
        return error.message;
    }

    return error.message || 'An unexpected error occurred.';
}

/**
 * Error severity levels for UI display
 */
export function getErrorSeverity(error: Error): 'error' | 'warning' | 'info' {
    if (error instanceof RiotIdValidationError || error instanceof ValidationError) {
        return 'warning';
    }

    if (error instanceof ApiError) {
        if (error.status === 404) {
            return 'info'; // Player not found is informational
        }
        if (error.status === 429) {
            return 'warning'; // Rate limit is a warning
        }
    }

    return 'error'; // Default to error for unknown issues
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
    if (error instanceof ApiError) {
        // Retry on server errors and rate limits
        return error.status === 429 || (error.status !== undefined && error.status >= 500);
    }

    if (error instanceof NetworkError) {
        return true; // Network errors are usually retryable
    }

    return false;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error, context?: Record<string, any>): Record<string, any> {
    const logEntry: Record<string, any> = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    if (error instanceof ApiError) {
        if (error.status !== undefined) logEntry.status = error.status;
        if (error.code !== undefined) logEntry.code = error.code;
    }

    if (error instanceof RiotIdValidationError) {
        logEntry.errors = error.errors;
    }

    if (error instanceof ValidationError) {
        logEntry.field = error.field;
    }

    if (context) {
        logEntry.context = context;
    }

    return logEntry;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    };

    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Don't retry if error is not retryable
            if (!isRetryableError(lastError)) {
                throw lastError;
            }

            // Don't retry if we've exhausted attempts
            if (attempt === maxRetries) {
                throw lastError;
            }

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Increase delay for next attempt (exponential backoff)
            delay = Math.min(delay * backoffMultiplier, maxDelay);

            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        }
    }

    throw lastError || new Error('Retry failed');
}

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryOptions {
    onRetry?: () => void;
    onFallback?: () => void;
    fallbackData?: any;
}

/**
 * Handle error with recovery strategy
 */
export async function handleErrorWithRecovery<T>(
    fn: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
): Promise<T | null> {
    try {
        return await retryWithBackoff(fn);
    } catch (error) {
        const err = error as Error;

        // Log error
        console.error('Error with recovery:', formatErrorForLogging(err));

        // Try fallback if available
        if (options.fallbackData !== undefined) {
            if (options.onFallback) {
                options.onFallback();
            }
            return options.fallbackData;
        }

        // Return null if no fallback
        return null;
    }
}