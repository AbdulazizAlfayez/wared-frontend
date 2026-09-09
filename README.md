# Saudi Car Sale

A modern car marketplace for buying and selling cars in Saudi Arabia. Built with Next.js, Convex, and Tailwind CSS.

![Saudi Car Sale](https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800)

## Features

- **Browse Cars**: Filter cars by make, model, year, price, mileage, fuel type, transmission, condition, and city
- **User Authentication**: Secure email/password authentication using Convex Auth
- **Favorites**: Save cars to your favorites list for later viewing
- **Appointment Booking**: Schedule viewing appointments with sellers
- **Responsive Design**: Modern, Revolut-inspired UI that works on all devices
- **Real-time Updates**: Powered by Convex for instant data synchronization

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Backend**: Convex (serverless backend)
- **Database**: Convex Database
- **Authentication**: Convex Auth with Email/Password
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. **Clone the repository**
   ```bash
   cd SaudiCarSale
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Prompt you to log in to Convex
   - Create a new project
   - Set up your deployment
   - Start syncing your functions

4. **Configure environment variables**
   
   The `npx convex dev` command will automatically create a `.env.local` file with your Convex URL. Make sure it contains:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
   ```

5. **Seed the database (optional)**
   
   Import sample car data:
   ```bash
   npx convex import --table cars sampleCars.jsonl
   ```
   
   Note: The sample data includes placeholder values. In production, you'll need to update the `sellerId` fields to reference actual user IDs.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
SaudiCarSale/
├── app/                    # Next.js App Router pages
│   ├── auth/               # Authentication pages
│   ├── browse/             # Car browsing page
│   ├── car/[id]/           # Car detail page
│   ├── favorites/          # User favorites
│   ├── appointments/       # User appointments
│   ├── about/              # About page
│   ├── contact/            # Contact page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # Reusable components
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Site footer
│   ├── Hero.tsx            # Landing page hero
│   ├── SearchBox.tsx       # Car search form
│   ├── CarCard.tsx         # Car listing card
│   ├── CarFilters.tsx      # Filter sidebar
│   └── CarGrid.tsx         # Car listings grid
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── auth.ts             # Auth configuration
│   ├── cars.ts             # Car queries/mutations
│   ├── favorites.ts        # Favorites logic
│   ├── appointments.ts     # Appointments logic
│   └── users.ts            # User functions
└── public/                 # Static assets
```

## Database Schema

### Tables

- **users**: Extended user profiles
- **cars**: Car listings with all details
- **favorites**: User-car favorites relationship
- **appointments**: Booking appointments

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx convex dev` - Start Convex development

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variable: `NEXT_PUBLIC_CONVEX_URL`
4. Deploy!

### Convex Production

```bash
npx convex deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is for educational purposes. Feel free to use and modify as needed.

## Support

For questions or support, please open an issue or contact us at support@wared.sa
