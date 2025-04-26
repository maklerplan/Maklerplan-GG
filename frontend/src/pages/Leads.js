import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

const Leads = () => {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get('/api/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Leads
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PLZ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Processed At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.plz}</TableCell>
                <TableCell>{lead.status}</TableCell>
                <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
                <TableCell>{lead.processed_at ? new Date(lead.processed_at).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Leads;
