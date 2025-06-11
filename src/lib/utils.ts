
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const createUtilsToast = {
  success: (title: string, description?: string) => {
    toast.success(title, {
      description: description
    });
  },
  error: (title: string, description?: string) => {
    toast.error(title, {
      description: description
    });
  },
  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description: description
    });
  },
  info: (title: string, description?: string) => {
    toast.info(title, {
      description: description
    });
  }
}
