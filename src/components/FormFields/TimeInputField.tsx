import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
} from '@mui/material';
import type { TimeDisplaySettings } from '../../types/editor';

interface TimeInputFieldProps {
  label: string;
  timeValue: string | undefined;
  settings: TimeDisplaySettings | undefined;
  onTimeChange: (value: string) => void;
  onSettingsChange: (settings: TimeDisplaySettings) => void;
  isPassStation?: boolean;
}

/**
 * Shared time input component for ArriveTime and DepartureTime
 * Handles both time input (0:00:00 format from midnight) and display settings
 */
export function TimeInputField({
  label,
  timeValue,
  settings,
  onTimeChange,
  onSettingsChange,
  isPassStation = false,
}: TimeInputFieldProps) {
  const defaultSettings: TimeDisplaySettings = {
    showTime: true,
    showHours: true,
    showArrowForPass: false,
    customText: undefined,
  };

  const currentSettings = settings || defaultSettings;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(e.target.value);
  };

  const handleShowTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      showTime: e.target.checked,
    });
  };

  const handleShowHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      showHours: e.target.checked,
    });
  };

  const handleShowArrowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      showArrowForPass: e.target.checked,
    });
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onSettingsChange({
      ...currentSettings,
      customText: text || undefined,
    });
  };

  return (
    <Box>
      <Stack spacing={2}>
        <TextField
          label={label}
          type="time"
          value={timeValue || ''}
          onChange={handleTimeChange}
          inputProps={{
            step: 1,
          }}
          fullWidth
          variant="outlined"
        />

        <Divider />

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={currentSettings.showTime}
                onChange={handleShowTimeChange}
              />
            }
            label="Show time"
          />
          {currentSettings.showTime && (
            <Box sx={{ ml: 4, mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentSettings.showHours}
                    onChange={handleShowHoursChange}
                  />
                }
                label="Show hours (HH). If unchecked, format as :MM:SS"
              />
            </Box>
          )}
        </Box>

        {isPassStation && (
          <FormControlLabel
            control={
              <Checkbox
                checked={currentSettings.showArrowForPass}
                onChange={handleShowArrowChange}
              />
            }
            label='Show "↓" arrow for pass station instead of time'
          />
        )}

        <TextField
          label="Custom text (overrides time display)"
          value={currentSettings.customText || ''}
          onChange={handleCustomTextChange}
          placeholder="e.g. 連絡"
          fullWidth
          variant="outlined"
          helperText="If set, this text will be displayed instead of the time"
        />
      </Stack>
    </Box>
  );
}
