import React from 'react';
import {
  Box, Typography, TextField, Switch, Button, Chip, Tooltip, Divider, Alert, Skeleton,
} from '@mui/material';
import { Card } from '../../../components/ui/Card';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { PlatformSetting } from '../../../types/settings';

/**
 * Runtime configuration, editable without a redeploy.
 *
 * Two things are deliberately visible for every field: whether the value is an override
 * or the deployed default, and whether saving it actually takes effect now. Hiding
 * either leaves an operator believing a change is live when it is not.
 */
export const PlatformConfiguration: React.FC = () => {
  const {
    data, loading, saving, error, dirtyCount,
    valueOf, setDraft, save, reset, discard,
  } = usePlatformSettings();

  if (loading) {
    return (
      <Card title="Platform Configuration">
        <Skeleton variant="rectangular" height={280} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Platform Configuration">
        <ErrorAlert error={error} />
      </Card>
    );
  }

  const renderField = (setting: PlatformSetting) => {
    const current = valueOf(setting.key, setting.value);

    return (
      <Box
        key={setting.key}
        sx={{
          display: 'flex', gap: 3, alignItems: 'flex-start',
          py: 2, borderBottom: '1px solid #f0f2f4',
          '&:last-of-type': { borderBottom: 'none' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#24292e' }}>
              {setting.label}
            </Typography>

            {setting.overridden && (
              <Tooltip title={`Deployed value: ${setting.defaultValue || '(empty)'}`}>
                <Chip label="Overridden" size="small" color="primary" variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }} />
              </Tooltip>
            )}

            {/* Spring binds these at startup. Saying so on the field is the only place
                an operator will actually read it. */}
            {setting.restartRequired && (
              <Tooltip title="Saved immediately, but the running application keeps the old value until it restarts">
                <Chip label="Restart required" size="small" color="warning" variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }} />
              </Tooltip>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: '#586069', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
            {setting.description}
          </Typography>

          <Typography variant="caption"
                      sx={{ color: '#8a9096', display: 'block', mt: 0.5, fontFamily: 'monospace', fontSize: '0.68rem' }}>
            {setting.key}
          </Typography>
        </Box>

        <Box sx={{ width: 260, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          {setting.type === 'BOOLEAN' ? (
            <Switch
              checked={String(current).toLowerCase() === 'true'}
              onChange={(e) => setDraft(setting.key, e.target.checked ? 'true' : 'false')}
            />
          ) : (
            <TextField
              size="small"
              fullWidth
              value={current}
              type={setting.type === 'INTEGER' || setting.type === 'DECIMAL' ? 'number' : 'text'}
              // MUI v9 moved inputProps under slotProps.htmlInput.
              slotProps={setting.type === 'DECIMAL' ? { htmlInput: { step: '0.01' } } : undefined}
              onChange={(e) => setDraft(setting.key, e.target.value)}
              placeholder={setting.defaultValue ?? ''}
            />
          )}

          {/* Only offered where there is an override to remove. */}
          {setting.overridden && (
            <Tooltip title="Revert to the deployed value">
              <Button size="small" onClick={() => void reset(setting.key)} sx={{ minWidth: 0, px: 1 }}>
                Reset
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card
        title="Platform Configuration"
        subtitle={`${data?.settingCount ?? 0} settings, ${data?.overriddenCount ?? 0} overridden`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {dirtyCount > 0 && (
              <Button size="small" onClick={discard} disabled={saving}>
                Discard
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={() => void save()}
              disabled={dirtyCount === 0 || saving}
            >
              {saving ? 'Saving...' : dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}` : 'Save'}
            </Button>
          </Box>
        }
      >
        {/* The policy comes from the API rather than being restated here, so the UI
            cannot drift from what the backend actually enforces. */}
        <Alert severity="info" sx={{ mb: 2 }}>
          {data?.note}
        </Alert>

        {data?.categories.map((group, index) => (
          <Box key={group.category}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            <Typography
              variant="overline"
              sx={{ color: '#586069', fontWeight: 700, letterSpacing: '0.6px' }}
            >
              {group.category}
            </Typography>
            <Box sx={{ mt: 1 }}>{group.settings.map(renderField)}</Box>
          </Box>
        ))}
      </Card>
    </Box>
  );
};
