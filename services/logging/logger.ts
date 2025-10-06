import { DEBUG_ON, LOG_TRUNCATE_LIMIT } from "@/utils/config";

interface Logger {
  debug: (message: string, ...optionalParams: any[]) => void;
  debugTrunc: (message: string, obj: any) => void;
}

// Helper function to truncate long strings in objects
const truncateStrings = (obj: any, maxLength = LOG_TRUNCATE_LIMIT): any => {
  if (obj == null) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > maxLength ? `${obj.substring(0, maxLength)}...` : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => truncateStrings(item, maxLength));
  }

  if (typeof obj === 'object') {
    const truncated: any = {};
    for (const key in obj) {
      truncated[key] = truncateStrings(obj[key], maxLength);
    }
    return truncated;
  }

  return obj;
};

export const logger: Logger = {
  debug: (message: string, ...optionalParams: any[]) => {
    if (DEBUG_ON) {
      console.debug(`${message}`, ...optionalParams);
    }
  },
  debugTrunc: (message: string, obj: any) => {
    if (DEBUG_ON) {
      const truncatedObj = truncateStrings(obj);
      console.debug(`${message}:`, truncatedObj);
    }
  },
};