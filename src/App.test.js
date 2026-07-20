import { render, screen } from '@testing-library/react';
import Login from './components/Login';

test('דף ההתחברות מציג את שם המערכת', () => {
  render(<Login />);
  expect(screen.getByText('FoodManage')).toBeInTheDocument();
});

test('דף ההתחברות מציג שדה שם משתמש', () => {
  render(<Login />);
  expect(screen.getByPlaceholderText('הזן שם משתמש')).toBeInTheDocument();
});

test('דף ההתחברות מציג כפתור התחבר', () => {
  render(<Login />);
  expect(screen.getByRole('button', { name: /התחבר/i })).toBeInTheDocument();
});

test('דף ההתחברות מציג קישור לשכחתי סיסמה', () => {
  render(<Login />);
  expect(screen.getByText(/שכחתי סיסמה/i)).toBeInTheDocument();
});
