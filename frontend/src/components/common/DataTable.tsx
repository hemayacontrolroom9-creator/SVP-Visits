import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, Box, CircularProgress,
  Typography, Checkbox,
} from '@mui/material';
import EmptyState from './EmptyState';

export interface Column<T> {
  id: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  rowsPerPage: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  selectable?: boolean;
  selected?: string[];
  getRowId: (row: T) => string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (ids: string[]) => void;
}

export default function DataTable<T>({
  columns, rows, total, page, rowsPerPage, loading = false,
  emptyTitle = 'No data found', emptyDescription, selectable = false,
  selected = [], getRowId, onPageChange, onRowsPerPageChange,
  onRowClick, onSelectionChange,
}: DataTableProps<T>) {
  const allSelected = rows.length > 0 && rows.every(r => selected.includes(getRowId(r)));
  const someSelected = rows.some(r => selected.includes(getRowId(r))) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rows.map(getRowId));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    size="small"
                  />
                </TableCell>
              )}
              {columns.map(col => (
                <TableCell
                  key={col.id}
                  align={col.align ?? 'left'}
                  sx={{ width: col.width, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const id = getRowId(row);
                const isSelected = selected.includes(id);
                return (
                  <TableRow
                    key={id}
                    hover
                    selected={isSelected}
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" onClick={e => { e.stopPropagation(); toggleRow(id); }}>
                        <Checkbox checked={isSelected} size="small" />
                      </TableCell>
                    )}
                    {columns.map(col => (
                      <TableCell key={col.id} align={col.align ?? 'left'}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => onPageChange(p)}
        onRowsPerPageChange={e => onRowsPerPageChange(parseInt(e.target.value, 10))}
      />
    </Paper>
  );
}
