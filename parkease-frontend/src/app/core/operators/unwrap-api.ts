import { map } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';

export function unwrapApiResponse<T>() {
  return map((response: ApiResponse<T>) => response.data);
}
