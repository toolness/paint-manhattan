enum StorySource {
  /**
   * "Manhattan Street Names Past and Present" by Dan Rogerson:
   * https://www.amazon.com/dp/B00C0MTRUK
   */
  Rogerson,
}

enum Era {
  Dutch = 1664,
  British = 1776,
}

export type StreetStory = {
  name: string,
  content: string|string[],
  sources: (string|StorySource)[],
  time: number|Era,
};

/**
 * All the stories about the streets.
 * 
 * The order of this array is important; see `getStreetsInNarrativeOrder()` for more details.
 */
const STREET_STORIES: StreetStory[] = [
  {
    name: "Pearl Street",
    content: [
      "Pearl street dates back to the early 1600s and was named for the many oysters found in the river.",
      "It ran along the waterfront until the latter half of the 18th century, when Water and Front streets were built from landfill.",
      "During British rule, it was called Great Queen Street, but changed back after the revolution.",
    ],
    sources: ["https://en.wikipedia.org/wiki/Pearl_Street_(Manhattan)"],
    time: Era.Dutch,
  },
  {
    name: "Broad Street",
    content: [
      "In the early Dutch colony, a canal called the Heere Graft ran through the center of this street.",
      "The British filled the canal in 1676, resulting in a very wide street that became known as The Broad Street.",
    ],
    sources: [StorySource.Rogerson],
    time: Era.Dutch,
  },
  {
    name: "Beaver Street",
    content: [
      "Beaver Street was initially laid out along a branch of the canal that existed in Broad Street long ago.",
      "It was named after the animal that was a prominent economic resource of New Amsterdam.",
    ],
    sources: [StorySource.Rogerson],
    time: Era.Dutch,
  },
  {
    name: "Bridge Street",
    content: "Bridge street was given its name because it was one of three bridges that crossed a canal located at present-day Broad Street.",
    sources: ["https://en.wikipedia.org/wiki/Bridge_Street_(Manhattan)"],
    time: Era.Dutch,
  },
  {
    name: "Stone Street",
    content: [
      "This was originally called Brewer Street because it was the location of the first commercial brewery in North America prior to 1646.",
      "Around 1655, it became the first street in the city to be paved with cobblestone, which earned it the name Stone Street."
    ],
    sources: [
      "https://en.wikipedia.org/wiki/Stone_Street_(Manhattan)",
      StorySource.Rogerson,
    ],
    time: 1646,  // Brewery established on the street at this time (Rogerson).
  },
  {
    name: "Wall Street",
    content: [
      "From 1711 to 1762, at the corner of Wall and Pearl, the city operated its first official market for the sale and rental of enslaved Africans and Indians.",
      "The city directly benefited from the sale of slaves by implementing taxes on every person who was bought and sold there.",
    ],
    sources: ["https://en.wikipedia.org/wiki/Wall_Street"],
    time: 1653,  // Ordered built (Rogerson).
  },
  {
    name: "Broadway",
    content: [
      "New Amsterdam had a large open area on the north side of its fort that formed the foot of \"De Breede Wegh\" which means \"The Broad Way.\"",
      "The open area became modern Bowling Green Park, while The Broad Way extended to what was then the city wall at Wall Street, where one of two city gates was located.",
    ],
    sources: [StorySource.Rogerson],
    time: Era.Dutch,
  },
  {
    name: "New Street",
    content: [
      "In 1679, when this street opened, a common designation for new streets until a better name was settled on was \"the new street.\"",
      "However, a better name for this street was never settled on.",
    ],
    sources: [StorySource.Rogerson],
    time: 1679,
  },
  {
    name: "Maiden Lane",
    content: [
      "This lane once ran along a stream leading to the East River. It was used by young women for washing clothes.",
      "In 1712, over twenty enslaved Africans gathered in an orchard near Broadway and set fire to a building.",
      "Bloodshed ensued, and strict laws were passed: slaves could no longer gather in groups of more than 3.",
    ],
    sources: [
      StorySource.Rogerson,
      "https://herb.ashp.cuny.edu/items/show/690",
      "https://en.wikipedia.org/wiki/New_York_Slave_Revolt_of_1712",
    ],
    time: Era.Dutch,
  },
  {
    name: "Fair/Fulton Street",
    content: [
      "Fair street, along with Partition Street west of Broadway, was renamed to Fulton Street in 1816, in honor of Robert Fulton, the inventor of the steamship.",
      "Eventually it extended to Pearl, and near their intersection in 1882 was built Pearl Street Station, the first commercial central power plant in the United States."
    ],
    sources: ["https://en.wikipedia.org/wiki/Fulton_Street_(Manhattan)"],
    time: 1696,  // Laid out prior to (Rogerson).
  },
  {
    name: "Cliff Street",
    content: [
      "In 1796, the African Free School built a school house at 65 Cliff, near present-day Fulton.",
      "It was founded to provide education to children of slaves and free people of color.",
      "Its parent organization, the New York Manumission Society, fought to promote the gradual abolition of slavery.",
    ],
    sources: [
      "https://en.wikipedia.org/wiki/African_Free_School",
      "https://www.nyhistory.org/web/africanfreeschool/timeline/timeline-print.html",
    ],
    time: 1686,  // Laid out some time prior to (Rogerson).
  },
  {
    name: "Chatham/Park Row",
    content: [
      "Originally named after William Pitt, the Earl of Chatham and Prime Minister of England, Chatham Row was renamed Park Row by 1829 due to its location along City Hall Park.",
      "By 1886, all of Chatham Street would be renamed Park Row as well.",
    ],
    sources: [StorySource.Rogerson],
    time: 1774,  // Named (Rogerson).
  },
  {
    name: "George/Spruce Street",
    content: [
      "Laid out around 1725, George street was once named in honor of King George III, but eventually changed to Spruce after the Revolution.",
      "Today it's home to a famous skyscraper by Frank Gehry, located between William and Nassau.",
    ],
    sources: ["https://en.wikipedia.org/wiki/Spruce_Street_(Manhattan)"],
    time: 1725,
  },
  {
    name: "Liberty Street",
    content: [
      "Originally called Crown Street, this street was renamed Liberty in 1794 to remove references to the nation's former colonial status.",
    ],
    sources: [StorySource.Rogerson],
    // Rogerson makes no mention of this having any name other than "Crown", which was of British origin,
    // so we'll assume it was created during British rule.
    time: Era.British,
  },
  {
    name: "Ann Street",
    content: [
      "This 3-block street appeared on city maps as early as 1728.",
      "In 1841, P.T. Barnum's American Museum opened at the corner of Ann and Vesey. It was was one of the most popular showplaces in the nation during the 19th century.",
    ],
    sources: ["https://en.wikipedia.org/wiki/Ann_Street_(Manhattan)"],
    // Rogerson mentions Ann is present on the Bradford Map of 1730.
    time: 1730,
  },
  {
    name: "Courtlandt Street",
    content: [
      "This street was laid out in 1733 in honor of the Van Courtlandt family of early Dutch settlers.",
      "During the 1920s, it was sometimes called \"Radio Row\" due to its plethora of merchants specializing in the sale of radio and electronic equipment.",
      "However, Radio Row was torn down in 1966 to make room for the World Trade Center.",
    ],
    sources: [
      StorySource.Rogerson,
      "https://en.wikipedia.org/wiki/Radio_Row",
    ],
    time: 1733,  // Laid out (Rogerson).
  },
  {
    name: "Rector Street",
    content: [
      "This street, first laid out in 1739, was so named because the residence of the rector of Trinity Church stood here.",
    ],
    sources: [StorySource.Rogerson],
    time: 1739,  // Laid out (Rogerson).
  },
  {
    name: "Dey Street",
    content: [
      "Laid out before 1767 and named after a local landowner, Dey Street was home to the American Telephone and Telegraph Company for most of the 20th century.",
      "The company's headquarters at Broadway and Dey was the New York end of the first transatlantic telephone call, made to London in 1927."
    ],
    sources: [
      StorySource.Rogerson,
      "https://en.wikipedia.org/wiki/195_Broadway"
    ],
    time: 1767,  // Laid out prior to (Rogerson).
  },
  {
    name: "Vesey Street",
    content: [
      "This street was named for the Reverend William Vesey, the first rector of Trinity Church.",
      "It was ceded by the church to the city in 1761.",
    ],
    sources: [StorySource.Rogerson],
    time: 1761,  // Regulated (Rogerson).
  },
  {
    name: "Church Street",
    content: [
      "Church Street was named for St. Paul's Chapel, which stands at what was originally the foot of the street at Partition/Fulton.",
      "In 1869, it was extended south to the Battery.",
    ],
    sources: [StorySource.Rogerson],
    time: 1767,  // Laid out (Rogerson).
  },
  {
    name: "Chatham Street/Park Row",
    content: [
      "In 1854, Elizabeth Jennings, a Black woman who taught at the African Free School, was forcibly ejected from a streetcar at Chatham and Pearl on account of the color of her skin.",
      "She sued and won, which led to the eventual desegregation of all the city's transit systems by 1865."
    ],
    sources: [
      "https://www.nytimes.com/2005/11/13/nyregion/thecity/the-schoolteacher-on-the-streetcar.html",
      "https://en.wikipedia.org/wiki/Elizabeth_Jennings_Graham",
    ],
    time: 1774,  // Named (Rogerson).
  },
  {
    name: "Catharine Street",
    content: [
      "Catharine street was named after Catharine Desbrosses, a member of a prominent family whose distillery was located at the foot of this street.",
    ],
    sources: [StorySource.Rogerson],
    // According to "The Old Merchants of New York City, Volume 5" by Walter Barrett, the Desbrosses were
    // a prominent family just before hte American Revolution.
    time: Era.British,
  },
  {
    name: "Front Street",
    content: [
      "Front street was originally built on landfill in the latter half of the 18th century.",
      "It ran along the waterfront until the turn of the next century, when a new road called South street was built from more landfill.",
    ],
    // Weirdly, the Wikipedia entry for "Front Street (Manhattan)" actually redirects to Lower Manhattan and includes no information about Front street.
    sources: ["https://en.wikipedia.org/wiki/South_Street_(Manhattan)"],
    time: 1787,  // Regulated (Rogerson).
  },
  {
    name: "Rose Street",
    content: [
      "Lewis Tappan, a wealthy abolitionist merchant, had a mansion on Rose Street which was ransacked by a mob of anti-abolitionists in 1834.",
      "Today, only a small piece of Rose Street survives, under the approach to the Brooklyn Bridge."
    ],
    sources: ["https://forgotten-ny.com/1999/09/lower-manhattan-necrology/"],
    // According to Rogerson, the street was renamed from Prince to Rose in 1794, so
    // it existed *before* this time...
    time: 1794,
  }
];

