import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return format(dateObj, "MMM dd, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
}

export function formatDateTime(date: Date | string) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return format(dateObj, "MMM dd, yyyy 'at' h:mm a");
  } catch (error) {
    return "Invalid Date";
  }
}

export function formatRelativeTime(date: Date | string) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return "Invalid Date";
  }
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "priority-high"
    case "medium":
      return "priority-medium"
    case "low":
      return "priority-low"
    default:
      return "priority-low"
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return "status-new"
    case "in-progress":
      return "status-in-progress"
    case "resolved":
      return "status-resolved"
    case "closed":
      return "status-closed"
    default:
      return "status-new"
  }
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return "⚪"
    case "in-progress":
      return "🟡"
    case "resolved":
      return "🟢"
    case "closed":
      return "⚫"
    default:
      return "⚪"
  }
}

export function getPriorityIcon(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "🔴"
    case "medium":
      return "🟡"
    case "low":
      return "🟢"
    default:
      return "🟢"
  }
}
