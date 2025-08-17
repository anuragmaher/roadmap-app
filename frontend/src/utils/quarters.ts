// Quarter utility functions for date-aware quarter management

export interface Quarter {
  year: number;
  quarter: number;
  label: string; // e.g., "Q1 2025"
  value: string; // e.g., "2025-Q1"
}

/**
 * Get the current quarter based on today's date
 */
export function getCurrentQuarter(): Quarter {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const quarter = Math.ceil(month / 3);
  
  return {
    year,
    quarter,
    label: `Q${quarter} ${year}`,
    value: `${year}-Q${quarter}`
  };
}

/**
 * Get a quarter object from year and quarter number
 */
export function getQuarter(year: number, quarter: number): Quarter {
  const shortYear = year.toString().slice(-2); // Get last 2 digits
  return {
    year,
    quarter,
    label: `Q${quarter} ${shortYear}`,
    value: `${year}-Q${quarter}`
  };
}

/**
 * Parse a quarter value string (e.g., "2025-Q1" or legacy "Q1") into a Quarter object
 */
export function parseQuarterValue(value: string): Quarter {
  // Handle new format: "2025-Q1"
  const newFormatMatch = value.match(/^(\d{4})-Q(\d)$/);
  if (newFormatMatch) {
    const year = parseInt(newFormatMatch[1], 10);
    const quarter = parseInt(newFormatMatch[2], 10);
    return getQuarter(year, quarter);
  }
  
  // Handle legacy format: "Q1"
  const legacyFormatMatch = value.match(/^Q(\d)$/);
  if (legacyFormatMatch) {
    const quarter = parseInt(legacyFormatMatch[1], 10);
    const currentYear = new Date().getFullYear();
    return getQuarter(currentYear, quarter);
  }
  
  throw new Error(`Invalid quarter format: ${value}`);
}

/**
 * Add quarters to a given quarter
 */
export function addQuarters(baseQuarter: Quarter, quarters: number): Quarter {
  let { year, quarter } = baseQuarter;
  
  quarter += quarters;
  
  while (quarter > 4) {
    quarter -= 4;
    year += 1;
  }
  
  while (quarter < 1) {
    quarter += 4;
    year -= 1;
  }
  
  return getQuarter(year, quarter);
}

/**
 * Get the available quarters for the roadmap system
 * Returns 1 quarter before current, current quarter, and 3 quarters after
 */
export function getAvailableQuarters(): Quarter[] {
  const currentQuarter = getCurrentQuarter();
  
  return [
    addQuarters(currentQuarter, -1), // 1 quarter back
    addQuarters(currentQuarter, 0),  // current quarter
    addQuarters(currentQuarter, 1),  // 1 quarter ahead
    addQuarters(currentQuarter, 2),  // 2 quarters ahead
    addQuarters(currentQuarter, 3)   // 3 quarters ahead
  ];
}

/**
 * Check if a quarter value is valid (within the allowed range)
 */
export function isQuarterValid(quarterValue: string): boolean {
  try {
    const quarter = parseQuarterValue(quarterValue);
    const availableQuarters = getAvailableQuarters();
    
    return availableQuarters.some(q => q.value === quarter.value);
  } catch {
    return false;
  }
}

/**
 * Get quarter options for form dropdowns
 */
export function getQuarterOptions(): { value: string; label: string }[] {
  return getAvailableQuarters().map(quarter => ({
    value: quarter.value,
    label: quarter.label
  }));
}

/**
 * Normalize quarter value to new format (handles legacy format)
 */
export function normalizeQuarterValue(value: string): string {
  try {
    const quarter = parseQuarterValue(value);
    return quarter.value;
  } catch {
    return value; // Return as-is if can't parse
  }
}

/**
 * Check if an item belongs to a specific quarter (handles legacy format)
 */
export function itemBelongsToQuarter(itemQuarter: string, targetQuarter: string): boolean {
  try {
    const itemNormalized = normalizeQuarterValue(itemQuarter);
    const targetNormalized = normalizeQuarterValue(targetQuarter);
    return itemNormalized === targetNormalized;
  } catch {
    // Fallback: direct comparison for legacy format
    return itemQuarter === targetQuarter;
  }
}
