import React, { useState } from 'react';
import './PageStyles.css';
import LivePage from '../components/live_feed/LivePage';

const LiveView = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolution, setResolution] = useState('1920x1080');

  return <LivePage />;
   
};

export default LiveView;

