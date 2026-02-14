/**
 * TRViS Form Field Components
 * Reusable form field components for editing TRViS data models
 */

import { TextField, FormControlLabel, Switch, Stack, Box, Typography, Tooltip } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';

interface FieldConfig {
  enabled: boolean;
  required: boolean;
  description: string;
  min?: number;
  max?: number;
  unit?: string;
  format?: string;
}

interface FormFieldProps {
  label: string;
  value: string | number | boolean | undefined;
  onChange: (value: any) => void;
  config: FieldConfig;
  type?: 'text' | 'number' | 'time' | 'boolean' | 'color' | 'textarea';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  select?: boolean;
  children?: React.ReactNode;
}

export function FormField({
  label,
  value,
  onChange,
  config,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 3,
  select = false,
  children,
}: FormFieldProps) {
  if (!config.enabled) {
    return null;
  }

  const helpText = `${config.description}${config.unit ? ` (${config.unit})` : ''}${
    config.format ? ` - Format: ${config.format}` : ''
  }${config.min !== undefined ? ` - Min: ${config.min}` : ''}${
    config.max !== undefined ? ` - Max: ${config.max}` : ''
  }`;

  if (type === 'boolean') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
        }
        label={
          <Stack direction="row" spacing={1} alignItems="center">
            <span>{label}</span>
            <Tooltip title={helpText}>
              <HelpIcon fontSize="small" sx={{ cursor: 'pointer' }} />
            </Tooltip>
          </Stack>
        }
      />
    );
  }

  if (type === 'color') {
    return (
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">{label}</Typography>
          <Tooltip title={helpText}>
            <HelpIcon fontSize="small" sx={{ cursor: 'pointer' }} />
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <input
            type="color"
            value={value ? `#${value}` : '#000000'}
            onChange={(e) => onChange(e.target.value.substring(1))}
          />
          <TextField
            size="small"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="RRGGBB"
            inputProps={{ maxLength: 6, pattern: '^[0-9a-fA-F]{6}$' }}
          />
        </Stack>
      </Stack>
    );
  }

  return (
    <TextField
      fullWidth
      label={label}
      value={value ?? ''}
      onChange={(e) => {
        if (type === 'number') {
          const num = e.target.value ? Number(e.target.value) : undefined;
          onChange(num);
        } else {
          onChange(e.target.value || undefined);
        }
      }}
      type={type === 'boolean' ? 'checkbox' : type}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      placeholder={placeholder}
      select={select}
      required={config.required}
      helperText={helpText}
      inputProps={{
        min: config.min,
        max: config.max,
        step: type === 'number' ? 0.01 : undefined,
      }}
    >
      {children}
    </TextField>
  );
}

export interface FormFieldGroupProps {
  fields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'time' | 'boolean' | 'color' | 'textarea';
    value: any;
    onChange: (value: any) => void;
    config: FieldConfig;
    placeholder?: string;
  }>;
}

export function FormFieldGroup({ fields }: FormFieldGroupProps) {
  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          value={field.value}
          onChange={field.onChange}
          config={field.config}
          type={field.type}
          placeholder={field.placeholder}
        />
      ))}
    </Stack>
  );
}
