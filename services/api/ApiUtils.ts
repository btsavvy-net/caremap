import { logger } from "@/services/logging/logger";
import { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const ApiUtils = {
    log: (msg: string, data?: any) => {
        logger.debug(`[API] ${msg}`, data ?? "");
    },

    request: (config: InternalAxiosRequestConfig) => {
        ApiUtils.log("→ Request", {
            url: config.url,
            method: config.method?.toUpperCase(),
            headers: config.headers ?? {}
        });
    },

    response: (response: AxiosResponse) => {
        ApiUtils.log("← Response", {
            url: response.config.url,
            status: response.status,
            message: response.data?.message ?? ""
        })
    },

    normalizeError: (err: any) => {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err.message || "Unknown error";
        const data = err?.response?.data;
        return { status, message, data };
    },
};