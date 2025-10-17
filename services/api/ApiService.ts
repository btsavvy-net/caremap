import { ApiUtils } from "@/services/api/ApiUtils";
import { logger } from "@/services/logging/logger";
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export interface ApiOptions {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export const createApiService = ({
    baseURL,
    timeout = 10000,
    headers,
}: ApiOptions): AxiosInstance => {
    const instance = axios.create({ baseURL, timeout, headers });

    // Request Interceptor
    instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            ApiUtils.request(config);
            return config;
        },
        (error: AxiosError) => Promise.reject(ApiUtils.normalizeError(error))
    );

    // Response Interceptor
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            ApiUtils.response(response);
            return response.data;
        },
        (error: AxiosError) => Promise.reject(ApiUtils.normalizeError(error))
    );

    return instance;
};


export const retry = async <T>(
    fn: () => Promise<T>,
    { retries = 3, delay = 1000 } = {}
): Promise<T> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const { status, message = "Unknown error" } = err || {};
            const isRetryable = !status || status === 429 || status >= 500;
            const attemptMsg = `Attempt ${attempt}/${retries} failed (status=${status ?? "n/a"})`;

            if (isRetryable && attempt < retries) {
                logger.debug(`[API] ← Response : ${attemptMsg} — retrying in ${delay}ms...`, { message });
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            logger.debug("[API] ← Response", {
                attempt: `${attempt}${isRetryable ? `/${retries}` : ""}`,
                status: status ?? "N/A",
                retry: isRetryable,
                message,
                note: isRetryable
                    ? (attempt < retries
                        ? `Retrying in ${delay}ms...`
                        : "Max retries reached.")
                    : null
            });

            throw err;
        }
    }

    throw new Error("Retry logic exhausted unexpectedly");
};
