# Qulron YMS Check-in Frontend

A modern, multilingual yard management system frontend built with Angular 19, featuring real-time location tracking, interactive maps, and comprehensive driver/broker management capabilities.

## 🚀 Features

### Core Functionality
- **Driver Dashboard** - Real-time location tracking, route visualization, and task management
- **Broker Dashboard** - Order management and driver coordination
- **Interactive Maps** - Leaflet-based mapping with OSRM routing integration
- **User Management** - Role-based access control for drivers and brokers
- **Order Tracking** - Complete order lifecycle management
- **Trailer Management** - Assignment and tracking of trailers

### Technical Features
- **Multilingual Support** - 11 languages supported (English, Spanish, French, German, Arabic, Hindi, Korean, Russian, Tagalog, Vietnamese, Chinese)
- **JWT Authentication** - Secure token-based authentication
- **Real-time Updates** - Live location tracking and status updates
- **Responsive Design** - Mobile-first responsive UI
- **Progressive Web App** capabilities

## 🛠️ Tech Stack

- **Framework**: Angular 19.2.0
- **Language**: TypeScript 5.7.2
- **Mapping**: Leaflet 1.9.4 with Leaflet Routing Machine
- **Internationalization**: ngx-translate
- **Authentication**: JWT with jwt-decode
- **Styling**: CSS3 with responsive design
- **Build Tool**: Angular CLI 19.2.5

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm (v8 or higher)
- Angular CLI (`npm install -g @angular/cli`)
- Backend API running (see backend documentation)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd qulron-yms-frontend
npm install
```

### 2. Environment Configuration
Update the environment files:

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:30060/api',
  osrmServiceUrl: 'https://your-osrm-server/route/v1',
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  osrmServiceUrl: 'https://your-osrm-server/route/v1',
};
```

### 3. Start Development Server
```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200`

## 🏗️ Build & Deployment

### Development Build
```bash
npm run build
# or
ng build
```

### Production Build
```bash
ng build --configuration production
```

### Watch Mode (Development)
```bash
npm run watch
# or
ng build --watch --configuration development
```

## 🧪 Testing

Run unit tests:
```bash
npm test
# or
ng test
```

## 🌍 Internationalization

The application supports 11 languages out of the box:

| Language | Code | File |
|----------|------|------|
| English | en | `en.json` |
| Spanish | es | `es.json` |
| French | fr | `fr.json` |
| German | de | `de.json` |
| Arabic | ar | `ar.json` |
| Hindi | hi | `hi.json` |
| Korean | ko | `ko.json` |
| Russian | ru | `ru.json` |
| Tagalog | tl | `tl.json` |
| Vietnamese | vi | `vi.json` |
| Chinese | zh | `zh.json` |

### Adding New Translations
1. Add new translation keys to `src/assets/i18n/en.json`
2. Translate the keys in all other language files
3. Use in templates: `{{ 'YOUR_KEY' | translate }}`

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── broker-dashboard/       # Broker management interface
│   │   ├── driver-dashboard/       # Driver interface with maps
│   │   ├── custom-facility-map/    # Interactive map component
│   │   ├── create-order-trailer/   # Trailer assignment modal
│   │   └── user-management/        # Authentication components
│   │       ├── broker-gateway/
│   │       ├── driver-gateway/
│   │       └── user-gateway/
│   ├── core/
│   │   ├── enums/                  # Application enumerations
│   │   ├── guards/                 # Route guards
│   │   ├── models/                 # TypeScript interfaces
│   │   └── service/                # Business logic services
│   └── shared/
│       ├── directives/             # Custom directives
│       ├── pipes/                  # Custom pipes
│       └── reusableComponents/     # Shared components
├── assets/
│   ├── i18n/                      # Translation files
│   ├── images/                    # Static images
│   └── leaflet/                   # Map assets
└── environments/                  # Environment configurations
```

## 🔧 Key Components

### Driver Dashboard
- Real-time GPS tracking
- Route visualization with turn-by-turn directions
- Order details and customer information
- Arrival confirmation and status updates
- Multilingual interface

### Broker Dashboard
- Order creation and management
- Driver assignment and tracking
- Load monitoring and coordination
- Communication tools

### Custom Facility Map
- Interactive facility layout
- Real-time driver positioning
- Route optimization with OSRM
- Destination guidance within facility

## 🔐 Authentication

The application uses JWT-based authentication with role-based access:

- **Drivers**: Access to driver dashboard and order details
- **Brokers**: Access to broker dashboard and order management
- **Admins**: Full system access

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers (1920x1080+)
- Tablets (768px - 1024px)
- Mobile devices (320px - 768px)

## 🗺️ Map Integration

### OSRM Integration
- Real-time route calculation
- Turn-by-turn navigation
- Distance and ETA calculations
- Custom routing profiles

### Leaflet Features
- Interactive maps with zoom/pan
- Custom markers and popups
- Real-time location updates
- Facility boundary visualization

## 🔄 Real-time Features

- Live GPS tracking
- Automatic status updates
- Real-time distance calculations
- Instant notification system

## 📊 Performance

- Lazy loading of components
- Optimized bundle size
- Efficient change detection
- Memory leak prevention

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Map Not Loading:**
- Check OSRM service URL in environment files
- Verify network connectivity to mapping services
- Check browser console for CORS errors

**Translation Issues:**
- Verify all translation files have matching keys
- Check for JSON syntax errors in i18n files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Qulron YMS.

## 📞 Support

For technical support or questions:
- Email: lutfibk25@gmail.com
\

---

**Last Updated**: 2025
**Version**: 1.0.0
**Angular Version**: 19.2.0