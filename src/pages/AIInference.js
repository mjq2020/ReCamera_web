import React, { useState } from 'react';
import './PageStyles.css';
import InferencePage from '../components/inference/Inference';
const AIInference = () => {
  const [enableAI, setEnableAI] = useState(true);
  const [selectedTask, setSelectedTask] = useState('detection');

  return (
    <div className="page-container">
      <InferencePage></InferencePage>
    </div>
  );
};

export default AIInference;

