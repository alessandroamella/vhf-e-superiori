/**
 * Waits for a specified number of **milliseconds**.
 * @param ms Number of **milliseconds** to wait
 * @returns A promise that resolves after the specified time
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
