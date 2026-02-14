import { useState, useRef } from 'react';
import {
  Box,
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbItemWithSiblings extends BreadcrumbItem {
  siblings?: BreadcrumbItem[];
}

interface BreadcrumbsProps {
  items: BreadcrumbItemWithSiblings[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeSiblings, setActiveSiblings] = useState<BreadcrumbItem[]>([]);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>, siblings?: BreadcrumbItem[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (siblings && siblings.length > 0) {
      setAnchorEl(event.currentTarget);
      setActiveSiblings(siblings);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setAnchorEl(null);
      setActiveSiblings([]);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    handleMouseLeave();
  };

  const handleSiblingClick = (path: string) => {
    navigate(path);
    setAnchorEl(null);
    setActiveSiblings([]);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box sx={{ mb: 2, py: 1 }}>
        <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const hasSiblings = item.siblings && item.siblings.length > 0;

            if (isLast) {
              return (
                <Typography
                  key={index}
                  color="text.primary"
                  sx={{
                    fontWeight: 'medium',
                    cursor: hasSiblings ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, item.siblings)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
                onClick={() => item.path && navigate(item.path)}
                onMouseEnter={(e) => handleMouseEnter(e, item.siblings)}
                onMouseLeave={handleMouseLeave}
              >
                {item.label}
              </Link>
            );
          })}
        </MuiBreadcrumbs>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setActiveSiblings([]);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        PaperProps={{
          onMouseEnter: handlePopoverMouseEnter,
          onMouseLeave: handlePopoverMouseLeave,
          sx: {
            pointerEvents: 'auto',
            maxHeight: '400px',
            overflowY: 'auto',
          },
        }}
      >
        <Paper elevation={3}>
          <List sx={{ minWidth: 200, maxWidth: 400 }}>
            {activeSiblings.map((sibling, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => sibling.path && handleSiblingClick(sibling.path)}
                  disabled={!sibling.path}
                >
                  <ListItemText
                    primary={sibling.label}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: { overflow: 'hidden', textOverflow: 'ellipsis' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </>
  );
}
