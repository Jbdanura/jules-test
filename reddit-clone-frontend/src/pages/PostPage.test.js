import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import PostPage from './PostPage';
import { getPostById, getCommentsByPostId, deletePost as apiDeletePost, createComment as apiCreateComment } from '../services/api';

// Mock services/api
jest.mock('../services/api');

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Import and retain default behavior
  useParams: () => ({ postId: '1' }), // Mock useParams
  useNavigate: () => mockNavigate, // Mock useNavigate
}));

const mockPost = {
  _id: '1', // Use _id to match typical MongoDB IDs if your component uses that
  id: '1', // Keep id as well if component might use it as fallback
  title: 'Test Post Title',
  content: 'This is the content of the test post.',
  author: { id: 'author123', _id: 'author123', username: 'TestAuthor' },
  community: { id: 'c1', _id: 'c1', name: 'TestCommunity' },
  likeCount: 10,
  dislikeCount: 2,
  createdAt: new Date().toISOString(),
  // score: 8, // If your component expects score directly, though it's calculated in Vote
};

const mockComments = [
  { _id: 'comment1', id: 'comment1', content: 'First test comment', author: { username: 'Commenter1' }, createdAt: new Date().toISOString(), likeCount: 5, dislikeCount: 1 },
  { _id: 'comment2', id: 'comment2', content: 'Second test comment', author: { username: 'Commenter2' }, createdAt: new Date().toISOString(), likeCount: 3, dislikeCount: 0 },
];

const defaultAuthContextValue = (isAuthenticated, user) => ({
  isAuthenticated,
  user,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUserConfig: jest.fn(),
  fetchUserConfig: jest.fn(),
});

const renderPostPage = (authContextValue) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter initialEntries={['/post/1']}>
        <Routes>
          <Route path="/post/:postId" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('PostPage Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    getPostById.mockReset();
    getCommentsByPostId.mockReset();
    apiDeletePost.mockReset();
    apiCreateComment.mockReset();
    mockNavigate.mockReset();

    // Default mocks for successful API calls
    getPostById.mockResolvedValue({ data: mockPost });
    getCommentsByPostId.mockResolvedValue({ data: mockComments });
    apiCreateComment.mockResolvedValue({ data: { comment: { _id: 'newComment', content: 'New test comment', author: { username: 'CurrentUser' }, createdAt: new Date().toISOString(), likeCount: 0, dislikeCount: 0 } } });
    apiDeletePost.mockResolvedValue({ data: { message: "Post deleted successfully" } });
  });

  test('renders post details and comments correctly', async () => {
    renderPostPage(defaultAuthContextValue(false, null));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
      expect(screen.getByText(mockPost.content)).toBeInTheDocument();
      expect(screen.getByText(`By: ${mockPost.author.username}`)).toBeInTheDocument();
      expect(screen.getByText(mockPost.community.name)).toBeInTheDocument();
      // Check for initial score from Vote component (10 likes - 2 dislikes = 8)
      expect(screen.getByText('8')).toBeInTheDocument(); 
    });

    // Check for comments
    expect(screen.getByText('First test comment')).toBeInTheDocument();
    expect(screen.getByText('Second test comment')).toBeInTheDocument();
  });

  test('owner sees Edit and Delete buttons', async () => {
    const ownerUser = { id: 'author123', _id: 'author123', username: 'TestAuthor' };
    renderPostPage(defaultAuthContextValue(true, ownerUser));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument(); // Ensure post has loaded
    });

    expect(screen.getByRole('button', { name: /edit post/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
  });

  test('non-owner does NOT see Edit and Delete buttons', async () => {
    const nonOwnerUser = { id: 'user456', _id: 'user456', username: 'AnotherUser' };
    renderPostPage(defaultAuthContextValue(true, nonOwnerUser));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /edit post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete post/i })).not.toBeInTheDocument();
  });

  test('unauthenticated user does NOT see Edit and Delete buttons', async () => {
    renderPostPage(defaultAuthContextValue(false, null));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /edit post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete post/i })).not.toBeInTheDocument();
  });
  
  test('unauthenticated user sees login prompt for commenting', async () => {
    renderPostPage(defaultAuthContextValue(false, null));
    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });
    expect(screen.getByText(/Please login to post a comment/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Commenting as/i)).not.toBeInTheDocument();
  });

  test('authenticated user can submit a comment', async () => {
    const currentUser = { id: 'user789', _id: 'user789', username: 'CommenterUser' };
    renderPostPage(defaultAuthContextValue(true, currentUser));
    
    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });

    const commentTextarea = screen.getByPlaceholderText(`Commenting as ${currentUser.username}...`);
    fireEvent.change(commentTextarea, { target: { value: 'New test comment' } });
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      // Expect the new comment to appear (mocked response)
      expect(screen.getByText('New test comment')).toBeInTheDocument();
      // Also check that the textarea is cleared
      expect(commentTextarea.value).toBe('');
    });
    expect(apiCreateComment).toHaveBeenCalledWith('1', { content: 'New test comment' });
  });
  
  test('handles post deletion correctly by the owner', async () => {
    // Mock window.confirm to automatically confirm
    window.confirm = jest.fn(() => true);

    const ownerUser = { id: 'author123', _id: 'author123', username: 'TestAuthor' };
    renderPostPage(defaultAuthContextValue(true, ownerUser));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete post/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(apiDeletePost).toHaveBeenCalledWith('1');
    });
    // Check if navigation to homepage occurred
    expect(mockNavigate).toHaveBeenCalledWith('/'); 
  });

  test('handles post not found', async () => {
    getPostById.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Post not found.' } } });
    renderPostPage(defaultAuthContextValue(false, null));

    await waitFor(() => {
      expect(screen.getByText('Post not found.')).toBeInTheDocument();
    });
  });

  test('handles error loading comments', async () => {
    getCommentsByPostId.mockRejectedValueOnce(new Error('Failed to fetch comments'));
    renderPostPage(defaultAuthContextValue(false, null));

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument(); // Post loads
      expect(screen.getByText(/error loading comments: failed to fetch comments/i)).toBeInTheDocument();
    });
  });
});
