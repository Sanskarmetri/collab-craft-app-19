// Real UPSC study content: NCERT chapter lists (actual books/chapters) and
// real UPSC previous-year papers. Used by /resources and /syllabus so the
// coverage tracker counts real content instead of AI-generated placeholders.

export interface NcertChapter {
  /** Chapter title as printed in the NCERT textbook */
  title: string;
  /** e.g. "Class 11 · Indian Constitution at Work" */
  book: string;
  classLevel: number;
}

export interface SyllabusSubject {
  id: string;
  name: string;
  /** GS paper mapping */
  paper: string;
  chapters: NcertChapter[];
}

const c = (book: string, classLevel: number, titles: string[]): NcertChapter[] =>
  titles.map((title) => ({ title, book, classLevel }));

export const SYLLABUS: SyllabusSubject[] = [
  {
    id: 'polity',
    name: 'Polity',
    paper: 'GS2',
    chapters: [
      ...c('Social and Political Life III', 8, [
        'The Indian Constitution',
        'Understanding Secularism',
        'Why Do We Need a Parliament?',
        'Understanding Laws',
        'Judiciary',
        'Understanding Our Criminal Justice System',
        'Understanding Marginalisation',
        'Confronting Marginalisation',
        'Public Facilities',
        'Law and Social Justice',
      ]),
      ...c('Democratic Politics I', 9, [
        'What is Democracy? Why Democracy?',
        'Constitutional Design',
        'Electoral Politics',
        'Working of Institutions',
        'Democratic Rights',
      ]),
      ...c('Democratic Politics II', 10, [
        'Power Sharing',
        'Federalism',
        'Gender, Religion and Caste',
        'Political Parties',
        'Outcomes of Democracy',
      ]),
      ...c('Indian Constitution at Work', 11, [
        'Constitution: Why and How?',
        'Rights in the Indian Constitution',
        'Election and Representation',
        'Executive',
        'Legislature',
        'Judiciary',
        'Federalism',
        'Local Governments',
        'Constitution as a Living Document',
        'The Philosophy of the Constitution',
      ]),
      ...c('Political Theory', 11, [
        'Political Theory: An Introduction',
        'Freedom',
        'Equality',
        'Social Justice',
        'Rights',
        'Citizenship',
        'Nationalism',
        'Secularism',
      ]),
      ...c('Politics in India Since Independence', 12, [
        'Challenges of Nation Building',
        'Era of One-Party Dominance',
        'Politics of Planned Development',
        "India's External Relations",
        'Challenges to and Restoration of the Congress System',
        'The Crisis of Democratic Order',
        'Regional Aspirations',
        'Recent Developments in Indian Politics',
      ]),
    ],
  },
  {
    id: 'history',
    name: 'History',
    paper: 'GS1',
    chapters: [
      ...c('Our Pasts I', 6, [
        'What, Where, How and When?',
        'From Hunting-Gathering to Growing Food',
        'In the Earliest Cities',
        'What Books and Burials Tell Us',
        'Kingdoms, Kings and an Early Republic',
        'New Questions and Ideas',
        'From a Kingdom to an Empire',
        'Villages, Towns and Trade',
        'New Empires and Kingdoms',
        'Buildings, Paintings and Books',
      ]),
      ...c('Our Pasts II', 7, [
        'Tracing Changes Through a Thousand Years',
        'New Kings and Kingdoms',
        'The Delhi Sultans',
        'The Mughal Empire',
        'Rulers and Buildings',
        'Towns, Traders and Craftspersons',
        'Tribes, Nomads and Settled Communities',
        'Devotional Paths to the Divine',
        'The Making of Regional Cultures',
        'Eighteenth-Century Political Formations',
      ]),
      ...c('Our Pasts III', 8, [
        'How, When and Where',
        'From Trade to Territory',
        'Ruling the Countryside',
        'Tribals, Dikus and the Vision of a Golden Age',
        'When People Rebel: 1857 and After',
        'Civilising the Native, Educating the Nation',
        'Women, Caste and Reform',
        'The Making of the National Movement: 1870s-1947',
      ]),
      ...c('India and the Contemporary World II', 10, [
        'The Rise of Nationalism in Europe',
        'Nationalism in India',
        'The Making of a Global World',
        'The Age of Industrialisation',
        'Print Culture and the Modern World',
      ]),
      ...c('Themes in Indian History I', 12, [
        'Bricks, Beads and Bones (Harappan Civilisation)',
        'Kings, Farmers and Towns',
        'Kinship, Caste and Class',
        'Thinkers, Beliefs and Buildings',
      ]),
      ...c('Themes in Indian History II', 12, [
        'Through the Eyes of Travellers',
        'Bhakti-Sufi Traditions',
        'An Imperial Capital: Vijayanagara',
        'Peasants, Zamindars and the State',
        'Kings and Chronicles: The Mughal Courts',
      ]),
      ...c('Themes in Indian History III', 12, [
        'Colonialism and the Countryside',
        'Rebels and the Raj: 1857',
        'Mahatma Gandhi and the Nationalist Movement',
        'Framing the Constitution',
      ]),
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    paper: 'GS1',
    chapters: [
      ...c('The Earth: Our Habitat', 6, [
        'The Earth in the Solar System',
        'Globe: Latitudes and Longitudes',
        'Motions of the Earth',
        'Maps',
        'Major Domains of the Earth',
        'Major Landforms of the Earth',
        'Our Country India',
      ]),
      ...c('Our Environment', 7, [
        'Environment',
        'Inside Our Earth',
        'Our Changing Earth',
        'Air',
        'Water',
        'Natural Vegetation and Wildlife',
        'Human Environment Settlement, Transport and Communication',
      ]),
      ...c('Fundamentals of Physical Geography', 11, [
        'Geography as a Discipline',
        'The Origin and Evolution of the Earth',
        'Interior of the Earth',
        'Distribution of Oceans and Continents',
        'Geomorphic Processes',
        'Landforms and their Evolution',
        'Composition and Structure of Atmosphere',
        'Solar Radiation, Heat Balance and Temperature',
        'Atmospheric Circulation and Weather Systems',
        'Water in the Atmosphere',
        'World Climate and Climate Change',
        'Water (Oceans)',
        'Movements of Ocean Water',
        'Biodiversity and Conservation',
      ]),
      ...c('India: Physical Environment', 11, [
        'India: Location',
        'Structure and Physiography',
        'Drainage System',
        'Climate',
        'Natural Vegetation',
        'Soils',
        'Natural Hazards and Disasters',
      ]),
      ...c('Fundamentals of Human Geography', 12, [
        'Human Geography: Nature and Scope',
        'The World Population: Distribution, Density and Growth',
        'Human Development',
        'Primary Activities',
        'Secondary Activities',
        'Tertiary and Quaternary Activities',
        'Transport and Communication',
        'International Trade',
      ]),
      ...c('India: People and Economy', 12, [
        'Population: Distribution, Density, Growth and Composition',
        'Migration: Types, Causes and Consequences',
        'Human Settlements',
        'Land Resources and Agriculture',
        'Water Resources',
        'Mineral and Energy Resources',
        'Planning and Sustainable Development in Indian Context',
      ]),
    ],
  },
  {
    id: 'economics',
    name: 'Economics',
    paper: 'GS3',
    chapters: [
      ...c('Understanding Economic Development', 10, [
        'Development',
        'Sectors of the Indian Economy',
        'Money and Credit',
        'Globalisation and the Indian Economy',
        'Consumer Rights',
      ]),
      ...c('Indian Economic Development', 11, [
        'Indian Economy on the Eve of Independence',
        'Indian Economy 1950-1990',
        'Liberalisation, Privatisation and Globalisation: An Appraisal',
        'Poverty',
        'Human Capital Formation in India',
        'Rural Development',
        'Employment: Growth, Informalisation and Other Issues',
        'Environment and Sustainable Development',
        'Comparative Development Experiences of India and its Neighbours',
      ]),
      ...c('Introductory Macroeconomics', 12, [
        'Introduction to Macroeconomics',
        'National Income Accounting',
        'Money and Banking',
        'Determination of Income and Employment',
        'Government Budget and the Economy',
        'Open Economy Macroeconomics',
      ]),
    ],
  },
  {
    id: 'science_tech',
    name: 'Science & Technology',
    paper: 'GS3',
    chapters: [
      ...c('Science', 9, [
        'Matter in Our Surroundings',
        'Is Matter Around Us Pure',
        'Atoms and Molecules',
        'Structure of the Atom',
        'The Fundamental Unit of Life',
        'Tissues',
        'Motion',
        'Force and Laws of Motion',
        'Gravitation',
        'Work and Energy',
        'Sound',
        'Improvement in Food Resources',
      ]),
      ...c('Science', 10, [
        'Chemical Reactions and Equations',
        'Acids, Bases and Salts',
        'Metals and Non-metals',
        'Carbon and its Compounds',
        'Life Processes',
        'Control and Coordination',
        'How do Organisms Reproduce?',
        'Heredity and Evolution',
        'Light: Reflection and Refraction',
        'Electricity',
        'Magnetic Effects of Electric Current',
        'Our Environment',
      ]),
      ...c('Biology', 12, [
        'Reproduction in Organisms',
        'Human Health and Disease',
        'Microbes in Human Welfare',
        'Biotechnology: Principles and Processes',
        'Biotechnology and its Applications',
        'Ecosystem',
        'Biodiversity and Conservation',
        'Environmental Issues',
      ]),
    ],
  },
  {
    id: 'environment',
    name: 'Environment',
    paper: 'GS3',
    chapters: [
      ...c('Biology', 12, [
        'Organisms and Populations',
        'Ecosystem',
        'Biodiversity and Conservation',
        'Environmental Issues',
      ]),
      ...c('Fundamentals of Physical Geography', 11, [
        'Biodiversity and Conservation',
        'World Climate and Climate Change',
      ]),
      ...c('India: Physical Environment', 11, [
        'Natural Vegetation',
        'Natural Hazards and Disasters',
      ]),
      ...c('Indian Economic Development', 11, [
        'Environment and Sustainable Development',
      ]),
    ],
  },
  {
    id: 'ethics',
    name: 'Ethics',
    paper: 'GS4',
    chapters: [
      ...c('Psychology (Themes in Psychology)', 12, [
        'Self and Personality',
        'Human Strengths and Meeting Life Challenges',
        'Attitude and Social Cognition',
        'Social Influence and Group Processes',
      ]),
      ...c('Political Theory', 11, [
        'Freedom',
        'Equality',
        'Social Justice',
        'Rights',
        'Secularism',
      ]),
      ...c('2nd ARC Report (Ethics in Governance)', 0, [
        'Ethical Framework in Governance',
        'Institutional Framework: CVC, Lokpal and Lokayukta',
        'Protecting the Whistleblowers',
        'Citizens Charters and Grievance Redressal',
        'Code of Ethics for Ministers and Legislators',
      ]),
    ],
  },
];

export interface PyqPaper {
  id: string;
  year: number;
  exam: 'Prelims' | 'Mains';
  paper: string;
  subject: string;
  questions: number;
  marks: number;
  /** Official UPSC page hosting the paper */
  url: string;
}

const UPSC_PYQ_URL = 'https://upsc.gov.in/examinations/previous-question-papers';

const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

export const PYQ_PAPERS: PyqPaper[] = years.flatMap((year) => [
  {
    id: `pre-gs1-${year}`,
    year,
    exam: 'Prelims' as const,
    paper: 'General Studies Paper I',
    subject: 'General Studies',
    questions: 100,
    marks: 200,
    url: UPSC_PYQ_URL,
  },
  {
    id: `pre-csat-${year}`,
    year,
    exam: 'Prelims' as const,
    paper: 'CSAT Paper II',
    subject: 'Aptitude',
    questions: 80,
    marks: 200,
    url: UPSC_PYQ_URL,
  },
  {
    id: `mains-gs1-${year}`,
    year,
    exam: 'Mains' as const,
    paper: 'GS Paper I — Heritage, History, Geography, Society',
    subject: 'History',
    questions: 20,
    marks: 250,
    url: UPSC_PYQ_URL,
  },
  {
    id: `mains-gs2-${year}`,
    year,
    exam: 'Mains' as const,
    paper: 'GS Paper II — Polity, Governance, IR',
    subject: 'Polity',
    questions: 20,
    marks: 250,
    url: UPSC_PYQ_URL,
  },
  {
    id: `mains-gs3-${year}`,
    year,
    exam: 'Mains' as const,
    paper: 'GS Paper III — Economy, Environment, Sci-Tech, Security',
    subject: 'Economics',
    questions: 20,
    marks: 250,
    url: UPSC_PYQ_URL,
  },
  {
    id: `mains-gs4-${year}`,
    year,
    exam: 'Mains' as const,
    paper: 'GS Paper IV — Ethics, Integrity and Aptitude',
    subject: 'Ethics',
    questions: 12,
    marks: 250,
    url: UPSC_PYQ_URL,
  },
  {
    id: `mains-essay-${year}`,
    year,
    exam: 'Mains' as const,
    paper: 'Essay Paper',
    subject: 'Essay',
    questions: 2,
    marks: 250,
    url: UPSC_PYQ_URL,
  },
]);

export const SUBJECT_NAMES = SYLLABUS.map((s) => s.name);
