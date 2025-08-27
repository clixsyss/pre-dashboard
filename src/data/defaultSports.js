export const defaultSports = [
  // Primary Sports (Requested)
  {
    name: 'Paddle',
    description: 'Indoor/outdoor paddle tennis court',
    category: 'Racket Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 4,
    duration: '60 minutes',
    equipment: ['Paddle Rackets', 'Paddle Balls', 'Net', 'Court Markings'],
    rules: ['Paddle Rules', 'Singles or doubles', 'Best of 3 games'],
    active: true
  },
  {
    name: 'Basketball',
    description: 'Indoor/outdoor basketball court',
    category: 'Team Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 10,
    duration: '48 minutes',
    equipment: ['Basketball', 'Hoops', 'Court Markings'],
    rules: ['NBA Rules', '5 players per team', '4 quarters of 12 minutes'],
    active: true
  },
  {
    name: 'Football',
    description: 'Soccer/football field for 11-a-side matches',
    category: 'Team Sports',
    difficulty: 'Intermediate',
    ageGroup: 'All Ages',
    maxParticipants: 22,
    duration: '90 minutes',
    equipment: ['Football', 'Goal Posts', 'Field Markings'],
    rules: ['FIFA Rules', '11 players per team', '90 minute matches'],
    active: true
  },
  {
    name: 'Rugby',
    description: 'Rugby union/league field',
    category: 'Team Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 30,
    duration: '80 minutes',
    equipment: ['Rugby Ball', 'Goal Posts', 'Field Markings', 'Protective Gear'],
    rules: ['World Rugby Rules', '15 players per team', '2 halves of 40 minutes'],
    active: true
  },
  {
    name: 'Tennis',
    description: 'Indoor/outdoor tennis court',
    category: 'Racket Sports',
    difficulty: 'Intermediate',
    ageGroup: 'All Ages',
    maxParticipants: 4,
    duration: '90 minutes',
    equipment: ['Tennis Rackets', 'Tennis Balls', 'Net', 'Court Markings'],
    rules: ['ITF Rules', 'Singles or doubles', 'Best of 3 sets'],
    active: true
  },
  {
    name: 'Squash',
    description: 'Indoor squash court',
    category: 'Racket Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 2,
    duration: '45 minutes',
    equipment: ['Squash Rackets', 'Squash Balls', 'Court Walls'],
    rules: ['PSA Rules', '2 players', 'Best of 5 games'],
    active: true
  },

  // Additional Team Sports
  {
    name: 'Volleyball',
    description: 'Indoor/outdoor volleyball court',
    category: 'Team Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 12,
    duration: '60 minutes',
    equipment: ['Volleyball', 'Net', 'Court Markings'],
    rules: ['FIVB Rules', '6 players per team', 'Best of 5 sets'],
    active: true
  },
  {
    name: 'Baseball',
    description: 'Baseball diamond and field',
    category: 'Team Sports',
    difficulty: 'Intermediate',
    ageGroup: 'All Ages',
    maxParticipants: 18,
    duration: '120 minutes',
    equipment: ['Baseball', 'Bats', 'Gloves', 'Bases', 'Home Plate'],
    rules: ['MLB Rules', '9 players per team', '9 innings'],
    active: true
  },
  {
    name: 'Softball',
    description: 'Softball diamond and field',
    category: 'Team Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 18,
    duration: '90 minutes',
    equipment: ['Softball', 'Bats', 'Gloves', 'Bases', 'Home Plate'],
    rules: ['ASA Rules', '9 players per team', '7 innings'],
    active: true
  },
  {
    name: 'Cricket',
    description: 'Cricket pitch and field',
    category: 'Team Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 22,
    duration: '180 minutes',
    equipment: ['Cricket Ball', 'Bats', 'Wickets', 'Pitch'],
    rules: ['ICC Rules', '11 players per team', 'Limited overs format'],
    active: true
  },
  {
    name: 'Hockey',
    description: 'Field hockey pitch',
    category: 'Team Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 22,
    duration: '70 minutes',
    equipment: ['Hockey Sticks', 'Hockey Ball', 'Goals', 'Field Markings'],
    rules: ['FIH Rules', '11 players per team', '2 halves of 35 minutes'],
    active: true
  },
  {
    name: 'Lacrosse',
    description: 'Lacrosse field',
    category: 'Team Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 20,
    duration: '80 minutes',
    equipment: ['Lacrosse Sticks', 'Lacrosse Ball', 'Goals', 'Protective Gear'],
    rules: ['NCAA Rules', '10 players per team', '4 quarters of 20 minutes'],
    active: true
  },

  // Additional Racket Sports
  {
    name: 'Badminton',
    description: 'Indoor badminton court',
    category: 'Racket Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 4,
    duration: '45 minutes',
    equipment: ['Badminton Rackets', 'Shuttlecocks', 'Net', 'Court Markings'],
    rules: ['BWF Rules', 'Singles or doubles', 'Best of 3 games'],
    active: true
  },
  {
    name: 'Table Tennis',
    description: 'Indoor table tennis facility',
    category: 'Racket Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 4,
    duration: '30 minutes',
    equipment: ['Table Tennis Rackets', 'Table Tennis Balls', 'Table', 'Net'],
    rules: ['ITTF Rules', 'Singles or doubles', 'Best of 7 games'],
    active: true
  },
  {
    name: 'Racquetball',
    description: 'Indoor racquetball court',
    category: 'Racket Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 4,
    duration: '45 minutes',
    equipment: ['Racquetball Rackets', 'Racquetball Balls', 'Court Walls'],
    rules: ['USAR Rules', 'Singles or doubles', 'Best of 3 games'],
    active: true
  },
  {
    name: 'Pickleball',
    description: 'Indoor/outdoor pickleball court',
    category: 'Racket Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 4,
    duration: '30 minutes',
    equipment: ['Pickleball Paddles', 'Pickleball Balls', 'Net', 'Court Markings'],
    rules: ['USAPA Rules', 'Singles or doubles', 'Best of 3 games to 11'],
    active: true
  },
  
  // Aquatic Sports
  {
    name: 'Swimming',
    description: 'Indoor/outdoor swimming pool',
    category: 'Aquatic Sports',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    maxParticipants: 20,
    duration: '60 minutes',
    equipment: ['Pool Lanes', 'Starting Blocks', 'Timing System'],
    rules: ['FINA Rules', 'Multiple lanes', 'Various stroke styles'],
    active: true
  },
  {
    name: 'Water Polo',
    description: 'Indoor/outdoor water polo pool',
    category: 'Aquatic Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 14,
    duration: '60 minutes',
    equipment: ['Pool', 'Goals', 'Water Polo Balls'],
    rules: ['FINA Rules', '7 players per team', '4 quarters of 8 minutes'],
    active: true
  },
  {
    name: 'Diving',
    description: 'Diving platform and pool',
    category: 'Aquatic Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 10,
    duration: '90 minutes',
    equipment: ['Diving Platforms', 'Pool', 'Safety Equipment'],
    rules: ['FINA Rules', 'Individual competition', 'Multiple dive categories'],
    active: true
  },
  {
    name: 'Synchronized Swimming',
    description: 'Synchronized swimming pool',
    category: 'Aquatic Sports',
    difficulty: 'Advanced',
    ageGroup: 'Teen+',
    maxParticipants: 12,
    duration: '90 minutes',
    equipment: ['Pool', 'Music System', 'Costumes'],
    rules: ['FINA Rules', 'Solo, duet, or team routines', 'Technical and free routines'],
    active: true
  },
  
  // Fitness & Wellness
  {
    name: 'Yoga',
    description: 'Dedicated yoga and meditation space',
    category: 'Fitness & Wellness',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 25,
    duration: '90 minutes',
    equipment: ['Yoga Mats', 'Props', 'Meditation Cushions', 'Mirrors'],
    rules: ['Mindful Practice', 'Proper Breathing', 'Respect for Others', 'Quiet Environment'],
    active: true
  },
  {
    name: 'Pilates',
    description: 'Pilates and core training facility',
    category: 'Fitness & Wellness',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 15,
    duration: '60 minutes',
    equipment: ['Reformers', 'Cadillac', 'Chairs', 'Mats', 'Props'],
    rules: ['Controlled Movements', 'Proper Alignment', 'Breathing Focus', 'Core Engagement'],
    active: true
  },
  {
    name: 'Gym',
    description: 'Fully equipped fitness center',
    category: 'Fitness & Wellness',
    difficulty: 'All Levels',
    ageGroup: '16+',
    maxParticipants: 50,
    duration: '120 minutes',
    equipment: ['Cardio Machines', 'Weight Equipment', 'Free Weights', 'Mats', 'Mirrors'],
    rules: ['Safety Guidelines', 'Proper Form', 'Equipment Usage', 'Clean Equipment After Use'],
    active: true
  },
  {
    name: 'CrossFit',
    description: 'CrossFit training facility',
    category: 'Fitness & Wellness',
    difficulty: 'Advanced',
    ageGroup: '18+',
    maxParticipants: 20,
    duration: '60 minutes',
    equipment: ['Barbells', 'Kettlebells', 'Pull-up Bars', 'Rowing Machines', 'Boxes'],
    rules: ['High Intensity', 'Functional Movements', 'Varied Workouts', 'Safety First'],
    active: true
  },
  {
    name: 'Spinning',
    description: 'Indoor cycling studio',
    category: 'Fitness & Wellness',
    difficulty: 'All Levels',
    ageGroup: '16+',
    maxParticipants: 30,
    duration: '45 minutes',
    equipment: ['Stationary Bikes', 'Heart Rate Monitors', 'Music System'],
    rules: ['Proper Bike Setup', 'Heart Rate Monitoring', 'Follow Instructor', 'Stay Hydrated'],
    active: true
  },
  {
    name: 'Zumba',
    description: 'Dance fitness studio',
    category: 'Fitness & Wellness',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 40,
    duration: '60 minutes',
    equipment: ['Dance Floor', 'Music System', 'Mirrors', 'Props'],
    rules: ['Follow Instructor', 'Have Fun', 'Move at Your Own Pace', 'Stay Hydrated'],
    active: true
  },
  {
    name: 'Barre',
    description: 'Barre fitness studio',
    category: 'Fitness & Wellness',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 25,
    duration: '60 minutes',
    equipment: ['Barres', 'Mats', 'Light Weights', 'Mirrors'],
    rules: ['Proper Form', 'Controlled Movements', 'Core Engagement', 'Breathing Focus'],
    active: true
  },
  {
    name: 'Meditation',
    description: 'Quiet meditation and mindfulness space',
    category: 'Fitness & Wellness',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 20,
    duration: '60 minutes',
    equipment: ['Meditation Cushions', 'Mats', 'Quiet Environment', 'Optional Music'],
    rules: ['Complete Silence', 'No Phones', 'Respect Others', 'Mindful Presence'],
    active: true
  },
  
  // Athletics & Track
  {
    name: 'Running Track',
    description: 'Outdoor athletics track',
    category: 'Athletics',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 100,
    duration: '120 minutes',
    equipment: ['Track Lanes', 'Starting Blocks', 'Jump Pits', 'Timing System'],
    rules: ['IAAF Rules', 'Proper Lane Usage', 'Safety Guidelines', 'Respect Other Runners'],
    active: true
  },
  {
    name: 'Athletics Field',
    description: 'Multi-purpose athletics field',
    category: 'Athletics',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 50,
    duration: '120 minutes',
    equipment: ['Long Jump Pit', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus'],
    rules: ['IAAF Rules', 'Event-Specific Guidelines', 'Safety Protocols', 'Proper Equipment'],
    active: true
  },
  {
    name: 'Marathon Training',
    description: 'Long-distance running training area',
    category: 'Athletics',
    difficulty: 'Advanced',
    ageGroup: '18+',
    maxParticipants: 30,
    duration: '180 minutes',
    equipment: ['Running Paths', 'Water Stations', 'Distance Markers'],
    rules: ['Progressive Training', 'Proper Hydration', 'Rest Days', 'Listen to Your Body'],
    active: true
  },
  
  // Combat Sports
  {
    name: 'Boxing',
    description: 'Professional boxing ring',
    category: 'Combat Sports',
    difficulty: 'Advanced',
    ageGroup: '18+',
    maxParticipants: 4,
    duration: '60 minutes',
    equipment: ['Boxing Ring', 'Gloves', 'Headgear', 'Punching Bags', 'Speed Bags'],
    rules: ['AIBA Rules', 'Safety Equipment Required', 'Supervised Training', 'Respect Opponents'],
    active: true
  },
  {
    name: 'Martial Arts',
    description: 'Traditional martial arts training space',
    category: 'Combat Sports',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 30,
    duration: '90 minutes',
    equipment: ['Training Mats', 'Punching Bags', 'Weapons', 'Mirrors', 'Belts'],
    rules: ['Respect', 'Discipline', 'Proper Technique', 'Safety First', 'Bowing Etiquette'],
    active: true
  },
  {
    name: 'Kickboxing',
    description: 'Kickboxing training facility',
    category: 'Combat Sports',
    difficulty: 'Intermediate',
    ageGroup: '16+',
    maxParticipants: 20,
    duration: '60 minutes',
    equipment: ['Punching Bags', 'Gloves', 'Shin Guards', 'Mats'],
    rules: ['Proper Technique', 'Safety Equipment', 'Controlled Contact', 'Respect Others'],
    active: true
  },
  {
    name: 'Wrestling',
    description: 'Wrestling mat and training area',
    category: 'Combat Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 25,
    duration: '90 minutes',
    equipment: ['Wrestling Mats', 'Headgear', 'Shoes', 'Scoring System'],
    rules: ['FILA Rules', 'Proper Technique', 'Safety First', 'Respect Opponents'],
    active: true
  },
  
  // Specialized Sports
  {
    name: 'Golf',
    description: 'Golf driving range and practice facility',
    category: 'Golf',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 20,
    duration: '120 minutes',
    equipment: ['Golf Clubs', 'Golf Balls', 'Tee Stations', 'Target Greens', 'Putting Green'],
    rules: ['Golf Etiquette', 'Safety Guidelines', 'Proper Form', 'Respect Course'],
    active: true
  },
  {
    name: 'Bowling',
    description: 'Indoor bowling facility',
    category: 'Bowling',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 40,
    duration: '90 minutes',
    equipment: ['Bowling Lanes', 'Bowling Balls', 'Pins', 'Shoes', 'Scoring System'],
    rules: ['USBC Rules', 'Lane Courtesy', 'Safety Guidelines', 'Proper Form'],
    active: true
  },
  {
    name: 'Rock Climbing',
    description: 'Indoor rock climbing wall',
    category: 'Adventure Sports',
    difficulty: 'All Levels',
    ageGroup: '8+',
    maxParticipants: 25,
    duration: '120 minutes',
    equipment: ['Climbing Walls', 'Harnesses', 'Ropes', 'Safety Equipment', 'Chalk'],
    rules: ['Safety First', 'Proper Equipment', 'Supervised Climbing', 'Belay Certification'],
    active: true
  },
  {
    name: 'Skateboarding',
    description: 'Outdoor skateboarding facility',
    category: 'Extreme Sports',
    difficulty: 'All Levels',
    ageGroup: '8+',
    maxParticipants: 30,
    duration: '120 minutes',
    equipment: ['Ramps', 'Rails', 'Bowls', 'Safety Equipment', 'Skateboards'],
    rules: ['Safety Gear Required', 'Respect Others', 'Skill Level Appropriate', 'No Graffiti'],
    active: true
  },
  {
    name: 'BMX',
    description: 'BMX track and training facility',
    category: 'Extreme Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 20,
    duration: '90 minutes',
    equipment: ['BMX Track', 'Bikes', 'Safety Equipment', 'Starting Gates'],
    rules: ['Safety Gear Required', 'Track Etiquette', 'Respect Other Riders', 'No Stunting'],
    active: true
  },
  {
    name: 'Archery',
    description: 'Indoor/outdoor archery range',
    category: 'Precision Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 15,
    duration: '90 minutes',
    equipment: ['Bows', 'Arrows', 'Targets', 'Safety Equipment', 'Range Markers'],
    rules: ['Safety First', 'Proper Form', 'Range Commands', 'Equipment Care'],
    active: true
  },
  {
    name: 'Shooting Range',
    description: 'Indoor shooting range',
    category: 'Precision Sports',
    difficulty: 'Advanced',
    ageGroup: '21+',
    maxParticipants: 10,
    duration: '120 minutes',
    equipment: ['Shooting Lanes', 'Targets', 'Safety Equipment', 'Firearms'],
    rules: ['Strict Safety Protocols', 'Licensed Users Only', 'Range Commands', 'No Alcohol'],
    active: true
  },
  {
    name: 'Dance Studio',
    description: 'Professional dance studio',
    category: 'Performing Arts',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 30,
    duration: '90 minutes',
    equipment: ['Dance Floor', 'Mirrors', 'Barres', 'Music System', 'Props'],
    rules: ['Proper Dance Attire', 'Respect Studio', 'Follow Instructor', 'Practice Etiquette'],
    active: true
  },
  {
    name: 'Gymnastics',
    description: 'Gymnastics training facility',
    category: 'Gymnastics',
    difficulty: 'All Levels',
    ageGroup: 'All Ages',
    maxParticipants: 25,
    duration: '90 minutes',
    equipment: ['Balance Beams', 'Uneven Bars', 'Vault', 'Floor Mats', 'Rings'],
    rules: ['FIG Rules', 'Safety Equipment', 'Proper Technique', 'Supervised Training'],
    active: true
  },
  {
    name: 'Cheerleading',
    description: 'Cheerleading practice facility',
    category: 'Team Sports',
    difficulty: 'Intermediate',
    ageGroup: 'Teen+',
    maxParticipants: 30,
    duration: '90 minutes',
    equipment: ['Practice Mats', 'Mirrors', 'Music System', 'Props', 'Safety Equipment'],
    rules: ['Safety First', 'Proper Technique', 'Team Coordination', 'Respect Others'],
    active: true
  }
];

export const getSportsByCategory = (category) => {
  return defaultSports.filter(sport => sport.category === category);
};

export const getSportsByDifficulty = (difficulty) => {
  return defaultSports.filter(sport => sport.difficulty === difficulty);
};

export const getSportsByAgeGroup = (ageGroup) => {
  return defaultSports.filter(sport => sport.ageGroup === ageGroup);
};

// Get the primary requested sports
export const getPrimarySports = () => {
  const primaryNames = ['Paddle', 'Basketball', 'Football', 'Rugby', 'Tennis', 'Squash'];
  return defaultSports.filter(sport => primaryNames.includes(sport.name));
};

// Get all available categories
export const getAllCategories = () => {
  return [...new Set(defaultSports.map(sport => sport.category))];
};

// Get sports count by category
export const getSportsCountByCategory = () => {
  const categories = getAllCategories();
  return categories.map(category => ({
    category,
    count: getSportsByCategory(category).length
  }));
};
