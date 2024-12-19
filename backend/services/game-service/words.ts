import { SelectableWord } from "../../types/word.ts";

export type WordsListType = {
  [category: string]: string[];
};

export const getRandomWords = (
  category: string = "Random",
  count: number = 3,
): SelectableWord[] => {
  const words = wordsList[category];
  if (!words) {
    return [{ id: crypto.randomUUID(), word: "Something went wrong" }];
  }

  const shuffledWords = shuffleArray(words);
  const selectedWords = shuffledWords.slice(0, count);
  return selectedWords.map((word) => ({ id: crypto.randomUUID(), word }));
};

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const wordsList: WordsListType = {
  Animals: [
    "Ants",
    "Flea",
    "Spider",
    "Worm",
    "Grasshopper",
    "Mantis",
    "Dragonfly",
    "Wasp",
    "Caterpillar",
    "Dragonfly",
    "Ladybug",
    "Beetle",
    "Butterfly",
    "Moth",
    "Lice",
    "Cockroach",
    "Cricket",
    "Earwig",
    "Mayfly",
    "Termite",
    "Stickbug",
    "Stinkbug",
    "Scorpion",
    "Lacewing",
    "Isopod",
    "Springtail",
    "Mosquito",
    "Centipede",
    "Squirrel",
    "Dog",
    "Pig",
    "Lion",
    "Mouse",
    "Monkey",
    "Elephant",
    "Kangaroo",
    "Leopard",
    "Coyote",
    "Hedgehog",
    "Chimpanzee",
    "Walrus",
    "Goat",
    "Koala",
    "Hippo",
    "Sheep",
    "Raccoon",
    "Ox",
    "Otter",
    "Horse",
    "Mole",
    "Giraffe",
    "Deer",
    "Cat",
    "Human",
    "Dolphin",
    "Whale",
    "Sloth",
    "Seal",
    "Rabbit",
    "Wolf",
    "Tiger",
    "Meerkat",
    "Guinea pig",
    "Bear",
    "Panda",
    "Koala",
    "Lemur",
    "Skunk",
    "Bat",
    "Gorilla",
    "Beaver",
    "Polar Bear",
    "Platypus",
    "Cheetah",
    "Gazelle",
    "Elk",
    "Racoon",
    "Drop bear",
    "Camel",
    "Rhino",
    "Bison",
    "Zebra",
    "Otter",
    "Alligator",
    "snake",
    "Chameleon",
    "Bearded Dragon",
    "Komodo dragon",
    "Coral snake",
    "Fire Salamander",
    "Turtle",
    "Gecko",
    "Gila monster",
    "Iguana",
    "Frilled Lizard",
    "Iguana",
    "Dragon",
    "Blue Tongue Skink",
    "Gila Monster",
    "Cobra",
    "Rattlesnake",
    "Thorny Dragon",
    "Eagle",
    "Hawk",
    "Parrot",
    "Goldfinch",
    "Magpie",
    "Chicken",
    "Penguin",
    "ostrich",
    "Emu",
    "Pelican",
    "Sparrow",
    "Swan",
    "Stork",
    "Raven",
    "Turkey",
    "Pigeon",
    "Vulture",
    "Albatross",
    "Condors",
    "Pheasant",
    "Starling",
    "Woodpecker",
    "Crow",
    "Cockatoo",
    "Peacock",
    "Cockatiels",
    "Canaries",
    "Dove",
    "Flamingo",
    "Toucan",
    "Horned Owl",
    "Chick",
    "Goose",
    "Duck",
    "Hummingbird",
    "Mockingbird",
    "Kiwi",
    "Bald Eagle",
    "Donald Duck",
    "Rooster",
    "Crane",
    "Kingfisher",
  ],

  Sports: [
    "Conor McGregor",
    "Lionel Messi",
    "Cristiano Ronaldo",
    "LeBron James",
    "Neymar",
    "Lewis Hamilton",
    "Tom Brady",
    "Kevin Durant",
    "Naomi Osaka",
    "Tiger Woods",
    "Michael Jordan",
    "Serena Williams",
    "Muhammad Ali",
    "Wladimir Klitschko",
    "Michael Schumacher",
    "The Rock",
    "Arnold Schwarzenegger",
    "Terry Crews",
    "Ronaldinho",
    "Shaquille O Neal",
    "Usain Bolt",
    "Michael Phelps",
    "Maradona",
    "Roger Federer",
    "Pele",
    "Manny Pacquiao",
    "David Beckham",
    "Lance Armstrong",
    "Babe Ruth",
    "Anthony Joshua",
    "Jon Jones",
    "Georges St.Pierre",
    "Anderson Silva",
    "Khabib Nurmagomedov",
    "Amanda Nunes",
    "Mike Tyson",
    "Sonny Liston",
    "George Foreman",
    "Joe Frazier",
    "Larry Holmes",
    "Floyd Mayweather",
    "Evander Holyfield",
    "Kobe Bryant",
    "Michael Jordan",
    "Max Verstappen",
    "Ronda Rousey",
    "Basketball",
    "Tennis",
    "Baseball",
    "Golf",
    "Running",
    "Volleyball",
    "Badminton",
    "Swimming",
    "Boxing",
    "ping pong",
    "Skiing",
    "Ice skating",
    "Roller skating",
    "Cricket",
    "Rugby",
    "Pool",
    "Darts",
    "Football",
    "Bowling",
    "Ice hockey",
    "Surfing",
    "Karate",
    "Horse racing",
    "Snowboarding",
    "Skateboarding",
    "Cycling",
    "Archery",
    "Fishing",
    "Gymnastics",
    "Figure skating",
    "Rock climbing",
    "Sumo wrestling",
    "Taekwondo",
    "Fencing",
    "Water skiing",
    "Jet skiing",
    "Weight lifting",
    "Scuba diving",
    "Judo",
    "Wind surfing",
    "Kickboxing",
    "Sky diving",
    "Hang gliding",
    "Bungee jumping",
    "Cricket",
    "Soccer",
    "Street hokey",
    "Ice hockey",
    "Extreme Ironing",
    "Chess",
    "e-sports",
  ],

  Random: [
    "stow",
    "bulldog",
    "partner",
    "palace",
    "snooze",
    "accounting",
    "yawn",
    "ditch",
    "fortress",
    "factory",
    "speakers",
    "prize",
    "propose",
    "mat",
    "clique",
    "foam",
    "cure",
    "trombone",
    "toolbox",
    "weather",
    "double",
    "vehicle",
    "chain mail",
    "rib",
    "avocado",
    "mold",
    "dent",
    "tow truck",
    "photosynthesis",
    "torch",
    "yard",
    "nap",
    "letter opener",
    "devious",
    "connection",
    "taxi",
    "world",
    "tiptoe",
    "irrigation",
    "customer",
    "cousin",
    "water buffalo",
    "edit",
    "coastline",
    "scuba diving",
    "rodeo",
    "dew",
    "lie",
    "nanny",
    "organ",
    "putty",
    "mysterious",
    "sweater vest",
    "parent",
    "garden hose",
    "Quidditch",
    "flu",
    "blush",
    "sushi",
    "chime",
    "chariot racing",
    "snore",
    "conveyor belt",
    "pest",
    "bargain",
    "lace",
    "trombone",
    "jazz",
    "beluga whale",
    "robe",
    "stationery",
    "jeans",
    "wedding cake",
    "koala",
    "prey",
    "plumber",
    "sash",
    "cell phone charger",
    "cable car",
    "letter opener",
    "full",
    "bookend",
    "devious",
    "carat",
    "lipstick",
    "ream",
    "haircut",
    "lunch tray",
    "cough",
    "record",
    "stopwatch",
    "script",
    "lecture",
    "cliff",
    "dream",
    "glue gun",
    "baseboards",
    "shower curtain",
    "hipster",
    "judge",
    "crate",
    "professor",
    "boa constrictor",
    "centimeter",
    "living room",
    "vein",
    "fade",
    "barbershop",
    "Quidditch",
    "dawn",
    "juggle",
    "cream",
    "password",
    "gallon",
    "seat",
    "raft",
    "husband",
    "electrical outlet",
    "mayor",
    "baguette",
    "student",
    "somersault",
    "puppet",
    "distance",
    "time",
    "cable car",
    "elf",
    "downpour",
    "honk",
    "company",
    "runoff",
    "printer ink",
    "macho",
    "hang glider",
    "cruise",
    "parade",
    "lunch tray",
    "beanstalk",
    "quit",
    "pile",
    "trapped",
    "stopwatch",
    "season",
    "dorsal",
    "mime",
    "scuba diving",
    "coil",
    "nanny",
    "cruise ship",
    "blizzard",
    "crate",
    "professor",
    "boa constrictor",
    "centimeter",
    "living room",
    "vein",
    "fade",
    "barbershop",
    "Quidditch",
    "dawn",
    "juggle",
    "cream",
    "password",
    "gallon",
    "seat",
    "raft",
    "husband",
    "electrical outlet",
    "mayor",
    "baguette",
    "student",
    "somersault",
    "puppet",
    "distance",
    "time",
    "cable car",
    "elf",
    "downpour",
    "honk",
    "company",
    "runoff",
    "printer ink",
    "macho",
    "hang glider",
    "cruise",
    "parade",
    "lunch tray",
    "beanstalk",
    "quit",
    "pile",
    "trapped",
    "stopwatch",
    "season",
    "dorsal",
    "mime",
    "scuba diving",
    "coil",
    "nanny",
    "cruise ship",
    "blizzard",
    "roller coaster",
    "groom",
    "shrew",
    "sweater",
    "mine",
    "fade",
    "reveal",
    "Quidditch",
    "skating rink",
    "economics",
    "learn",
    "yardstick",
    "blush",
    "bargain",
    "fireman pole",
    "husband",
    "migrate",
    "cleaning spray",
    "jazz",
    "eraser",
    "kneel",
    "crop duster",
    "baguette",
    "plumber",
    "vet",
    "steam",
    "pawn",
    "hoop",
    "yard",
    "drawback",
    "acrobat",
    "lipstick",
    "Heinz 57",
    "extension cord",
    "darts",
    "son-in-law",
    "half",
    "pile",
    "country",
    "cliff",
    "laser",
    "lung",
    "glue gun",
    "earache",
    "shelter",
    "handle",
    "chisel",
    "front",
    "judge",
    "organ",
    "inning",
    "vision",
    "promise",
    "trademark",
    "feeder road",
    "emperor",
    "aftermath",
    "bushel",
    "wish",
    "lichen",
    "addendum",
    "fragment",
    "opaque",
    "infection",
    "income",
    "guess",
    "doppelganger",
    "tug",
    "water vapor",
    "villain",
    "carat",
    "cramp",
    "inquisition",
    "intern",
    "education",
    "implode",
    "junk drawer",
    "try",
    "climate",
    "brainstorm",
    "flutter",
    "pomp",
    "population",
    "acoustics",
    "flotsam",
    "haberdashery",
    "statement",
    "gymnast",
    "opinion",
    "ice fishing",
    "steel drum",
    "sophomore",
    "irrational",
    "preteen",
    "ray",
    "depth",
    "consent",
    "eureka",
    "altitude",
    "crow's nest",
    "important",
    "drip",
    "boa constrictor",
    "cockpit",
    "mysterious",
    "shrew",
    "videogame",
    "chess",
    "think",
    "skating rink",
    "attack",
    "diver",
    "blush",
    "apathetic",
    "post office",
    "spare",
    "testify",
    "toddler",
    "mat",
    "clamp",
    "coach",
    "hot tub",
    "tank",
    "eraser",
    "obey",
    "shack",
    "vanish",
    "baguette",
    "calm",
    "level",
    "tugboat",
    "yak",
    "interception",
    "drain",
    "commercial",
    "grandpa",
    "quit",
    "trapped",
    "country",
    "plank",
    "freshman",
    "jungle",
    "story",
    "passenger",
    "bedbug",
    "stage fright",
    "shampoo",
    "blizzard",
    "ginger",
    "drought",
  ],
};

