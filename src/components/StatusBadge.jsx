import React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Truck,
  CheckCheck,
  AlertTriangle,
  Package,
} from 'lucide-react';
import './StatusBadge.css';

export default function StatusBadge({ status, label, icon = true }) {
  const normStatus = String(status || '').toLowerCase();

  let displayLabel = label;
  let IconComponent = null;

  switch (normStatus) {
    case 'pending_fpo':
      displayLabel = displayLabel || 'Pending Review';
      IconComponent = Clock;
      break;
    case 'approved':
      displayLabel = displayLabel || 'Approved';
      IconComponent = CheckCircle;
      break;
    case 'rejected':
      displayLabel = displayLabel || 'Rejected';
      IconComponent = XCircle;
      break;
    case 'auto_rejected':
      displayLabel = displayLabel || 'Auto-Rejected';
      IconComponent = AlertOctagon;
      break;
    case 'placed':
      displayLabel = displayLabel || 'Placed';
      IconComponent = Package;
      break;
    case 'grouped':
      displayLabel = displayLabel || 'Grouped';
      IconComponent = Clock;
      break;
    case 'shipped':
      displayLabel = displayLabel || 'In Transit';
      IconComponent = Truck;
      break;
    case 'delivered':
      displayLabel = displayLabel || 'Delivered';
      IconComponent = CheckCheck;
      break;
    case 'flagged':
      displayLabel = displayLabel || 'Price Flagged';
      IconComponent = AlertTriangle;
      break;
    default:
      displayLabel = displayLabel || status;
  }

  return (
    <span className={`status-badge status-badge-${normStatus}`}>
      {icon && IconComponent && <IconComponent size={13} strokeWidth={1.75} />}
      <span>{displayLabel}</span>
    </span>
  );
}
