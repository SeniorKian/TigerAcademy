// TigerApp UI Kit — Barrel Export
// Usage: import { Button, Card, ... } from '@/design-system';

export { ds, spacing, typography, colors, radii, shadows, breakpoints, zIndex, transitions, layouts } from './tokens';
export { confirmAction, showError, showSuccess, requestUrl, apiErrorMessage } from './feedback';

export {
  // Layout
  Container, Section, SectionHeader, Stack, Grid, Divider,
  // Typography
  Heading, Text, Label, Caption,
  // Forms
  Input, Textarea, Select, Checkbox, Switch,
  // Buttons
  Button,
  // Display
  Card, Badge, Avatar, AvatarGroup, PriceDisplay,
  // Feedback
  Alert, Spinner, Skeleton, EmptyState, Progress,
  ToastProvider, useToast,
  // Navigation
  Breadcrumb, Tabs, Pagination,
  // Overlays
  Modal, Tooltip,
  // Data
  DataTable, StatCard, PageHeader,
} from './components';
