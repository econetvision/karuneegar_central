const mockApi = {
  get:    jest.fn(),
  post:   jest.fn(),
  put:    jest.fn(),
  delete: jest.fn(),
  patch:  jest.fn(),
};

export const uploadUrl = jest.fn((fn: string) => `http://test.local/uploads/${fn}`);
export default mockApi;
