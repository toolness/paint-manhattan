export function shortenStreetName(name) {
    return name
        .replace('Street', 'St')
        .replace('Place', 'Pl');
}
