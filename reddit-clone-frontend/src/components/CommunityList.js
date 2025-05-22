import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCommunities } from '../services/api';
import styles from './CommunityList.module.css'; // Import CSS module

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

  // Apply styles to the main container, heading, list, list items, and links
  return (
    <div className={styles.communityListContainer}>
      <h3 className={styles.listHeading}>Communities</h3>
      <ul className={styles.list}>
        {communities.map((community) => (
          <li key={community._id || community.id} className={styles.listItem}>
            <Link 
              to={`/community/${community._id || community.id}`} 
              className={styles.link}
            >
              {community.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityList;
