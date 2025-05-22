import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router, MemoryRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthContext } from '../contexts/AuthContext';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  useNavigate: () => mockNavigate,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>, // Simplified NavLink for testing
}));

// Mock AuthContext
const mockLogout = jest.fn();

const renderWithRouterAndAuth = (ui, { providerProps, route = '/', initialEntries = [route] } = {}) => {
  return render(
    <AuthContext.Provider value={providerProps}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  describe('Authenticated User', () => {
    const authenticatedUserProps = {
      isAuthenticated: true,
      user: { _id: 'user123', username: 'TestUser' },
      logout: mockLogout,
    };

    test('renders user menu button and toggles dropdown visibility', () => {
      renderWithRouterAndAuth(<Navbar />, { providerProps: authenticatedUserProps });

      const userMenuButton = screen.getByText('T'); // Assuming first letter of username 'TestUser'
      expect(userMenuButton).toBeInTheDocument();

      // Dropdown should initially be hidden
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();

      // Click to open dropdown
      fireEvent.click(userMenuButton);
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Create Post')).toBeInTheDocument();
      expect(screen.getByText('Create Community')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();

      // Click again to close dropdown
      fireEvent.click(userMenuButton);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    test('dropdown links navigate correctly', () => {
      renderWithRouterAndAuth(<Navbar />, { providerProps: authenticatedUserProps });
      const userMenuButton = screen.getByText('T');
      fireEvent.click(userMenuButton); // Open dropdown

      const profileLink = screen.getByText('Profile');
      fireEvent.click(profileLink);
      // In simplified NavLink, href is used. In a real NavLink, it would trigger navigation.
      // Here, we check the href attribute as a proxy for navigation intent.
      expect(profileLink.closest('a')).toHaveAttribute('href', `/profile/${authenticatedUserProps.user._id}`);
      
      // Re-open for next link (in a real scenario, navigation would occur)
      // For this test structure, we assume links don't cause page unmounts that break the test
      // or we would need separate tests for each link if navigation is fully simulated.
      fireEvent.click(userMenuButton); 
      const createPostLink = screen.getByText('Create Post');
      fireEvent.click(createPostLink);
      expect(createPostLink.closest('a')).toHaveAttribute('href', '/submit');

      fireEvent.click(userMenuButton);
      const createCommunityLink = screen.getByText('Create Community');
      fireEvent.click(createCommunityLink);
      expect(createCommunityLink.closest('a')).toHaveAttribute('href', '/create-community');
    });
    
    test('Logout button calls logout function', () => {
      renderWithRouterAndAuth(<Navbar />, { providerProps: authenticatedUserProps });
      const userMenuButton = screen.getByText('T');
      fireEvent.click(userMenuButton); // Open dropdown

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unauthenticated User', () => {
    const unauthenticatedUserProps = {
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    };

    test('does not render user menu button and shows Login/Register links', () => {
      renderWithRouterAndAuth(<Navbar />, { providerProps: unauthenticatedUserProps });

      expect(screen.queryByText('T')).not.toBeInTheDocument(); // No user menu button
      expect(screen.queryByText('Profile')).not.toBeInTheDocument(); // No dropdown items

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });
});
