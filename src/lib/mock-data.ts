export interface ServiceRequest {
  id: string;
  userName: string;
  carModel: string;
  carYear: number;
  issueDescription: string;
  distance: string;
  urgency: "emergency" | "scheduled";
  status: "pending" | "offered" | "in_progress" | "completed" | "cancelled";
  timestamp: string;
  photos?: string[];
  location: string;
  estimatedPrice?: number;
  offerPrice?: number;
  offerMessage?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: "service" | "part";
  description: string;
  price: number;
  stock?: number;
  unit?: string;
  active: boolean;
}

export interface Mechanic {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  active: boolean;
}

export interface NearbyCenter {
  id: string;
  name: string;
  type: string;
  distance: string;
  rating: number;
  reviews: number;
  openNow: boolean;
  services: string[];
  phone: string;
}

export interface UserRequest {
  id: string;
  service: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  center: string;
  date: string;
  price?: number;
}

export const mockRequests: ServiceRequest[] = [
  {
    id: "REQ-001",
    userName: "Ahmed M.",
    carModel: "Hyundai Elantra",
    carYear: 2021,
    issueDescription: "Engine won't start, clicking sound when turning key. Battery might be dead.",
    distance: "3.2 km",
    urgency: "emergency",
    status: "pending",
    timestamp: "2024-01-15T10:30:00Z",
    photos: ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400"],
    location: "Nasr City, Cairo",
    estimatedPrice: 800,
  },
  {
    id: "REQ-002",
    userName: "Sara K.",
    carModel: "Toyota Corolla",
    carYear: 2019,
    issueDescription: "Flat tire on highway, need immediate assistance. Spare tire is also damaged.",
    distance: "1.8 km",
    urgency: "emergency",
    status: "pending",
    timestamp: "2024-01-15T10:45:00Z",
    photos: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400"],
    location: "Maadi, Cairo",
    estimatedPrice: 450,
  },
  {
    id: "REQ-003",
    userName: "Mohamed A.",
    carModel: "Kia Sportage",
    carYear: 2022,
    issueDescription: "Scheduled maintenance - oil change, brake inspection, and filter replacement.",
    distance: "5.5 km",
    urgency: "scheduled",
    status: "offered",
    timestamp: "2024-01-15T09:00:00Z",
    photos: [],
    location: "New Cairo",
    estimatedPrice: 1200,
    offerPrice: 1150,
    offerMessage: "Includes synthetic oil, brake check, and all filters. Available tomorrow 9 AM.",
  },
  {
    id: "REQ-004",
    userName: "Fatima H.",
    carModel: "Nissan Sunny",
    carYear: 2018,
    issueDescription: "AC not cooling properly, strange noise from compressor.",
    distance: "2.1 km",
    urgency: "scheduled",
    status: "in_progress",
    timestamp: "2024-01-15T08:15:00Z",
    photos: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400"],
    location: "Heliopolis, Cairo",
    estimatedPrice: 1500,
    offerPrice: 1450,
    offerMessage: "AC compressor check and refrigerant refill. Will update by 2 PM.",
  },
  {
    id: "REQ-005",
    userName: "Omar T.",
    carModel: "Chevrolet Cruze",
    carYear: 2020,
    issueDescription: "Battery replacement needed. Car won't start after sitting for a week.",
    distance: "4.7 km",
    urgency: "emergency",
    status: "completed",
    timestamp: "2024-01-14T16:30:00Z",
    photos: [],
    location: "Zamalek, Cairo",
    estimatedPrice: 950,
    offerPrice: 900,
    offerMessage: "New battery installed with 2-year warranty. All done!",
  },
  {
    id: "REQ-006",
    userName: "Layla S.",
    carModel: "Mitsubishi Lancer",
    carYear: 2017,
    issueDescription: "Brake pads squeaking, need inspection and replacement.",
    distance: "6.2 km",
    urgency: "scheduled",
    status: "cancelled",
    timestamp: "2024-01-14T14:00:00Z",
    photos: [],
    location: "Dokki, Cairo",
    estimatedPrice: 800,
  },
];

export const mockServices: ServiceItem[] = [
  {
    id: "SVC-001",
    name: "Oil Change (Synthetic)",
    category: "service",
    description: "Full synthetic oil change with filter replacement",
    price: 450,
    active: true,
  },
  {
    id: "SVC-002",
    name: "Brake Pad Replacement",
    category: "service",
    description: "Front or rear brake pads replacement with inspection",
    price: 650,
    active: true,
  },
  {
    id: "SVC-003",
    name: "Battery Replacement",
    category: "service",
    description: "New battery installation with testing and disposal of old battery",
    price: 850,
    active: true,
  },
  {
    id: "SVC-004",
    name: "AC Service & Recharge",
    category: "service",
    description: "AC system inspection, leak test, and refrigerant recharge",
    price: 1200,
    active: true,
  },
  {
    id: "SVC-005",
    name: "Tire Rotation & Balance",
    category: "service",
    description: "Rotate all 4 tires and balance for even wear",
    price: 200,
    active: true,
  },
  {
    id: "SVC-006",
    name: "Engine Diagnostic",
    category: "service",
    description: "Full computer diagnostic scan and report",
    price: 350,
    active: true,
  },
];

