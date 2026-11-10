import { isNativePlatform } from './platform';

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    if (isNativePlatform()) {
      window.location.href = '/native-login';
    } else {
      window.location.href = '/api/login';
    }
  }, 500);
}