const additionalWords = [
  "Ambulance",
  "Astronaut",
  "Ballerina",
  "Banana",
  "Bicycle",
  "Blender",
  "Bowtie",
  "Bubble",
  "Cactus",
  "Canoe",
  "Castle",
  "Cave",
  "Chandelier",
  "Cheese",
  "Compass",
  "Cowboy",
  "Crayon",
  "Crocodile",
  "Disco Ball",
  "Dolphin",
  "Ferris Wheel",
  "Fireworks",
  "Fishing Rod",
  "Flashlight",
  "Giraffe",
  "Glacier",
  "Hammock",
  "Hot Air Balloon",
  "Igloo",
  "Jetpack",
  "Kayak",
  "Lantern",
  "Lighthouse",
  "Lipstick",
  "Marshmallow",
  "Mermaid",
  "Microscope",
  "Mountains",
  "Mushroom",
  "Narwhal",
  "Nest",
  "Oasis",
  "Octopus",
  "Origami",
  "Pancakes",
  "Paperclip",
  "Parachute",
  "Pinwheel",
  "Pirate",
  "Pizza",
  "Pumpkin",
  "Rainbow",
  "Rollercoaster",
  "Satellite",
  "Scarecrow",
  "Scorpion",
  "Snowflake",
  "Spaceship",
  "Sphinx",
  "Statue",
  "Stethoscope",
  "Sunflower",
  "Telescope",
  "Tent",
  "Treasure Chest",
  "Tugboat",
  "Umbrella",
  "Unicorn",
  "Volcano",
  "Windmill",
  "Wizard",
  "Yacht",
  "Zebra",
];

const shapeWords = [
  "Circle",
  "Square",
  "Triangle",
  "Rectangle",
  "Oval",
  "Pentagon",
  "Hexagon",
  "Octagon",
  "Diamond",
  "Trapezoid",
  "Rhombus",
  "Star",
  "Heart",
  "Arrow",
  "Cube",
  "Cylinder",
  "Cone",
  "Sphere",
  "Pyramid",
  "Crescent",
  "Ellipsoid",
  "Parallelogram",
  "Semicircle",
  "Quadrilateral",
  "Kite",
  "Heptagon",
  "Nonagon",
  "Decagon",
  "Cross",
  "Chevron",
  "Torus",
  "Scalene Triangle",
  "Isosceles Triangle",
  "Equilateral Triangle",
  "Right Triangle",
  "Oblong",
  "Prism",
  "Pentagram",
  "Helix",
  "Spiral",
  "Starburst",
  "Sector",
  "Annulus",
  "Ring",
  "Hyperbola",
  "Ellipse",
  "Parabola",
  "Quadrant",
  "Segment",
  "Sector",
  "Tetrahedron",
  "Dodecahedron",
  "Icosahedron",
];
