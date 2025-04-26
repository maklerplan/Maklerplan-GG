import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Geo Lead Distribution
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Dashboard
        </Button>
        <Button color="inherit" component={Link} to="/customers">
          Customers
        </Button>
        <Button color="inherit" component={Link} to="/subscriptions">
          Subscriptions
        </Button>
        <Button color="inherit" component={Link} to="/leads">
          Leads
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
