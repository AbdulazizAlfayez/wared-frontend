// Mock workshop data - will be replaced with Convex data later

export interface WorkshopCar {
  id: string;
  title: string;
  priceSar: number;
  year: number;
  make: string;
  model: string;
  image: string;
}

export interface Workshop {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  services: string[];
  rating: number;
  cars: WorkshopCar[];
}

export const sampleWorkshops: Workshop[] = [
  {
    id: "ws-1",
    name: "Al Jazirah Auto Service",
    city: "Riyadh",
    address: "King Fahd Road, Al Olaya District",
    lat: 24.7136,
    lng: 46.6753,
    phone: "+966 11 234 5678",
    services: ["Inspection", "Repair", "Paint", "Tires"],
    rating: 4.8,
    cars: [
      { id: "c1", title: "2023 Toyota Camry", priceSar: 125000, year: 2023, make: "Toyota", model: "Camry", image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400" },
      { id: "c2", title: "2022 Honda Accord", priceSar: 115000, year: 2022, make: "Honda", model: "Accord", image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400" },
      { id: "c3", title: "2024 Lexus ES", priceSar: 195000, year: 2024, make: "Lexus", model: "ES", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400" },
    ],
  },
  {
    id: "ws-2",
    name: "Gulf Motors Workshop",
    city: "Riyadh",
    address: "Exit 10, Northern Ring Road",
    lat: 24.7741,
    lng: 46.7386,
    phone: "+966 11 456 7890",
    services: ["Inspection", "Repair", "AC Service"],
    rating: 4.5,
    cars: [
      { id: "c4", title: "2023 Nissan Altima", priceSar: 98000, year: 2023, make: "Nissan", model: "Altima", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400" },
      { id: "c5", title: "2022 Hyundai Sonata", priceSar: 89000, year: 2022, make: "Hyundai", model: "Sonata", image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400" },
    ],
  },
  {
    id: "ws-3",
    name: "Red Sea Auto Care",
    city: "Jeddah",
    address: "Palestine Street, Al Hamra District",
    lat: 21.5433,
    lng: 39.1728,
    phone: "+966 12 345 6789",
    services: ["Inspection", "Repair", "Paint", "Detailing"],
    rating: 4.7,
    cars: [
      { id: "c6", title: "2024 BMW 3 Series", priceSar: 245000, year: 2024, make: "BMW", model: "3 Series", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400" },
      { id: "c7", title: "2023 Mercedes C-Class", priceSar: 265000, year: 2023, make: "Mercedes-Benz", model: "C-Class", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400" },
      { id: "c8", title: "2022 Audi A4", priceSar: 215000, year: 2022, make: "Audi", model: "A4", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400" },
    ],
  },
  {
    id: "ws-4",
    name: "Corniche Motors",
    city: "Jeddah",
    address: "Corniche Road, Al Shati District",
    lat: 21.5169,
    lng: 39.1367,
    phone: "+966 12 567 8901",
    services: ["Repair", "Tires", "Oil Change"],
    rating: 4.3,
    cars: [
      { id: "c9", title: "2023 Toyota Land Cruiser", priceSar: 385000, year: 2023, make: "Toyota", model: "Land Cruiser", image: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=400" },
      { id: "c10", title: "2024 GMC Yukon", priceSar: 345000, year: 2024, make: "GMC", model: "Yukon", image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400" },
    ],
  },
  {
    id: "ws-5",
    name: "Eastern Province Auto Hub",
    city: "Dammam",
    address: "King Saud Street, Al Faisaliyah",
    lat: 26.4207,
    lng: 50.0888,
    phone: "+966 13 234 5678",
    services: ["Inspection", "Repair", "Paint", "Tires", "AC Service"],
    rating: 4.9,
    cars: [
      { id: "c11", title: "2023 Ford F-150", priceSar: 225000, year: 2023, make: "Ford", model: "F-150", image: "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=400" },
      { id: "c12", title: "2024 Chevrolet Tahoe", priceSar: 295000, year: 2024, make: "Chevrolet", model: "Tahoe", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400" },
      { id: "c13", title: "2022 Jeep Wrangler", priceSar: 185000, year: 2022, make: "Jeep", model: "Wrangler", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
    ],
  },
  {
    id: "ws-6",
    name: "Khobar Premium Service",
    city: "Khobar",
    address: "Prince Turki Street, Al Khobar",
    lat: 26.2172,
    lng: 50.1971,
    phone: "+966 13 456 7890",
    services: ["Inspection", "Detailing", "Paint"],
    rating: 4.6,
    cars: [
      { id: "c14", title: "2024 Porsche Cayenne", priceSar: 485000, year: 2024, make: "Porsche", model: "Cayenne", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400" },
      { id: "c15", title: "2023 Land Rover Defender", priceSar: 395000, year: 2023, make: "Land Rover", model: "Defender", image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400" },
    ],
  },
  {
    id: "ws-7",
    name: "Holy City Motors",
    city: "Makkah",
    address: "Third Ring Road, Al Aziziyah",
    lat: 21.3891,
    lng: 39.8579,
    phone: "+966 12 678 9012",
    services: ["Inspection", "Repair", "Tires"],
    rating: 4.4,
    cars: [
      { id: "c16", title: "2023 Toyota Hilux", priceSar: 145000, year: 2023, make: "Toyota", model: "Hilux", image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400" },
      { id: "c17", title: "2022 Nissan Patrol", priceSar: 275000, year: 2022, make: "Nissan", model: "Patrol", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400" },
      { id: "c18", title: "2024 Kia Sportage", priceSar: 115000, year: 2024, make: "Kia", model: "Sportage", image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400" },
    ],
  },
  {
    id: "ws-8",
    name: "Madinah Auto Excellence",
    city: "Madinah",
    address: "King Abdullah Road, Al Arid",
    lat: 24.4539,
    lng: 39.6142,
    phone: "+966 14 234 5678",
    services: ["Inspection", "Repair", "AC Service", "Oil Change"],
    rating: 4.7,
    cars: [
      { id: "c19", title: "2023 Hyundai Tucson", priceSar: 125000, year: 2023, make: "Hyundai", model: "Tucson", image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400" },
      { id: "c20", title: "2024 Mazda CX-5", priceSar: 135000, year: 2024, make: "Mazda", model: "CX-5", image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400" },
    ],
  },
  {
    id: "ws-9",
    name: "Mountain View Auto",
    city: "Abha",
    address: "King Khalid Road, Al Sadd",
    lat: 18.2164,
    lng: 42.5053,
    phone: "+966 17 234 5678",
    services: ["Inspection", "Repair", "Paint", "Tires"],
    rating: 4.5,
    cars: [
      { id: "c21", title: "2023 Toyota Fortuner", priceSar: 175000, year: 2023, make: "Toyota", model: "Fortuner", image: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=400" },
      { id: "c22", title: "2022 Mitsubishi Pajero", priceSar: 155000, year: 2022, make: "Mitsubishi", model: "Pajero", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
      { id: "c23", title: "2024 Isuzu D-Max", priceSar: 125000, year: 2024, make: "Isuzu", model: "D-Max", image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400" },
    ],
  },
  {
    id: "ws-10",
    name: "Taif Rose Auto",
    city: "Taif",
    address: "Shubra Street, Al Hada",
    lat: 21.2703,
    lng: 40.4158,
    phone: "+966 12 789 0123",
    services: ["Repair", "Detailing", "AC Service"],
    rating: 4.2,
    cars: [
      { id: "c24", title: "2023 Honda CR-V", priceSar: 145000, year: 2023, make: "Honda", model: "CR-V", image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400" },
      { id: "c25", title: "2022 Nissan X-Trail", priceSar: 125000, year: 2022, make: "Nissan", model: "X-Trail", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400" },
    ],
  },
  {
    id: "ws-11",
    name: "Qassim Central Motors",
    city: "Buraidah",
    address: "King Abdulaziz Road, Al Nakhil",
    lat: 26.3667,
    lng: 43.9667,
    phone: "+966 16 234 5678",
    services: ["Inspection", "Repair", "Tires", "Oil Change"],
    rating: 4.6,
    cars: [
      { id: "c26", title: "2024 Toyota Corolla", priceSar: 95000, year: 2024, make: "Toyota", model: "Corolla", image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400" },
      { id: "c27", title: "2023 Hyundai Elantra", priceSar: 85000, year: 2023, make: "Hyundai", model: "Elantra", image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400" },
      { id: "c28", title: "2022 Kia K5", priceSar: 92000, year: 2022, make: "Kia", model: "K5", image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400" },
    ],
  },
  {
    id: "ws-12",
    name: "Desert Star Auto Care",
    city: "Riyadh",
    address: "Takhassusi Street, Al Mohammadiyah",
    lat: 24.7542,
    lng: 46.6396,
    phone: "+966 11 567 8901",
    services: ["Inspection", "Paint", "Detailing", "Tires"],
    rating: 4.8,
    cars: [
      { id: "c29", title: "2024 Genesis G80", priceSar: 275000, year: 2024, make: "Genesis", model: "G80", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400" },
      { id: "c30", title: "2023 Infiniti Q50", priceSar: 195000, year: 2023, make: "Infiniti", model: "Q50", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400" },
    ],
  },
];

// Helper function to get workshops (for future Convex integration)
export function getWorkshops(): Workshop[] {
  return sampleWorkshops;
}

// Helper function to search workshops
export function searchWorkshops(query: string): Workshop[] {
  const lowerQuery = query.toLowerCase();
  return sampleWorkshops.filter(
    (workshop) =>
      workshop.name.toLowerCase().includes(lowerQuery) ||
      workshop.city.toLowerCase().includes(lowerQuery) ||
      workshop.services.some((service) => service.toLowerCase().includes(lowerQuery))
  );
}
