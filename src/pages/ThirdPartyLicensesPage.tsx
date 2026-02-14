import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';

interface License {
  name: string;
  version: string;
  license: string;
  repository: string;
  homepage: string;
  licenseText: string;
}

function ThirdPartyLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/licenses.json');
        if (!response.ok) {
          throw new Error(`Failed to load licenses: ${response.statusText}`);
        }
        const data = await response.json();
        setLicenses(data);
        setFilteredLicenses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load licenses');
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = licenses.filter(
      (license) =>
        license.name.toLowerCase().includes(query) ||
        license.license.toLowerCase().includes(query)
    );
    setFilteredLicenses(filtered);
  }, [searchQuery, licenses]);

  const getLicenseTypeColor = (licenseType: string): 'default' | 'primary' | 'error' => {
    const permissiveLicenses = ['MIT', 'Apache-2.0', 'BSD', 'ISC', 'Apache'];
    const copyleft = ['GPL', 'AGPL'];

    if (copyleft.some((l) => licenseType.includes(l))) {
      return 'error';
    }
    if (permissiveLicenses.some((l) => licenseType.includes(l))) {
      return 'primary';
    }
    return 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Third Party Licenses
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Third Party Licenses
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This project uses {licenses.length} open-source packages. Below is a complete list of
            all dependencies and their licenses.
          </Typography>
        </Box>

        <TextField
          fullWidth
          placeholder="Search by package name or license type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />

        <Typography variant="body2" color="textSecondary">
          Found {filteredLicenses.length} package{filteredLicenses.length !== 1 ? 's' : ''}
        </Typography>

        <Stack spacing={2}>
          {filteredLicenses.map((license) => (
            <Card key={license.name} sx={{ cursor: 'pointer' }}>
              <CardContent
                onClick={() =>
                  setExpandedLicense(expandedLicense === license.name ? null : license.name)
                }
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{license.name}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      v{license.version}
                    </Typography>
                  </Box>
                  <Chip
                    label={license.license}
                    color={getLicenseTypeColor(license.license)}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {license.repository && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <a href={license.repository} target="_blank" rel="noopener noreferrer">
                      Repository
                    </a>
                  </Typography>
                )}

                {expandedLicense === license.name && license.licenseText && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      License Text:
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: '#f5f5f5',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: '300px',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {license.licenseText}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

export default ThirdPartyLicensesPage;