const storiesByName: Map<string, StreetStory> = new Map();

STREET_STORIES.forEach(story => {
  if (storiesByName.has(story.name)) {
    console.warn(`Multiple street stories for "${story.name}" exist.`);
  }
  storiesByName.set(story.name, story);
});

export function getStreetStory(streetName: string): StreetStory|null {
  return storiesByName.get(streetName) || null;
}

export function validateStreetStories(allStreetNames: string[]) {
  const allStreetSet = new Set(allStreetNames);
  for (let story of STREET_STORIES) {
    if (!allStreetSet.has(story.name)) {
      console.warn(`Story has invalid street name "${story.name}". It will never be shown.`);
    }
  }
}

/**
 * Sort the streets chronologically, in ascending order, then alphabetically.
 * 
 * If a street doesn't have chronology information, it is regarded as having
 * been built very recently, i.e. it will appear near the end of the list.
 */
export function sortStreetsChronologically(streetNames: string[]): string[] {
  return streetNames.sort((a, b) => {
    const aStory = storiesByName.get(a);
    const bStory = storiesByName.get(b);
    if (aStory && bStory) {
      if (aStory.time < bStory.time) {
        return -1;
      } else if (aStory.time > bStory.time) {
        return 1;
      }
    } else if (aStory && !bStory) {
      return -1;
    } else if (!aStory && bStory) {
      return 1;
    }
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    }
    return 0;
  });
}

/**
 * Returns a list of streets in a predefined order that is roughly chronological,
 * but also designed to aid in learning how the streets are laid out: for instance,
 * every street is built off a street earlier in the list.
 */
export function getStreetsInNarrativeOrder(): string[] {
  return STREET_STORIES.map(story => story.name);
}
