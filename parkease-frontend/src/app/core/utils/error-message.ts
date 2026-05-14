export function extractErrorMessage(errorBody: unknown): string {
  if (!errorBody) {
    return '';
  }

  if (typeof errorBody === 'string') {
    return errorBody;
  }

  if (errorBody instanceof ProgressEvent) {
    return 'Cannot connect to the ParkEase API gateway. Start the backend services and make sure http://127.0.0.1:8080 is reachable.';
  }

  if (errorBody instanceof ErrorEvent) {
    return errorBody.message;
  }

  const body = errorBody as Record<string, unknown>;
  if (typeof body['message'] === 'string') {
    return body['message'];
  }

  if (typeof body['error'] === 'string') {
    return body['error'];
  }

  if (typeof body['details'] === 'object' && body['details']) {
    return Object.entries(body['details'] as Record<string, unknown>)
      .map(([field, value]) => `${field}: ${value}`)
      .join(', ');
  }

  return JSON.stringify(body);
}
