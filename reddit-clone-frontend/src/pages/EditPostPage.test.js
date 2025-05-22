import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import EditPostPage from './EditPostPage';
import * as api from '../services/api';

// Mock API calls
jest.mock('../services/api', () => ({
  getPostById: jest.fn(),
  updatePost: jest.fn(),
}));

// Mock react-router-dom's useParams and useNavigate
const mockNavigate = jest.fn();
const mockParams = { postId: 'post123' }; // Default mock params

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
}));

const mockUser = { _id: 'user123', id: 'user123', username: 'TestUser' };
const mockPostOwnedByUser = {
  _id: 'post123',
  id: 'post123',
  title: 'Original Title',
  content: 'Original content.',
  author: mockUser, // Author is the logged-in user
  community: { _id: 'comm1', id: 'comm1', name: 'Tech' },
};
const mockPostNotOwnedByUser = {
  _id: 'post456',
  id: 'post456',
  title: 'Another Post',
  content: 'Content by someone else.',
  author: { _id: 'user789', id: 'user789', username: 'OtherUser' },
  community: { _id: 'comm2', id: 'comm2', name: 'General' },
};

const renderEditPostPage = (authState = { isAuthenticated: true, user: mockUser }, currentPostId = mockPostOwnedByUser._id) => {
  mockParams.postId = currentPostId; // Ensure params are set for this render
  api.getPostById.mockClear();
  api.updatePost.mockClear();
  mockNavigate.mockClear();

  return render(
    <AuthContext.Provider value={authState}>
      <MemoryRouter initialEntries={[`/edit-post/${currentPostId}`]}>
        <Routes>
          <Route path="/edit-post/:postId" element={<EditPostPage />} />
          <Route path="/post/:postId" element={<div>Post Page for {currentPostId}</div>} /> {/* For navigation checks */}
          <Route path="/" element={<div>Homepage</div>} /> {/* For redirect on 404 */}
          <Route path="/login" element={<div>Login Page</div>} /> {/* For redirect */}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('EditPostPage Component', () => {

  describe('Authenticated User - Owns Post', () => {
    beforeEach(() => {
      api.getPostById.mockResolvedValue({ data: mockPostOwnedByUser });
    });

    it('fetches post data and pre-populates the form', async () => {
      renderEditPostPage();
      await waitFor(() => {
        expect(api.getPostById).toHaveBeenCalledWith(mockPostOwnedByUser._id);
      });
      expect(screen.getByLabelText(/Title:/i)).toHaveValue(mockPostOwnedByUser.title);
      expect(screen.getByLabelText(/Content:/i)).toHaveValue(mockPostOwnedByUser.content);
    });

    it('successfully updates the post and navigates to post page', async () => {
      api.updatePost.mockResolvedValueOnce({ data: { ...mockPostOwnedByUser, title: 'Updated Title' } });
      renderEditPostPage();
      await waitFor(() => { expect(screen.getByLabelText(/Title:/i)).toBeInTheDocument(); });

      fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Updated Title' } });
      fireEvent.change(screen.getByLabelText(/Content:/i), { target: { value: 'Updated content.' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Post/i }));

      await waitFor(() => {
        expect(api.updatePost).toHaveBeenCalledWith(mockPostOwnedByUser._id, {
          title: 'Updated Title',
          content: 'Updated content.',
        });
      });
      expect(mockNavigate).toHaveBeenCalledWith(`/post/${mockPostOwnedByUser._id}`);
    });

    it('shows an error if title is empty on submit', async () => {
        renderEditPostPage();
        await waitFor(() => { expect(screen.getByLabelText(/Title:/i)).toBeInTheDocument(); });
  
        fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: '  ' } }); // Empty title
        fireEvent.click(screen.getByRole('button', { name: /Update Post/i }));
  
        await waitFor(() => {
          expect(screen.getByText('Post title cannot be empty.')).toBeInTheDocument();
        });
        expect(api.updatePost).not.toHaveBeenCalled();
      });

    it('shows an error if update API call fails', async () => {
      api.updatePost.mockRejectedValueOnce({ response: { data: { message: 'Update failed' } } });
      renderEditPostPage();
      await waitFor(() => { expect(screen.getByLabelText(/Title:/i)).toBeInTheDocument(); });

      fireEvent.change(screen.getByLabelText(/Title:/i), { target: { value: 'Good Title' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Post/i }));

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User - Does Not Own Post', () => {
    it('shows authorization error and redirects if user does not own the post', async () => {
      api.getPostById.mockResolvedValue({ data: mockPostNotOwnedByUser }); // Fetched post is not owned by mockUser
      renderEditPostPage({ isAuthenticated: true, user: mockUser }, mockPostNotOwnedByUser._id);

      await waitFor(() => {
        expect(api.getPostById).toHaveBeenCalledWith(mockPostNotOwnedByUser._id);
      });
      expect(await screen.findByText('You are not authorized to edit this post.')).toBeInTheDocument();
      // Check for navigation (depends on setTimeout in component)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/post/${mockPostNotOwnedByUser._id}`);
      }, { timeout: 2500 }); // Wait for potential redirect
    });
  });

  describe('API Errors and Edge Cases', () => {
    it('shows an error if fetching post details fails (e.g., 404 Not Found)', async () => {
      api.getPostById.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Post not found by API' } } });
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Post not found by API')).toBeInTheDocument();
      });
       // Check for navigation to home (depends on setTimeout in component)
       await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      }, { timeout: 2500 });
    });
  });
  
  describe('Unauthenticated User', () => {
    it('redirects to login if user is not authenticated', async () => {
      // The component has a useEffect to navigate to login if !isAuthenticated
      // This assumes ProtectedRoute might not always catch it first or for direct nav.
      renderEditPostPage({ isAuthenticated: false, user: null });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: `/edit-post/${mockParams.postId}` } });
      });
    });
  });
});
