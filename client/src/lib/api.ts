import type { ChatResponseData, OrderRequest } from '../types';

interface ApiErrorBody {
  success: false;
  error: {
    code?: string;
    message?: string;
    requestId?: string;
  };
}

interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export class ApiError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface OutgoingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatRequest = async (messages: OutgoingMessage[]): Promise<ChatResponseData> => {
  let response: Response;

  try {
    response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }

  const body = (await response.json().catch(() => null)) as
    | ApiSuccessBody<ChatResponseData>
    | ApiErrorBody
    | null;

  if (body === null) {
    throw new ApiError('The server returned an unexpected response. Please try again.', 'PARSE_ERROR');
  }

  if (!body.success) {
    throw new ApiError(
      body.error?.message ?? 'Something went wrong. Please try again.',
      body.error?.code ?? 'UNKNOWN_ERROR',
    );
  }

  return body.data;
};

export const fetchOrders = async (): Promise<OrderRequest[]> => {
  let response: Response;

  try {
    response = await fetch('/api/v1/orders?limit=100');
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }

  const body = (await response.json().catch(() => null)) as
    | ApiSuccessBody<OrderRequest[]>
    | ApiErrorBody
    | null;

  if (body === null) {
    throw new ApiError('The server returned an unexpected response. Please try again.', 'PARSE_ERROR');
  }

  if (!body.success) {
    throw new ApiError(
      body.error?.message ?? 'Something went wrong. Please try again.',
      body.error?.code ?? 'UNKNOWN_ERROR',
    );
  }

  return body.data;
};
