export function getTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function logWithTime(msg: string) {
  console.log(`[${getTime()}] ${msg}`);
}
