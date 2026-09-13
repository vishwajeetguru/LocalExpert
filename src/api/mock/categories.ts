import { Category } from '../../types/models';

interface GroupDef {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  tint: string;
  popular?: boolean;
  section?: string;
  leaves: [id: string, slug: string, name: string, icon?: string, keywords?: string[]][];
}

const GROUPS: GroupDef[] = [
  { id: 'g-repairs', slug: 'repairs', name: 'Repairs', tagline: 'Appliance & home repairs', icon: 'wrench', tint: '#FFE9E2', popular: true, leaves: [
    ['c-ac', 'ac-repair', 'AC Repair', 'snowflake'], ['c-cooler', 'cooler-repair', 'Cooler Repair', 'air-conditioner'],
    ['c-fridge', 'refrigerator-repair', 'Refrigerator Repair', 'fridge'], ['c-washing', 'washing-machine-repair', 'Washing Machine Repair', 'washing-machine'],
    ['c-tv', 'tv-repair', 'TV Repair', 'television'], ['c-mobile', 'mobile-repair', 'Mobile Repair', 'cellphone'],
    ['c-computer', 'computer-repair', 'Laptop & Computer Repair', 'laptop'], ['c-fan', 'fan-repair', 'Fan Repair', 'fan'],
    ['c-inverter', 'inverter-repair', 'Inverter Repair', 'battery-charging'], ['c-electrician', 'electrician', 'Electrical Repair', 'lightning-bolt', ['electrician', 'bijli', 'wiring', 'switch', 'light']],
    ['c-plumber', 'plumber', 'Plumbing Repair', 'pipe-wrench', ['plumber', 'nal', 'leak', 'tap', 'bathroom', 'pipe']],
    ['c-bike', 'bike-repair', 'Bike Repair', 'motorbike'], ['c-car', 'car-repair', 'Car Repair', 'car'],
    ['c-other-repair', 'other-repairs', 'Other Repairs', 'tools'],
  ]},
  { id: 'g-painting', slug: 'painting', name: 'Painting', tagline: 'Walls, textures & waterproofing', icon: 'format-paint', tint: '#FFF3E2', popular: true, leaves: [
    ['c-painter', 'painter', 'Home Painting'], ['c-interior-paint', 'interior-painting', 'Interior Painting'],
    ['c-exterior-paint', 'exterior-painting', 'Exterior Painting'], ['c-wall-paint', 'wall-painting', 'Wall Painting'],
    ['c-texture-paint', 'texture-painting', 'Texture Painting'], ['c-commercial-paint', 'commercial-painting', 'Commercial Painting'],
    ['c-furniture-paint', 'furniture-painting', 'Furniture Painting'], ['c-waterproofing', 'waterproofing', 'Waterproofing'],
  ]},
  { id: 'g-cleaning', slug: 'cleaning', name: 'Cleaning', tagline: 'Deep home & office cleaning', icon: 'spray-bottle', tint: '#E9FBEF', popular: true, leaves: [
    ['c-home-clean', 'home-cleaning', 'Home Cleaning'], ['c-cleaning', 'deep-cleaning', 'Deep Cleaning', undefined, ['cleaning', 'safai', 'deep clean', 'kitchen']],
    ['c-bath-clean', 'bathroom-cleaning', 'Bathroom Cleaning'], ['c-kitchen-clean', 'kitchen-cleaning', 'Kitchen Cleaning'],
    ['c-sofa-clean', 'sofa-cleaning', 'Sofa Cleaning'], ['c-carpet-clean', 'carpet-cleaning', 'Carpet Cleaning'],
    ['c-office-clean', 'office-cleaning', 'Office Cleaning'], ['c-tank-clean', 'water-tank-cleaning', 'Water Tank Cleaning'],
    ['c-commercial-clean', 'commercial-cleaning', 'Commercial Cleaning'],
  ]},
  { id: 'g-business', slug: 'business-development', name: 'Business Development', tagline: 'Grow your business', icon: 'briefcase', tint: '#EDEBFF', leaves: [
    ['c-biz-consult', 'business-consultant', 'Business Consultant'], ['c-digi-marketing', 'digital-marketing', 'Digital Marketing'],
    ['c-social-marketing', 'social-media-marketing', 'Social Media Marketing'], ['c-seo', 'seo-services', 'SEO Services'],
    ['c-branding', 'branding', 'Branding'], ['c-lead-gen', 'lead-generation', 'Lead Generation'],
    ['c-biz-strategy', 'business-strategy', 'Business Strategy'], ['c-sales-consult', 'sales-consultant', 'Sales Consultant'],
    ['c-web-dev', 'website-development', 'Website Development'], ['c-biz-reg', 'business-registration', 'Business Registration'],
  ]},
  { id: 'g-coaching', slug: 'coaching', name: 'Coaching', tagline: '1:1 expert coaching', icon: 'account-tie', tint: '#FFF6DB', leaves: [
    ['c-career-coach', 'career-coaching', 'Career Coaching'], ['c-biz-coach', 'business-coaching', 'Business Coaching'],
    ['c-personal-coach', 'personal-coaching', 'Personal Coaching'], ['c-fitness-coach', 'fitness-coaching', 'Fitness Coaching'],
    ['c-life-coach', 'life-coaching', 'Life Coaching'], ['c-interview-coach', 'interview-coaching', 'Interview Coaching'],
    ['c-comm-coach', 'communication-coaching', 'Communication Coaching'], ['c-skill-coach', 'skill-coaching', 'Skill Coaching'],
  ]},
  { id: 'g-education', slug: 'education-classes', name: 'Education & Classes', tagline: 'Tutors & courses', icon: 'school', tint: '#FEF9C3', popular: true, leaves: [
    ['c-tutor', 'tutor', 'Home Tutor', undefined, ['tutor', 'tuition', 'teacher', 'maths', 'coaching']],
    ['c-school-tuition', 'school-tuition', 'School Tuition'], ['c-comp-exams', 'competitive-exams', 'Competitive Exams'],
    ['c-spoken-eng', 'spoken-english', 'Spoken English'], ['c-comp-classes', 'computer-classes', 'Computer Classes'],
    ['c-coding', 'coding-classes', 'Coding Classes'], ['c-music', 'music-classes', 'Music Classes', 'music'],
    ['c-dance', 'dance-classes', 'Dance Classes'], ['c-art', 'art-classes', 'Art Classes', 'palette'],
  ]},
  { id: 'g-beauty', slug: 'beauty-salon', name: 'Beauty & Salon', tagline: 'Grooming at home', icon: 'content-cut', tint: '#FDF2F8', popular: true, leaves: [
    ['c-haircut', 'haircut', 'Haircut'], ['c-hair-style', 'hair-styling', 'Hair Styling'],
    ['c-hair-colour', 'hair-colour', 'Hair Colour'], ['c-facial', 'facial', 'Facial'],
    ['c-makeup', 'makeup', 'Makeup'], ['c-bridal', 'bridal-makeup', 'Bridal Makeup'],
    ['c-mehndi', 'mehndi', 'Mehndi'], ['c-mani-pedi', 'manicure-pedicure', 'Manicure & Pedicure'],
    ['c-spa', 'spa', 'Spa'], ['c-salon', 'salon', 'Unisex Salon', 'store', ['salon', 'haircut', 'beauty', 'parlour', 'shave']],
  ]},
  { id: 'g-health', slug: 'health-wellness', name: 'Health & Wellness', tagline: 'Doctors & fitness', icon: 'heart-pulse', tint: '#ECFDF5', popular: true, leaves: [
    ['c-doctor', 'doctor', 'Doctor', 'stethoscope', ['doctor', 'clinic', 'fever', 'physician']],
    ['c-dentist', 'dentist', 'Dentist', 'tooth', ['dentist', 'teeth', 'dental', 'pain']],
    ['c-physio', 'physiotherapy', 'Physiotherapy'], ['c-nutrition', 'nutritionist', 'Nutritionist', 'food-apple'],
    ['c-yoga', 'yoga', 'Yoga'], ['c-fitness', 'fitness-trainer', 'Fitness Trainer', 'dumbbell'],
    ['c-mental', 'mental-wellness', 'Mental Wellness'], ['c-nursing', 'home-nursing', 'Home Nursing'],
  ]},
  { id: 'g-tech', slug: 'technology', name: 'Technology', tagline: 'Web, IT & devices', icon: 'laptop', tint: '#EFF6FF', leaves: [
    ['c-web-dev2', 'website-development', 'Website Development', 'web'], ['c-app-dev', 'app-development', 'App Development', 'cellphone'],
    ['c-comp-services', 'computer-services', 'Computer Services', 'cog'], ['c-it-support', 'it-support', 'IT Support', 'wrench'],
    ['c-cctv', 'cctv-installation', 'CCTV Installation', 'video'], ['c-networking', 'networking', 'Networking', 'wifi'],
    ['c-software', 'software-installation', 'Software Installation', 'download'], ['c-recovery', 'data-recovery', 'Data Recovery', 'database'],
  ]},
  { id: 'g-vehicle', slug: 'vehicle-services', name: 'Vehicle Services', tagline: 'Bikes, cars & wash', icon: 'car', tint: '#F1F5F9', popular: true, leaves: [
    ['c-bike-service', 'bike-service', 'Bike Service', 'motorbike'], ['c-car-service', 'car-service', 'Car Service', 'car'],
    ['c-car-wash', 'car-washing', 'Car Washing', 'water'], ['c-bike-wash', 'bike-washing', 'Bike Washing', 'motorbike'],
    ['c-puncture', 'puncture-repair', 'Puncture Repair', 'lifebuoy'], ['c-battery', 'battery-service', 'Battery Service', 'battery-charging'],
    ['c-tyre', 'tyre-service', 'Tyre Service', 'cog'], ['c-towing', 'towing', 'Towing', 'truck'],
  ]},
  { id: 'g-home', slug: 'home-services', name: 'Home Services', tagline: 'Carpenter, electrician & more', icon: 'home', tint: '#FFF7ED', popular: true, leaves: [
    ['c-carpenter', 'carpenter', 'Carpenter', 'hammer', ['carpenter', 'suthar', 'furniture', 'door', 'bed', 'table']],
    ['c-furniture', 'furniture-making', 'Furniture Making'], ['c-modular', 'modular-kitchen', 'Modular Kitchen'],
    ['c-interior', 'interior-design', 'Interior Design', 'palette'], ['c-home-plumb', 'home-plumbing', 'Plumbing', 'pipe-wrench'],
    ['c-home-elec', 'home-electrician', 'Electrician', 'lightning-bolt'], ['c-pest', 'pest-control', 'Pest Control', 'bug'],
    ['c-home-security', 'home-security', 'Home Security', 'shield'],
  ]},
  { id: 'g-events', slug: 'events-creative', name: 'Events & Creative', tagline: 'Shoots, decor & catering', icon: 'camera', tint: '#F5F3FF', leaves: [
    ['c-photo', 'photographer', 'Photography', undefined, ['photo', 'wedding', 'shoot', 'photographer']],
    ['c-video', 'videography', 'Videography', 'video'], ['c-wedding', 'wedding-photography', 'Wedding Photography', 'heart'],
    ['c-decor', 'event-decoration', 'Event Decoration', 'star'], ['c-dj', 'dj', 'DJ', 'music'],
    ['c-catering', 'catering', 'Catering', 'food'], ['c-planner', 'event-planner', 'Event Planner', 'calendar-check'],
    ['c-invite', 'invitation-design', 'Invitation Design', 'email'],
  ]},
  { id: 'g-professional', slug: 'professional-services', name: 'Professional Services', tagline: 'CA, legal & finance', icon: 'scale-balance', tint: '#EEF2FF', leaves: [
    ['c-ca', 'ca', 'CA', 'calculator'], ['c-lawyer', 'lawyer', 'Lawyer', 'gavel'],
    ['c-architect', 'architect', 'Architect', 'ruler'], ['c-interior-des', 'interior-designer', 'Interior Designer', 'palette'],
    ['c-insurance', 'insurance-agent', 'Insurance Agent', 'shield-check'], ['c-realestate', 'real-estate-agent', 'Real Estate Agent', 'home'],
    ['c-finance', 'financial-advisor', 'Financial Advisor', 'chart-line'], ['c-tax', 'tax-consultant', 'Tax Consultant', 'file-document'],
  ]},
  { id: 'g-moving', slug: 'moving-logistics', name: 'Moving & Logistics', tagline: 'Shift anything safely', icon: 'truck', tint: '#F1F5F9', leaves: [
    ['c-packers', 'packers-movers', 'Packers & Movers', 'package-variant'], ['c-transport', 'local-transport', 'Local Transport', 'map-marker'],
    ['c-mini-truck', 'mini-truck', 'Mini Truck'], ['c-courier', 'courier', 'Courier', 'send'],
    ['c-delivery', 'delivery', 'Delivery'], ['c-storage', 'storage', 'Storage', 'archive'],
  ]},
  { id: 'g-other', slug: 'other-services', name: 'Other Services', tagline: 'Everyday local help', icon: 'dots-horizontal', tint: '#F8FAFC', leaves: [
    ['c-laundry', 'laundry', 'Laundry', 'washing-machine'], ['c-tailor', 'tailor', 'Tailor', 'scissors-cutting', ['tailor', 'darzi', 'stitch', 'blouse', 'alter']],
    ['c-locksmith', 'locksmith', 'Locksmith', 'key'], ['c-guard', 'security-guard', 'Security Guard', 'shield'],
    ['c-driver', 'driver', 'Driver', 'car'], ['c-help', 'domestic-help', 'Domestic Help', 'account'],
    ['c-print', 'printing', 'Printing & Flex', 'printer', ['print', 'xerox', 'flex', 'visiting card']],
    ['c-other', 'other', 'Other'],
  ]},
  { id: 'g-district', slug: 'district-administration', name: 'District Administration', tagline: 'Collectorate & revenue offices', icon: 'office-building', tint: '#EFF6FF', section: 'government', leaves: [
    ['c-collector', 'collector-office', 'Collector Office'], ['c-dm', 'district-magistrate-office', 'District Magistrate Office'],
    ['c-tahsil', 'tahsil-office', 'Tahsil Office'], ['c-sdo', 'sub-divisional-office', 'Sub-Divisional Office'],
    ['c-taluka-off', 'taluka-office', 'Taluka Office'], ['c-revenue', 'revenue-office', 'Revenue Office'],
    ['c-municipal', 'municipal-corporation', 'Municipal / Nagar Parishad'],
  ]},
  { id: 'g-police', slug: 'police-law', name: 'Police & Law', tagline: 'Stations & help centres', icon: 'shield', tint: '#EFF6FF', section: 'government', leaves: [
    ['c-police-stn', 'police-station', 'Police Station'], ['c-traffic', 'traffic-police', 'Traffic Police', 'traffic-light'],
    ['c-commissioner', 'police-commissionerate', 'Police Commissionerate'], ['c-sp', 'sp-office', 'Superintendent of Police Office'],
    ['c-cyber', 'cyber-crime-police', 'Cyber Crime Police', 'laptop'], ['c-women-ps', 'women-police-station', 'Women Police Station'],
    ['c-police-help', 'police-help-centre', 'Police Help Centre'],
  ]},
  { id: 'g-courts', slug: 'courts-legal', name: 'Courts & Legal', tagline: 'All courts & legal aid', icon: 'gavel', tint: '#F5F3FF', section: 'government', leaves: [
    ['c-dist-court', 'district-court', 'District Court'], ['c-civil-court', 'civil-court', 'Civil Court'],
    ['c-criminal-court', 'criminal-court', 'Criminal Court'], ['c-taluka-court', 'taluka-court', 'Taluka Court'],
    ['c-family-court', 'family-court', 'Family Court'], ['c-consumer-court', 'consumer-court', 'Consumer Court'],
    ['c-legal-aid', 'legal-aid-office', 'Legal Aid Office'], ['c-lok-adalat', 'lok-adalat', 'Lok Adalat'],
  ]},
  { id: 'g-govthealth', slug: 'govt-health', name: 'Government Health', tagline: 'Hospitals & PHCs', icon: 'hospital-box', tint: '#ECFDF5', section: 'government', leaves: [
    ['c-govt-hosp', 'government-hospital', 'Government Hospital'], ['c-civil-hosp', 'civil-hospital', 'Civil Hospital'],
    ['c-rural-hosp', 'rural-hospital', 'Rural Hospital'], ['c-phc', 'primary-health-centre', 'Primary Health Centre'],
    ['c-chc', 'community-health-centre', 'Community Health Centre'], ['c-dispensary', 'government-dispensary', 'Government Dispensary'],
    ['c-health-dept', 'health-department-office', 'Health Department Office'], ['c-ambulance', 'ambulance-services', 'Ambulance Services', 'ambulance'],
  ]},
  { id: 'g-certs', slug: 'certificates-documents', name: 'Certificates & Documents', tagline: 'Aadhaar, PAN & records', icon: 'file-document', tint: '#FFFBEB', section: 'government', leaves: [
    ['c-aadhaar', 'aadhaar-centre', 'Aadhaar Centre', 'card'], ['c-pan', 'pan-services', 'PAN Services'],
    ['c-birth', 'birth-certificate', 'Birth Certificate'], ['c-death', 'death-certificate', 'Death Certificate'],
    ['c-income', 'income-certificate', 'Income Certificate'], ['c-caste', 'caste-certificate', 'Caste Certificate'],
    ['c-domicile', 'domicile-certificate', 'Domicile Certificate'], ['c-residence', 'residence-certificate', 'Residence Certificate'],
    ['c-other-cert', 'other-certificates', 'Other Certificates'],
  ]},
  { id: 'g-election', slug: 'election-services', name: 'Election Services', tagline: 'Voter & election help', icon: 'vote', tint: '#FFF7ED', section: 'government', leaves: [
    ['c-election-off', 'election-office', 'Election Office'], ['c-voter-reg', 'voter-registration', 'Voter Registration'],
    ['c-electoral', 'electoral-office', 'Electoral Office'], ['c-election-help', 'election-help-centre', 'Election Help Centre'],
  ]},
  { id: 'g-rto', slug: 'transport-rto', name: 'Transport & RTO', tagline: 'Licence & registration', icon: 'badge-account', tint: '#F1F5F9', section: 'government', leaves: [
    ['c-rto', 'rto-office', 'RTO Office'], ['c-driving', 'driving-licence', 'Driving Licence', 'card'],
    ['c-vehicle-reg', 'vehicle-registration', 'Vehicle Registration'], ['c-fitness', 'vehicle-fitness', 'Vehicle Fitness'],
    ['c-learner', 'learner-licence', 'Learner Licence'], ['c-transport-dept', 'transport-department', 'Transport Department'],
  ]},
  { id: 'g-agri', slug: 'agriculture', name: 'Agriculture', tagline: 'Agri offices & soil testing', icon: 'sprout', tint: '#ECFCCB', section: 'government', leaves: [
    ['c-agri-off', 'agriculture-office', 'Agriculture Office'], ['c-agri-dept', 'agriculture-department', 'Agriculture Department'],
    ['c-krishi', 'krishi-seva-kendra', 'Krishi Seva Kendra'], ['c-agri-officer', 'agriculture-officer', 'Agriculture Officer'],
    ['c-soil', 'soil-testing-centre', 'Soil Testing Centre', 'flask'], ['c-farmer-help', 'farmer-help-centre', 'Farmer Help Centre'],
  ]},
  { id: 'g-schemes', slug: 'schemes-welfare', name: 'Schemes & Welfare', tagline: 'Pensions, jobs & aid', icon: 'heart', tint: '#FDF2F8', section: 'government', leaves: [
    ['c-social-welfare', 'social-welfare-office', 'Social Welfare Office'], ['c-wcd', 'women-child-development', 'Women & Child Development'],
    ['c-pension', 'pension-office', 'Pension Office', 'cash'], ['c-employment', 'employment-office', 'Employment Office', 'briefcase'],
    ['c-labour', 'labour-office', 'Labour Office'], ['c-disability', 'disability-welfare', 'Disability Welfare'],
    ['c-scheme-help', 'scheme-help-centre', 'Government Scheme Help Centre'],
  ]},
  { id: 'g-govtedu', slug: 'govt-education', name: 'Government Education', tagline: 'Schools & scholarships', icon: 'school', tint: '#FEFCE8', section: 'government', leaves: [
    ['c-govt-school', 'government-school', 'Government School'], ['c-zp-school', 'zilla-parishad-school', 'Zilla Parishad School'],
    ['c-govt-college', 'government-college', 'Government College'], ['c-edu-dept', 'education-department', 'Education Department'],
    ['c-scholarship', 'scholarship-office', 'Scholarship Office'], ['c-board', 'education-board-office', 'Education Board Office'],
  ]},
  { id: 'g-utilities', slug: 'utilities-infra', name: 'Utilities & Infrastructure', tagline: 'Power, water & PWD', icon: 'water', tint: '#EFF6FF', section: 'government', leaves: [
    ['c-electricity', 'electricity-office', 'Electricity Office', 'lightning-bolt'], ['c-water-supply', 'water-supply-office', 'Water Supply Office'],
    ['c-pwd', 'pwd', 'Public Works Department'], ['c-muni-services', 'municipal-services', 'Municipal Services'],
    ['c-sanitation', 'sanitation-department', 'Sanitation Department'], ['c-grievance', 'grievance-office', 'Public Grievance Office'],
  ]},
  { id: 'g-othergovt', slug: 'other-govt', name: 'Other Government Offices', tagline: 'Post, passport, tax & more', icon: 'bank', tint: '#F1F5F9', section: 'government', leaves: [
    ['c-post', 'post-office', 'Post Office', 'email'], ['c-passport', 'passport-office', 'Passport Office', 'book'],
    ['c-income-tax', 'income-tax-office', 'Income Tax Office'], ['c-gst', 'gst-office', 'GST Office'],
    ['c-epfo', 'epfo-office', 'EPFO Office'], ['c-esic', 'esic-office', 'ESIC Office'],
    ['c-food-supply', 'food-civil-supplies', 'Food & Civil Supplies'], ['c-other-govt', 'other-govt-offices', 'Other Government Offices'],
  ]},
];

function buildCategories(): Category[] {
  const out: Category[] = [];
  for (const g of GROUPS) {
    out.push({
      id: g.id, slug: g.slug, name: g.name, tagline: g.tagline, icon: g.icon,
      tint: g.tint, vendorCount: 0, popular: !!g.popular, parentId: null,
      section: g.section ?? 'services', keywords: [g.slug, g.name.toLowerCase()],
    });
    for (const [lid, slug, name, icon, kw] of g.leaves) {
      const base = [...slug.split('-'), ...name.toLowerCase().split(/[^a-z]+/), g.name.toLowerCase()];
      out.push({
        id: lid, slug, name, tagline: g.tagline, icon: icon ?? g.icon,
        tint: g.tint, vendorCount: 0, popular: false, parentId: g.id,
        section: g.section ?? 'services',
        keywords: Array.from(new Set([...base, ...(kw ?? [])].filter(Boolean))),
      });
    }
  }
  return out;
}

export const mockCategories: Category[] = buildCategories();

export const popularSearches = [
  'AC Repair',
  'Cooler repair',
  'Fan repair',
  'Plumber',
  'Dentist',
  'Mobile display change',
  'Salon near me',
  'RTO Office',
];
