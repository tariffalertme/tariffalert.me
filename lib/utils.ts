import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string into a human-readable format
 * @param date - ISO date string
 * @returns Formatted date string
 */
export function formatDate(date: string): string {
  return format(parseISO(date), 'MMMM d, yyyy')
}

/**
 * Format a date string into a relative time format (e.g., "2 days ago")
 * @param date - ISO date string
 * @returns Relative time string
 */
export function formatRelativeDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Format a date string into a short format (e.g., "Jan 1, 2024")
 * @param date - ISO date string
 * @returns Short formatted date string
 */
export function formatShortDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

/**
 * Format a date string into an ISO format
 * @param date - Date string
 * @returns ISO formatted date string
 */
export function toISODate(date: string): string {
  return new Date(date).toISOString()
} 