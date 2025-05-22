import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CreatePostPage from './CreatePostPage';
import * as api from '../services/api'; // To mock specific functions

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock API calls
jest.mock('../services/api', () => ({
  ...jest.requireActual('../services/api'), // Keep other functions
  getAllCommunities: jest.fn(),
  createPost: jest.fn(),
}));


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


describe('CreatePostPage Component', () => {
  const authenticatedUserProps = {
    isAuthenticated: true,
    user: { _id: 'user123', username: 'TestUser' },
  };

  const mockCommunities = [
    { _id: 'comm1', id: 'comm1', name: 'Community 1' },
    { _id: 'comm2', id: 'comm2', name: 'Community 2' },
  ];

  beforeEach(() => {
    mockNavigate.mockClear();
    api.getAllCommunities.mockClear();
    api.createPost.mockClear();
  });

  test('successfully creates a post with communityId and navigates', async () => {
    api.getAllCommunities.mockResolvedValueOnce({ data: mockCommunities });
    api.createPost.mockResolvedValueOnce({ 
      data: { 
        _id: 'post123', 
        id: 'post123', 
        title: 'Test Post Title', 
        communityId: 'comm1' 
      } 
    });

    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });

    // Wait for communities to load
    await waitFor(() => {
      expect(screen.getByText('Select a Community')).toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Test Post Title' } });
    fireEvent.change(screen.getByLabelText(/Content:/i), { target: { value: 'This is the post content.' } });
    
    const communitySelect = screen.getByLabelText(/Community:/i);
    fireEvent.change(communitySelect, { target: { value: 'comm1' } });
    expect(communitySelect.value).toBe('comm1');


    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Post/i }));

    // Assertions
    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledTimes(1);
    });

    expect(api.createPost).toHaveBeenCalledWith({
      title: 'Test Post Title',
      content: 'This is the post content.',
      communityId: 'comm1', // Crucial: Check for communityId
    });

    // Check for success message
    await waitFor(() => {
        expect(screen.getByText(/Post "Test Post Title" created successfully!/i)).toBeInTheDocument();
    });

    // Check for navigation (mocked navigate)
    await waitFor(() => {
        // Example: navigate to the new post page
        expect(mockNavigate).toHaveBeenCalledWith('/post/post123'); 
    }, { timeout: 2000 }); // Increased timeout for the setTimeout in component
  });

  test('shows error if title is missing', async () => {
    api.getAllCommunities.mockResolvedValueOnce({ data: mockCommunities });
    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });
    await waitFor(() => expect(screen.getByText('Select a Community')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Content:/i), { target: { value: 'Content without title.' } });
    fireEvent.change(screen.getByLabelText(/Community:/i), { target: { value: 'comm1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Post/i }));

    await waitFor(() => {
      expect(screen.getByText('Post title is required.')).toBeInTheDocument();
    });
    expect(api.createPost).not.toHaveBeenCalled();
  });

  test('shows error if content is missing', async () => {
    api.getAllCommunities.mockResolvedValueOnce({ data: mockCommunities });
    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });
    await waitFor(() => expect(screen.getByText('Select a Community')).toBeInTheDocument());
    
    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Title without content.' } });
    fireEvent.change(screen.getByLabelText(/Community:/i), { target: { value: 'comm1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Post/i }));

    await waitFor(() => {
      expect(screen.getByText('Post content is required.')).toBeInTheDocument();
    });
    expect(api.createPost).not.toHaveBeenCalled();
  });

  test('shows error if community is not selected', async () => {
    api.getAllCommunities.mockResolvedValueOnce({ data: mockCommunities });
    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });
    await waitFor(() => expect(screen.getByText('Select a Community')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/Content:/i), { target: { value: 'Test Content' } });
    // No community selected
    fireEvent.click(screen.getByRole('button', { name: /Create Post/i }));

    await waitFor(() => {
      expect(screen.getByText('Please select a community for your post.')).toBeInTheDocument();
    });
    expect(api.createPost).not.toHaveBeenCalled();
  });

  test('shows error if fetching communities fails', async () => {
    api.getAllCommunities.mockRejectedValueOnce(new Error('Failed to load communities'));
    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });

    await waitFor(() => {
      expect(screen.getByText('Failed to load communities. Please try again later.')).toBeInTheDocument();
    });
    // Check if submit button is disabled or shows an error related to no communities
    const submitButton = screen.getByRole('button', { name: /Create Post/i });
    expect(submitButton).toBeDisabled(); // Assuming it's disabled if communities fail to load
  });

  test('shows error if post creation API call fails', async () => {
    api.getAllCommunities.mockResolvedValueOnce({ data: mockCommunities });
    api.createPost.mockRejectedValueOnce({ response: { data: { message: 'Server error creating post' } } });
    
    renderWithRouterAndAuth(<CreatePostPage />, { providerProps: authenticatedUserProps });
    await waitFor(() => expect(screen.getByText('Select a Community')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/Content:/i), { target: { value: 'Test Content' } });
    fireEvent.change(screen.getByLabelText(/Community:/i), { target: { value: 'comm1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Post/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error creating post')).toBeInTheDocument();
    });
  });

});
