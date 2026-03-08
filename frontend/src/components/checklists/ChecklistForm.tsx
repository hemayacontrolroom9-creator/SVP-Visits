import React, { useState } from 'react';
import {
  Box, Typography, TextField, FormControlLabel, Switch,
  Slider, Rating, Button, Stack, Divider, Alert, CircularProgress,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DrawIcon from '@mui/icons-material/Draw';
import { ChecklistTemplate, ChecklistItem } from '../../types';

interface ChecklistFormProps {
  template: ChecklistTemplate;
  visitId: string;
  onSubmit: (responses: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export default function ChecklistForm({ template, visitId, onSubmit, loading = false }: ChecklistFormProps) {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const setValue = (itemId: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missing = template.items.filter(item => item.required && !responses[item.id]);
    if (missing.length > 0) {
      setError(`Please complete required fields: ${missing.map(m => m.label).join(', ')}`);
      return;
    }
    setError(null);
    await onSubmit(responses);
  };

  const renderField = (item: ChecklistItem) => {
    switch (item.type) {
      case 'yes_no':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(responses[item.id])}
                onChange={e => setValue(item.id, e.target.checked)}
              />
            }
            label={responses[item.id] ? 'Yes' : 'No'}
          />
        );
      case 'text':
        return (
          <TextField
            fullWidth size="small" multiline rows={2}
            placeholder="Enter your response..."
            value={(responses[item.id] as string) ?? ''}
            onChange={e => setValue(item.id, e.target.value)}
          />
        );
      case 'number':
        return (
          <TextField
            type="number" size="small" sx={{ width: 160 }}
            value={(responses[item.id] as string) ?? ''}
            onChange={e => setValue(item.id, e.target.value)}
          />
        );
      case 'rating':
        return (
          <Rating
            value={(responses[item.id] as number) ?? 0}
            onChange={(_, v) => setValue(item.id, v)}
            max={5} size="large"
          />
        );
      case 'photo':
        return (
          <Button variant="outlined" startIcon={<PhotoCameraIcon />} size="small" component="label">
            {responses[item.id] ? 'Photo attached ✓' : 'Take / Upload Photo'}
            <input type="file" accept="image/*" hidden onChange={e => {
              const file = e.target.files?.[0];
              if (file) setValue(item.id, file);
            }} />
          </Button>
        );
      case 'signature':
        return (
          <Button variant="outlined" startIcon={<DrawIcon />} size="small">
            {responses[item.id] ? 'Signature captured ✓' : 'Capture Signature'}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={0.5}>{template.name}</Typography>
      {template.description && (
        <Typography variant="body2" color="text.secondary" mb={2}>{template.description}</Typography>
      )}
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={3}>
        {template.items.map((item, idx) => (
          <Box key={item.id}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              {idx + 1}. {item.label}
              {item.required && <Typography component="span" color="error.main"> *</Typography>}
            </Typography>
            {renderField(item)}
          </Box>
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained" size="large" onClick={handleSubmit}
          disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          Submit Checklist
        </Button>
      </Box>
    </Box>
  );
}
