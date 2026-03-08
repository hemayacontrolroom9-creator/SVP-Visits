import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Card } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Administration</Typography>
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Users" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Roles & Permissions" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Audit Log" />
        </Tabs>
        <Box sx={{ px: 3 }}>
          <TabPanel value={tab} index={0}>
            <Typography variant="body2" color="text.secondary">User management panel - Create, update, and manage user accounts and roles.</Typography>
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <Typography variant="body2" color="text.secondary">Configure role-based access control settings.</Typography>
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <Typography variant="body2" color="text.secondary">Immutable audit log of all system actions.</Typography>
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}
