import React from 'react';
import { Container, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome to the Geo Lead Distribution System dashboard. Here you can monitor system status and key metrics.
      </Typography>
      {/* Future: Add charts and stats */}
    </Container>
  );
};

export default Dashboard;
