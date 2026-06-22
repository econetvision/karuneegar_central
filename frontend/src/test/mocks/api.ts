import { vi } from 'vitest';

export const mockApi = {
  get:    vi.fn(),
  post:   vi.fn(),
  put:    vi.fn(),
  delete: vi.fn(),
  patch:  vi.fn(),
};

export const mockUploadUrl = vi.fn(
  (filename: string) =>
    filename.startsWith('http')
      ? filename
      : `http://localhost:5000/api/uploads/${filename}`,
);

vi.mock('../../api/client', () => ({
  default:   mockApi,
  uploadUrl: mockUploadUrl,
}));
