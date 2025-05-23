import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CommunityPage from './CommunityPage';
import * as api from '../services/api';

// Mock API calls
jest.mock('../services/api', () => ({
  getCommunityById: jest.fn(),
  getPostsByCommunity: jest.fn(),
  deletePost: jest.fn(),
}));

// Mock components
jest.mock('../components/Vote', () => ({ entityId, entityType, initialScore }) => (
  <div data-testid={`vote-mock-${entityId}`}>Vote (Score: {initialScore})</div>
));

const mockNavigate = jest.fn();
const mockParams = { communityId: 'comm1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
}));

const mockUser = { _id: 'user123', id: 'user123', username: 'TestUser' };
const mockCommunity = {
  _id: 'comm1',
  id: 'comm1',
  name: 'Awesome Community',
  description: 'A place for awesome things.',
  createdAt: new Date().toISOString(),
};
const mockPosts = [
  { _id: 'post1', id: 'post1', title: 'Post 1 in Comm1 by TestUser', author: mockUser, score: 10, createdAt: new Date().toISOString() },
  { _id: 'post2', id: 'post2', title: 'Post 2 in Comm1 by OtherUser', author: { _id: 'user456', id: 'user456', username: 'OtherUser' }, score: 5, createdAt: new Date().toISOString() },
];

const renderCommunityPage = (authState = { isAuthenticated: true, user: mockUser }) => {
  api.getCommunityById.mockResolvedValue({ data: mockCommunity });
  api.getPostsByCommunity.mockResolvedValue({ data: [...mockPosts] }); // Return a copy
  api.deletePost.mockClear();

  return render(
    <AuthContext.Provider value={authState}>
      <MemoryRouter initialEntries={[`/community/${mockCommunity._id}`]}>
        <Routes>
          <Route path="/community/:communityId" element={<CommunityPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('CommunityPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display Community Details and Posts', () => {
    it('fetches and displays community details and its posts', async () => {
      renderCommunityPage({ isAuthenticated: false, user: null });
      await waitFor(() => {
        expect(api.getCommunityById).toHaveBeenCalledWith(mockCommunity._id);
        expect(api.getPostsByCommunity).toHaveBeenCalledWith(mockCommunity._id);
      });

      expect(screen.getByText(mockCommunity.name)).toBeInTheDocument();
      expect(screen.getByText(mockCommunity.description)).toBeInTheDocument();
      expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
    });
  });

  describe('Author Username Links', () => {
    it('renders author usernames as links to their profiles', async () => {
      renderCommunityPage({ isAuthenticated: false, user: null });
      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      });

      mockPosts.forEach(post => {
        if (post.author) {
          // The text might be "Posted by username" or similar, so we find the link containing the username
          const authorLink = screen.getByText(new RegExp(post.author.username)).closest('a');
          expect(authorLink).toBeInTheDocument();
          expect(authorLink).toHaveAttribute('href', `/profile/${post.author._id || post.author.id}`);
        }
      });
    });
  });

  describe('Conditional Edit/Delete Buttons', () => {
    const authState = { isAuthenticated: true, user: mockUser };

    it('shows Edit/Delete buttons for posts authored by the logged-in user', async () => {
      renderCommunityPage(authState);
      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      });

      // Post 1 (authored by mockUser)
      const post1Item = screen.getByText(mockPosts[0].title).closest(`.${styles.postItem}`); // Assuming styles.postItem
      // This test will fail if styles.postItem is not available or if the component structure is different.
      // We'll use a more robust way if needed, like finding the article/div containing the title.
      // For now, we assume a structure where buttons are near the title.
      // A better approach might be to add data-testid to the post container.
      // We'll assume each post item is a 'div' directly under a 'div' with class 'postList'
      // or simply look for the closest generic container like 'article' or 'div'.
      // To make it more robust, one might add data-testid="post-item-${post._id}" in CommunityPage.js
      
      const post1Container = screen.getByText(mockPosts[0].title).closest('div.card, li, article, div'); // More generic
      expect(post1Container).toBeInTheDocument();
      expect(within(post1Container).getByRole('link', { name: /Edit/i })).toBeInTheDocument();
      expect(within(post1Container).getByRole('button', { name: /Delete/i })).toBeInTheDocument();

      // Post 2 (authored by OtherUser)
      const post2Container = screen.getByText(mockPosts[1].title).closest('div.card, li, article, div');
      expect(post2Container).toBeInTheDocument();
      expect(within(post2Container).queryByRole('link', { name: /Edit/i })).not.toBeInTheDocument();
      expect(within(post2Container).queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });
    
    it('handles post deletion successfully', async () => {
      api.getCommunityById.mockResolvedValue({ data: mockCommunity });
      api.getPostsByCommunity.mockResolvedValue({ data: [...mockPosts] });
      api.deletePost.mockResolvedValueOnce({});
      window.confirm = jest.fn(() => true);

      renderCommunityPage(authState);

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      });
      
      const post1Container = screen.getByText(mockPosts[0].title).closest('div.card, li, article, div');
      expect(post1Container).toBeInTheDocument();
      const deleteButtonPost1 = within(post1Container).getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButtonPost1);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
      await waitFor(() => {
        expect(api.deletePost).toHaveBeenCalledWith(mockPosts[0]._id);
      });
      expect(screen.queryByText(mockPosts[0].title)).not.toBeInTheDocument();
      expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument(); // Other post still there
    });

    it('shows an error message if post deletion fails', async () => {
      api.getCommunityById.mockResolvedValue({ data: mockCommunity });
      api.getPostsByCommunity.mockResolvedValue({ data: [...mockPosts] });
      api.deletePost.mockRejectedValueOnce({ response: { data: { message: 'Deletion failed here' } } });
      window.confirm = jest.fn(() => true);

      renderCommunityPage(authState);

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
      });

      const post1Container = screen.getByText(mockPosts[0].title).closest('div.card, li, article, div');
      expect(post1Container).toBeInTheDocument();
      fireEvent.click(within(post1Container).getByRole('button', { name: /Delete/i }));

      await waitFor(() => {
        expect(screen.getByText('Deletion failed here')).toBeInTheDocument();
      });
      expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument(); // Post still there
    });
  });
});
