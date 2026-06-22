const mockUseAuth = jest.fn(() => ({
  user:     null as any,
  login:    jest.fn(),
  logout:   jest.fn(),
  register: jest.fn(),
  loading:  false,
  token:    null,
}));

export const useAuth    = mockUseAuth;
export const AuthProvider = ({ children }: any) => children;
export default mockUseAuth;
