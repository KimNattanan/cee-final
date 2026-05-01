/** Stable room id for the pair {userA, userB} regardless of URL order. */
export function canonicalRoomId(userA: string, userB: string): string {
  return [userA, userB].sort().join(":");
}
