import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import PostPage from './PostPage';
import * as api from '../services/api';

// Mock API calls
jest.mock('../services/api', () => ({
  getPostById: jest.fn(),
  getCommentsByPostId: jest.fn(),
  createComment: jest.fn(),
  deletePost: jest.fn(), // For Edit/Delete buttons on PostPage itself
}));

// Mock react-router-dom's useParams and useNavigate
const mockNavigate = jest.fn();
const mockParams = { postId: 'post123' }; // Default mock params

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  // Link component will be rendered as <a>
}));

// Mock CommentItem to simplify testing PostPage's focus
jest.mock('../components/CommentItem', () => ({ comment, formatDate }) => (
  <li data-testid={`comment-${comment._id || comment.id}`}>
    <p>{comment.content}</p>
    <small>By: {comment.author?.username} | On: {formatDate(comment.createdAt)}</small>
  </li>
));


const mockUser = { _id: 'user123', id: 'user123', username: 'TestUser' };
const mockPost = {
  _id: 'post123',
  id: 'post123',
  title: 'Test Post Title',
  content: 'Test post content.',
  author: mockUser,
  community: { _id: 'comm1', id: 'comm1', name: 'Tech Corner' },
  createdAt: new Date().toISOString(),
  score: 10,
};
const mockCommentsList = [
  { _id: 'comment1', id: 'comment1', content: 'First comment!', author: { _id: 'user456', id: 'user456', username: 'Commenter1' }, createdAt: new Date().toISOString() },
  { _id: 'comment2', id: 'comment2', content: 'Second comment.', author: { _id: 'user789', id: 'user789', username: 'Commenter2' }, createdAt: new Date().toISOString() },
];

const renderPostPage = (authState = { isAuthenticated: true, user: mockUser }) => {
  api.getPostById.mockResolvedValue({ data: mockPost });
  api.getCommentsByPostId.mockResolvedValue({ data: mockCommentsList });
  api.createComment.mockClear();
  api.deletePost.mockClear();

  return render(
    <AuthContext.Provider value={authState}>
      <MemoryRouter initialEntries={[`/post/${mockPost._id}`]}>
        <Routes>
          <Route path="/post/:postId" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('PostPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockPost author to be the logged-in user by default for Edit/Delete tests
    mockPost.author = mockUser; 
  });

  it('fetches and displays post details and comments', async () => {
    renderPostPage();
    await waitFor(() => {
      expect(api.getPostById).toHaveBeenCalledWith(mockPost._id);
      expect(api.getCommentsByPostId).toHaveBeenCalledWith(mockPost._id);
    });

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText('Test post content.')).toBeInTheDocument();
    
    // Verify author link
    const authorLink = screen.getByText(mockPost.author.username).closest('a');
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', `/profile/${mockPost.author._id}`);
    
    expect(screen.getByText('First comment!')).toBeInTheDocument();
    expect(screen.getByText('Second comment.')).toBeInTheDocument();
  });

  describe('Comment Submission', () => {
    it('allows authenticated users to submit a comment', async () => {
      const newCommentContent = 'This is a new comment.';
      const newCommentResponse = {
        comment: { _id: 'comment3', id: 'comment3', content: newCommentContent, author: mockUser, createdAt: new Date().toISOString() }
      };
      api.createComment.mockResolvedValueOnce({ data: newCommentResponse });
      
      renderPostPage(); // Authenticated by default

      await waitFor(() => { // Wait for initial post and comments to load
        expect(screen.getByText('First comment!')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(`Commenting as ${mockUser.username}...`);
      fireEvent.change(textarea, { target: { value: newCommentContent } });
      fireEvent.click(screen.getByRole('button', { name: /Post Comment/i }));

      await waitFor(() => {
        expect(api.createComment).toHaveBeenCalledWith(mockPost._id, { content: newCommentContent });
      });
      // Check for optimistic update or new comment in list
      expect(screen.getByText(newCommentContent)).toBeInTheDocument();
      expect(textarea.value).toBe(''); // Textarea cleared
    });

    it('shows an error if comment submission fails', async () => {
        api.createComment.mockRejectedValueOnce({ response: { data: { message: 'Comment submission failed' } } });
        renderPostPage();
        await waitFor(() => { expect(screen.getByText('First comment!')).toBeInTheDocument(); });
  
        fireEvent.change(screen.getByPlaceholderText(`Commenting as ${mockUser.username}...`), { target: { value: 'A new comment' } });
        fireEvent.click(screen.getByRole('button', { name: /Post Comment/i }));
  
        await waitFor(() => {
          expect(screen.getByText('Comment submission failed')).toBeInTheDocument();
        });
      });

    it('prevents unauthenticated users from seeing the comment form', () => {
      renderPostPage({ isAuthenticated: false, user: null });
      expect(screen.queryByPlaceholderText(/Commenting as/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Please login to post a comment./i)).toBeInTheDocument();
    });

    it('validates against empty comment submission', async () => {
        renderPostPage();
        await waitFor(() => { expect(screen.getByText('First comment!')).toBeInTheDocument(); });
  
        fireEvent.click(screen.getByRole('button', { name: /Post Comment/i })); // Submit empty comment
  
        await waitFor(() => {
          expect(screen.getByText('Comment cannot be empty.')).toBeInTheDocument();
        });
        expect(api.createComment).not.toHaveBeenCalled();
      });
  });

  describe('Post Edit/Delete Buttons (on PostPage)', () => {
    it('shows Edit/Delete buttons if user is the author', async () => {
      renderPostPage(); // mockPost.author is mockUser by default
      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('hides Edit/Delete buttons if user is not the author', async () => {
      mockPost.author = { _id: 'otherUser123', id: 'otherUser123', username: 'OtherAuthor' }; // Different author
      renderPostPage();
      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });
      expect(screen.queryByRole('link', { name: /Edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });

    it('handles post deletion from PostPage', async () => {
        renderPostPage(); // mockPost.author is mockUser
        await waitFor(() => { expect(screen.getByRole('link', { name: /Edit/i })).toBeInTheDocument(); });
        
        window.confirm = jest.fn(() => true);
        api.deletePost.mockResolvedValueOnce({});

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
        await waitFor(() => {
            expect(api.deletePost).toHaveBeenCalledWith(mockPost._id);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/'); // Navigates to homepage
    });
  });
});
