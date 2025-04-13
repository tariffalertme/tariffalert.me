import { BaseApiClient } from '../BaseApiClient';
import { ApiClientConfig, ApiError, ApiErrorType } from '@/types/api';
import type { AxiosResponse, AxiosError } from 'axios';

// Mock setup
const mocks = {
  request: jest.fn(),
  requestUse: jest.fn(),
  responseUse: jest.fn(),
  isAxiosError: jest.fn(),
  headersSet: jest.fn()
};

// Mock the axios module
jest.doMock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      request: mocks.request,
      interceptors: {
        request: { use: mocks.requestUse },
        response: { use: mocks.responseUse }
      }
    })),
    isAxiosError: mocks.isAxiosError
  },
  AxiosHeaders: jest.fn(() => ({
    set: mocks.headersSet
  }))
}));

// Import axios after mocking
const axios = require('axios').default;

describe('BaseApiClient', () => {
  let client: BaseApiClient;
  const mockConfig: ApiClientConfig = {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    },
    auth: {
      type: 'apiKey',
      apiKey: 'test-api-key'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new BaseApiClient(mockConfig);
  });

  it('should create an instance with correct configuration', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: mockConfig.baseUrl,
      timeout: mockConfig.timeout,
      headers: mockConfig.headers
    });
  });

  it('should handle successful requests', async () => {
    const mockResponse: AxiosResponse = {
      data: { id: 1, name: 'Test' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    mocks.request.mockResolvedValueOnce(mockResponse);

    const result = await (client as any).request({
      method: 'GET',
      url: '/test'
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should handle request errors', async () => {
    const mockError = {
      response: {
        status: 404,
        data: 'Not Found'
      },
      isAxiosError: true
    };

    mocks.isAxiosError.mockReturnValueOnce(true);
    mocks.request.mockRejectedValueOnce(mockError);

    await expect(
      (client as any).request({
        method: 'GET',
        url: '/test'
      })
    ).rejects.toMatchObject({
      type: ApiErrorType.NotFound,
      statusCode: 404,
      response: 'Not Found'
    });
  });

  it('should handle rate limiting', async () => {
    const clientWithRateLimit = new BaseApiClient({
      ...mockConfig,
      rateLimit: {
        requestsPerSecond: 2
      }
    });

    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    mocks.request.mockResolvedValue(mockResponse);

    // Make multiple requests
    const requests = Array(3).fill(null).map(() =>
      (clientWithRateLimit as any).request({
        method: 'GET',
        url: '/test'
      })
    );

    const results = await Promise.all(requests);
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result).toEqual({ success: true });
    });
  });
}); 