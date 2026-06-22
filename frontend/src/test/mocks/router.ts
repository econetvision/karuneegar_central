import { vi } from 'vitest';

export const mockNavigate  = vi.fn();
export const mockUseParams = vi.fn(() => ({} as Record<string, string>));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams:   mockUseParams,
    Link: ({ to, children, ...props }: any) =>
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a href={to} {...props}>{children}</a>,
  };
});
