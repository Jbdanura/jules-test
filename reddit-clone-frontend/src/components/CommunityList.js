import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCommunities } from '../services/api';

const CommunityList = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await getAllCommunities();
        setCommunities(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch communities');
        console.error("Fetch communities error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  if (loading) {
    return <p>Loading communities...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (communities.length === 0) {
    return <p>No communities found.</p>;
  }

  return (
    <div>
      <h3>Communities</h3>
      <ul>
        {communities.map((community) => (
          <li key={community._id || community.id}>
            {/* Assuming community object has _id or id, and name. 
                Backend uses 'name' for display and potentially 'id' or '_id' as primary key.
                The route is /community/:communityId. We'll use community._id or community.id for the link.
            */}
            <Link to={`/community/${community._id || community.id}`}>{community.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityList;
