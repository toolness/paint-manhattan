export function shortenStreetName(name: string): string {
  return name
    .replace('Street', 'St')
    .replace('Place', 'Pl');
}
