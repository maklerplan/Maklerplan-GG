import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Subscriptions
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>PLZ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.customer_name}</TableCell>
                <TableCell>{sub.plz}</TableCell>
                <TableCell>{sub.status}</TableCell>
                <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Subscriptions;
