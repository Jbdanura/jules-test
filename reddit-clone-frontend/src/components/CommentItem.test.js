import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom'; // Link needs Router
import CommentItem from './CommentItem';

// Mock Vote component as it's not the focus of this test
jest.mock('./Vote', () => ({ entityId, entityType, initialScore }) => (
  <div data-testid={`vote-mock-${entityId}`}>Vote (Score: {initialScore})</div>
));

// Mock formatDate prop
const mockFormatDate = jest.fn((dateString) => new Date(dateString).toLocaleDateString());

const mockComment = {
  _id: 'comment1',
  id: 'comment1',
  content: 'This is a test comment.',
  author: {
    _id: 'author123',
    id: 'author123',
    username: 'CommentAuthor',
  },
  createdAt: new Date().toISOString(),
  score: 5, // Assuming score is directly on comment for Vote mock
};

const mockCommentWithoutAuthor = {
  _id: 'comment2',
  id: 'comment2',
  content: 'This comment has no author.',
  author: null,
  createdAt: new Date().toISOString(),
  score: 2,
};

const renderCommentItem = (comment) => {
  return render(
    <MemoryRouter>
      <CommentItem comment={comment} formatDate={mockFormatDate} />
    </MemoryRouter>
  );
};

describe('CommentItem Component', () => {
  beforeEach(() => {
    mockFormatDate.mockClear();
  });

  it('renders comment content, author username, and formatted date', () => {
    renderCommentItem(mockComment);

    expect(screen.getByText(mockComment.content)).toBeInTheDocument();
    expect(screen.getByText(mockComment.author.username)).toBeInTheDocument();
    expect(mockFormatDate).toHaveBeenCalledWith(mockComment.createdAt);
    // Check if formatted date is rendered (optional, depends on mockFormatDate's output)
    // For example, if mockFormatDate returns '1/1/2023':
    // expect(screen.getByText(new RegExp(mockFormatDate(mockComment.createdAt)))).toBeInTheDocument();
  });

  it('renders author username as a link to their profile', () => {
    renderCommentItem(mockComment);

    const authorLink = screen.getByText(mockComment.author.username).closest('a');
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', `/profile/${mockComment.author._id || mockComment.author.id}`);
  });

  it('renders "Anonymous" if comment author is null', () => {
    renderCommentItem(mockCommentWithoutAuthor);

    expect(screen.getByText(mockCommentWithoutAuthor.content)).toBeInTheDocument();
    expect(screen.getByText('Anonymous')).toBeInTheDocument(); // As per CommentItem.js logic
    expect(screen.queryByRole('link', { name: 'Anonymous' })).not.toBeInTheDocument(); // Anonymous should not be a link
  });
  
  it('renders Vote component with correct props', () => {
    renderCommentItem(mockComment);
    const voteMock = screen.getByTestId(`vote-mock-${mockComment._id || mockComment.id}`);
    expect(voteMock).toBeInTheDocument();
    expect(voteMock).toHaveTextContent(`Vote (Score: ${mockComment.score})`);
  });
});
