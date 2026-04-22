interface UserPingData {
  count: number;
  resetAt: number;
}

const pingData = new Map<string, UserPingData>();

function getMidnightTimestamp(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function getPingCount(userId: string): number {
  const data = pingData.get(userId);
  if (!data || Date.now() > data.resetAt) {
    pingData.delete(userId);
    return 0;
  }
  return data.count;
}

export function incrementPing(userId: string): number {
  const now = Date.now();
  const data = pingData.get(userId);
  if (!data || now > data.resetAt) {
    pingData.set(userId, { count: 1, resetAt: getMidnightTimestamp() });
    return 1;
  }
  data.count++;
  return data.count;
}

export function resetUserPings(userId: string): void {
  pingData.delete(userId);
}

export function resetAllPings(): void {
  pingData.clear();
}

export function scheduleDailyReset(): void {
  const msUntilMidnight = getMidnightTimestamp() - Date.now();

  setTimeout(() => {
    resetAllPings();
    console.log("✅ Daily ping counts reset at midnight.");
    setInterval(() => {
      resetAllPings();
      console.log("✅ Daily ping counts reset at midnight.");
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(
    `✅ Daily reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes.`,
  );
}
