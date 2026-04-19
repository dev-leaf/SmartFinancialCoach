/**
 * CRITICAL FIX P1: Offline Request Queue System
 * 
 * Implements reliable offline-first architecture:
 * 1. Queues failed requests in AsyncStorage
 * 2. Retries with exponential backoff
 * 3. Detects duplicates (409 Conflict)
 * 4. Processes when network is restored
 * 
 * Use case:
 * - User is offline, creates expense
 * - Request queued locally
 * - User goes back online
 * - Request automatically synced
 */

// This is a TypeScript module for React Native mobile app
// File: mobile/src/services/offline/requestQueue.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedRequest {
  id: string; // Unique request ID
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
  lastError?: string;
  idempotencyKey?: string; // For deduplication on server
}

export interface QueuedResponse {
  requestId: string;
  success: boolean;
  statusCode?: number;
  data?: any;
  error?: string;
  processedAt: number;
}

const QUEUE_KEY = '@smartfinancialcoach:request_queue';
const FAILED_KEY = '@smartfinancialcoach:failed_requests';
const PROCESSED_KEY = '@smartfinancialcoach:processed_requests';

/**
 * Offline request queue manager
 * Handles queuing, retrying, and processing requests
 */
export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  /**
   * Initialize queue from storage
   */
  async initialize() {
    try {
      const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
      this.queue = storedQueue ? JSON.parse(storedQueue) : [];
      console.log(`[RequestQueue] Initialized with ${this.queue.length} queued requests`);
    } catch (error) {
      console.error('[RequestQueue] Failed to initialize', error);
      this.queue = [];
    }
  }

  /**
   * Enqueue a request for later processing
   * Returns unique request ID for tracking
   */
  async enqueue(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<string> {
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    
    const request: QueuedRequest = {
      id: requestId,
      method: method as any,
      endpoint,
      data,
      headers,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
      idempotencyKey: data?.idempotencyKey || requestId,
    };

    this.queue.push(request);
    await this.persistQueue();

    console.log(`[RequestQueue] Queued: ${method} ${endpoint} (ID: ${requestId})`);
    return requestId;
  }

  /**
   * Process all queued requests
   * Called when network is restored
   */
  async processQueue(apiClient: any): Promise<QueuedResponse[]> {
    if (this.isProcessing || this.queue.length === 0) {
      return [];
    }

    this.isProcessing = true;
    const results: QueuedResponse[] = [];

    try {
      for (const request of [...this.queue]) {
        const result = await this.processRequest(request, apiClient);
        results.push(result);

        if (result.success) {
          // Remove from queue
          this.queue = this.queue.filter((r) => r.id !== request.id);
          await this.addProcessedRequest(request, result);
        } else {
          // Update retry count
          request.retries++;
          request.lastError = result.error;

          if (request.retries >= request.maxRetries) {
            // Max retries exceeded, move to failed
            this.queue = this.queue.filter((r) => r.id !== request.id);
            await this.addFailedRequest(request);
          }
        }
      }

      await this.persistQueue();
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * Process single queued request with retry logic
   */
  private async processRequest(
    request: QueuedRequest,
    apiClient: any,
  ): Promise<QueuedResponse> {
    try {
      // Calculate exponential backoff delay
      const delayMs = Math.pow(2, request.retries) * 1000;
      
      console.log(
        `[RequestQueue] Processing: ${request.method} ${request.endpoint} ` +
        `(attempt ${request.retries + 1}/${request.maxRetries})`,
      );

      // Wait before retry
      if (request.retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Make API call
      const response = await apiClient({
        method: request.method.toLowerCase(),
        url: request.endpoint,
        data: request.data,
        headers: {
          ...request.headers,
          'X-Idempotency-Key': request.idempotencyKey,
        },
      });

      return {
        requestId: request.id,
        success: true,
        statusCode: response.status,
        data: response.data,
        processedAt: Date.now(),
      };
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;

      // 409 Conflict = duplicate, consider it successful
      if (statusCode === 409) {
        console.log(
          `[RequestQueue] Duplicate detected (409), considering successful: ${request.id}`,
        );
        return {
          requestId: request.id,
          success: true,
          statusCode: 409,
          data: error.response?.data,
          processedAt: Date.now(),
        };
      }

      // 400-499 = client error, don't retry
      if (statusCode >= 400 && statusCode < 500) {
        console.error(
          `[RequestQueue] Client error (${statusCode}), not retrying: ${request.id}`,
        );
        return {
          requestId: request.id,
          success: false,
          statusCode,
          error: errorMessage,
          processedAt: Date.now(),
        };
      }

      // 5xx or network error = retry
      console.warn(
        `[RequestQueue] Retriable error (${statusCode}): ${request.id}`,
      );
      return {
        requestId: request.id,
        success: false,
        statusCode,
        error: errorMessage,
        processedAt: Date.now(),
      };
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      requests: this.queue.map((r) => ({
        id: r.id,
        method: r.method,
        endpoint: r.endpoint,
        retries: r.retries,
        maxRetries: r.maxRetries,
      })),
    };
  }

  /**
   * Persist queue to storage
   */
  private async persistQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[RequestQueue] Failed to persist queue', error);
    }
  }

  /**
   * Add successfully processed request to history
   */
  private async addProcessedRequest(request: QueuedRequest, result: QueuedResponse) {
    try {
      const processed = await AsyncStorage.getItem(PROCESSED_KEY);
      const list = processed ? JSON.parse(processed) : [];
      list.push({
        ...result,
        originalRequest: {
          method: request.method,
          endpoint: request.endpoint,
          timestamp: request.timestamp,
        },
      });
      
      // Keep only last 100 processed requests
      if (list.length > 100) {
        list.shift();
      }

      await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(list));
    } catch (error) {
      console.error('[RequestQueue] Failed to add processed request', error);
    }
  }

  /**
   * Add failed request to failed list
   */
  private async addFailedRequest(request: QueuedRequest) {
    try {
      const failed = await AsyncStorage.getItem(FAILED_KEY);
      const list = failed ? JSON.parse(failed) : [];
      list.push({
        ...request,
        failedAt: Date.now(),
      });

      await AsyncStorage.setItem(FAILED_KEY, JSON.stringify(list));
      console.warn(`[RequestQueue] Request failed after retries: ${request.id}`);
    } catch (error) {
      console.error('[RequestQueue] Failed to add failed request', error);
    }
  }

  /**
   * Clear queue (for testing or manual reset)
   */
  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Get failed requests for user review
   */
  async getFailedRequests(): Promise<QueuedRequest[]> {
    try {
      const failed = await AsyncStorage.getItem(FAILED_KEY);
      return failed ? JSON.parse(failed) : [];
    } catch (error) {
      console.error('[RequestQueue] Failed to get failed requests', error);
      return [];
    }
  }

  /**
   * Retry a failed request
   */
  async retryFailedRequest(requestId: string, apiClient: any) {
    const failed = await this.getFailedRequests();
    const request = failed.find((r) => r.id === requestId);

    if (!request) {
      throw new Error('Failed request not found');
    }

    // Re-enqueue
    await this.enqueue(
      request.method,
      request.endpoint,
      request.data,
      request.headers,
    );

    // Remove from failed
    const updatedFailed = failed.filter((r) => r.id !== requestId);
    await AsyncStorage.setItem(FAILED_KEY, JSON.stringify(updatedFailed));
  }
}

// Create singleton instance
export const requestQueue = new RequestQueue();