export const mockParts: ServiceItem[] = [
  {
    id: "PRT-001",
    name: "Brake Pads Set (Front) - Toyota/Hyundai",
    category: "part",
    description: "Ceramic brake pads for front wheels",
    price: 450,
    stock: 12,
    unit: "set",
    active: true,
  },
  {
    id: "PRT-002",
    name: "Oil Filter - Universal",
    category: "part",
    description: "High-quality oil filter compatible with most models",
    price: 85,
    stock: 45,
    unit: "pcs",
    active: true,
  },
  {
    id: "PRT-003",
    name: "Car Battery 60Ah",
    category: "part",
    description: "Maintenance-free car battery with 2-year warranty",
    price: 750,
    stock: 8,
    unit: "pcs",
    active: true,
  },
  {
    id: "PRT-004",
    name: "Air Filter - Kia/Hyundai",
    category: "part",
    description: "Engine air filter for Kia and Hyundai models",
    price: 120,
    stock: 20,
    unit: "pcs",
    active: true,
  },
  {
    id: "PRT-005",
    name: "Spark Plugs Set (4pcs)",
    category: "part",
    description: "Iridium spark plugs for better performance",
    price: 280,
    stock: 30,
    unit: "set",
    active: true,
  },
  {
    id: "PRT-006",
    name: "Coolant - 1L",
    category: "part",
    description: "Long-life engine coolant concentrate",
    price: 95,
    stock: 50,
    unit: "bottle",
    active: true,
  },
];

export const mockMechanics: Mechanic[] = [
  {
    id: "MEC-001",
    name: "Ahmed Hassan",
    specialization: "Engine & Transmission",
    phone: "+20 100 123 4567",
    email: "ahmed@autocare.com",
    active: true,
  },
  {
    id: "MEC-002",
    name: "Mohamed Ali",
    specialization: "Electrical & AC Systems",
    phone: "+20 101 234 5678",
    email: "mohamed@autocare.com",
    active: true,
  },
  {
    id: "MEC-003",
    name: "Omar Mahmoud",
    specialization: "Brakes & Suspension",
    phone: "+20 102 345 6789",
    email: "omar@autocare.com",
    active: false,
  },
];

export const mockNearbyCenters: NearbyCenter[] = [
  {
    id: "C-001",
    name: "AutoCare Pro Center",
    type: "Mechanical Repair",
    distance: "1.2 km",
    rating: 4.8,
    reviews: 124,
    openNow: true,
    services: ["Engine Repair", "Brakes", "Oil Change"],
    phone: "+20 100 123 4567",
  },
  {
    id: "C-002",
    name: "Speedy Tires & Lube",
    type: "Towing/Roadside Assistance",
    distance: "2.5 km",
    rating: 4.6,
    reviews: 89,
    openNow: true,
    services: ["Tire Change", "Towing", "Battery"],
    phone: "+20 101 234 5678",
  },
  {
    id: "C-003",
    name: "ElectroAuto Shop",
    type: "Auto Electric",
    distance: "3.1 km",
    rating: 4.7,
    reviews: 56,
    openNow: false,
    services: ["Wiring", "Battery", "Sensors"],
    phone: "+20 102 345 6789",
  },
  {
    id: "C-004",
    name: "PartsHub Spare Parts",
    type: "Spare Parts Shop",
    distance: "4.0 km",
    rating: 4.5,
    reviews: 210,
    openNow: true,
    services: ["OEM Parts", "Accessories", "Delivery"],
    phone: "+20 103 456 7890",
  },
];

export const mockUserRequests: UserRequest[] = [
  {
    id: "U-001",
    service: "Oil Change",
    status: "completed",
    center: "AutoCare Pro Center",
    date: "2024-01-10",
    price: 450,
  },
  {
    id: "U-002",
    service: "Battery Replacement",
    status: "accepted",
    center: "Speedy Tires & Lube",
    date: "2024-01-14",
    price: 900,
  },
  {
    id: "U-003",
    service: "Tire Change",
    status: "pending",
    center: "Speedy Tires & Lube",
    date: "2024-01-15",
  },
];

export const serviceTypes = [
  "Mechanical Repair",
  "Auto Electric",
  "Spare Parts Shop",
  "Towing/Roadside Assistance",
  "Gas Station",
];

export const urgencyLabels = {
  emergency: "Emergency",
  scheduled: "Scheduled",
};

export const urgencyColors = {
  emergency: "bg-red-500/20 text-red-400 border-red-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export const statusLabels = {
  pending: "Pending",
  offered: "Offer Sent",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offered: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};