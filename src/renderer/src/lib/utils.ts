import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function transformDate(date: Date){
  //transforms from Date to YYYYMMDD format
  return date.toISOString().split('T')[0].replace(/-/g, '')
}