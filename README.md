
# Amazon Clone - Modern E-commerce Platform

A beautiful, feature-rich Amazon clone built with React, TypeScript, and Tailwind CSS, featuring gradient color schemes and smooth animations.

## 🌟 Features

### 🎨 Design & UX
- **Gradient Color Palette**: Beautiful yellow-orange and blue-purple gradients
- **Smooth Animations**: Fade-in, scale, and hover effects throughout
- **Responsive Design**: Optimized for all screen sizes
- **Modern UI Components**: Built with shadcn/ui components

### 🛍️ E-commerce Features
- **Product Catalog**: Browse products with categories and filters
- **Shopping Cart**: Add, remove, and modify cart items
- **Product Search**: Real-time search functionality
- **Product Categories**: Electronics, Fashion, Home & Garden, Sports, etc.
- **Prime Badges**: Special marking for Prime products
- **Ratings & Reviews**: Display product ratings and review counts
- **Price Comparisons**: Show original vs. sale prices with discount badges

### 🏗️ Technical Features
- **TypeScript**: Full type safety throughout the application
- **Context API**: Efficient state management for cart functionality
- **Custom Hooks**: Reusable logic for products and API calls
- **Responsive Grid**: Dynamic product grid layout
- **Image Optimization**: Optimized loading with placeholders
- **Accessibility**: ARIA labels and keyboard navigation support

## 🎨 Color Palette

### Primary Gradients
- **Warm Gradient**: Yellow (#FFC107) to Orange (#FF9800)
- **Cool Gradient**: Dark Blue (#1A237E) to Purple (#7C4DFF)

### Semantic Colors
- **Background**: Light Gray (#FAFAFA)
- **Text**: Dark Gray (#333333)
- **Success**: Green variants for positive actions
- **Warning**: Orange variants for alerts
- **Error**: Red variants for errors

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amazon-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Landing hero section
│   ├── ProductGrid.tsx  # Product listing
│   ├── ProductCard.tsx  # Individual product cards
│   ├── Categories.tsx   # Category navigation
│   └── CartSidebar.tsx  # Shopping cart sidebar
├── contexts/            # React Context providers
│   └── CartContext.tsx  # Shopping cart state management
├── hooks/               # Custom React hooks
│   └── useProducts.ts   # Product data fetching
├── types/               # TypeScript type definitions
│   └── database.ts      # Database schema types
├── utils/               # Utility functions
│   └── api.ts          # API client and database queries
├── pages/               # Page components
│   └── Index.tsx       # Main landing page
└── index.css           # Global styles and design system
```

## 🗄️ Database Integration (Placeholder)

The application is structured for easy PostgreSQL integration:

### Database Schema
- **Users**: User accounts and authentication
- **Products**: Product catalog with categories
- **Orders**: Order management and history
- **Reviews**: Product reviews and ratings
- **Cart**: Persistent shopping cart items

### API Endpoints (Planned)
- `GET /api/products` - Fetch all products
- `GET /api/products/:id` - Fetch single product
- `POST /api/cart` - Add item to cart
- `POST /api/orders` - Create new order
- `POST /api/auth/login` - User authentication

## 🎭 Animation System

### Built-in Animations
- **Fade In**: Smooth element appearance
- **Scale In**: Gentle scaling effects
- **Slide In**: Sidebar and drawer animations
- **Hover Effects**: Interactive element responses

### Custom CSS Classes
- `.hover-lift`: Subtle hover elevation
- `.hover-glow`: Glowing shadow effects
- `.gradient-yellow-orange`: Warm gradient backgrounds
- `.gradient-blue-purple`: Cool gradient backgrounds
- `.text-gradient-warm`: Gradient text effects

## 🛠️ Technologies Used

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library
- **State Management**: React Context API
- **Icons**: Lucide React
- **Image Handling**: Unsplash placeholders

## 🔮 Future Enhancements

### Database Integration
- PostgreSQL database setup
- User authentication system
- Order management
- Product reviews and ratings
- Inventory management

### Advanced Features
- Payment processing (Stripe integration)
- Email notifications
- Advanced search and filtering
- Wishlist functionality
- Recommendation engine
- Admin dashboard

### Performance Optimizations
- Image lazy loading
- Virtual scrolling for large product lists
- Service worker for offline support
- CDN integration for static assets

## 🎯 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML elements
- Maintain accessibility standards

### Component Design
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Add loading and error states
- Follow the single responsibility principle

### State Management
- Use Context API for global state
- Keep local state minimal
- Implement proper data flow
- Use custom hooks for complex logic
- Maintain immutable state updates

## 📄 License

This project is built for educational purposes. Please ensure you comply with all applicable laws and regulations if using this code for commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions and support, please open an issue in the repository or contact the development team.

---

**Built with ❤️ using modern web technologies**
