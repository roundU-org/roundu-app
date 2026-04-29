# RoundU Project Specification

This document provides a comprehensive overview of the pages, components, and technical specifications of the RoundU project.

## Tech Stack
- **Framework**: [React](https://reactjs.org/) (with [Vite](https://vitejs.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query) and Custom `AppContext`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Pages & Routes

The application is divided into common flows, customer-specific flows, and provider-specific flows. All routes are wrapped in a `MobileLayout`.

### Common & Auth Routes
| Route | Component | Description |
| :--- | :--- | :--- |
| `/` | `Splash` | Initial splash screen (Logo/Brand intro) |
| `/login` | `Login` | Phone number entry for authentication |
| `/otp` | `OtpVerify` | OTP verification screen |
| `/role` | `RoleSelect` | User role selection (Customer or Provider) |
| `/location` | `Location` | GPS/Location permission and selection |

### Customer Flow
| Route | Component | Description |
| :--- | :--- | :--- |
| `/home` | `Home` | Customer dashboard with services and search |
| `/search` | `SearchPage` | Search for services or providers |
| `/services` | `ServicesPage` | List of available service categories |
| `/service-select/:serviceId` | `ServiceSelection` | Select specific service details/options |
| `/providers/:serviceId` | `ProvidersPage` | List of providers for a specific service |
| `/provider/:id` | `ProviderDetail` | Detailed profile of a service provider |
| `/booking/date` | `BookingDate` | Select date for the service booking |
| `/booking/time` | `BookingTime` | Select time slot for the service booking |
| `/booking/notes` | `BookingNotes` | Add notes or voice instructions for the booking |
| `/booking/payment` | `BookingPayment` | Payment method selection and summary |
| `/booking/success/:id` | `BookingSuccess` | Confirmation screen after successful booking |
| `/tracking/:id` | `Tracking` | Live tracking of the service provider |
| `/rating/:id` | `Rating` | Provide feedback and rating for a completed service |
| `/bookings` | `Bookings` | List of user's past and upcoming bookings |
| `/bookings/:id` | `BookingDetail` | Detailed view of a specific booking |
| `/home-care` | `Subscription` | Subscription plans/Home care services |
| `/profile` | `Profile` | Customer profile management |
| `/emergency` | `Emergency` | Emergency contact and assistance |

### Provider Flow
| Route | Component | Description |
| :--- | :--- | :--- |
| `/provider` | `ProviderDashboard` | Main dashboard for service providers |
| `/provider/select-service`| `SelectService` | Service category selection for providers |
| `/provider/personal-details`| `PersonalDetails` | Onboarding: Personal info collection |
| `/provider/digilocker-kyc`| `DigiLockerKYC` | KYC verification via DigiLocker |
| `/provider/video-portfolio`| `ProviderVideoPortfolio`| Portfolio upload (Video/Images) |
| `/provider/gps-consent`| `GpsConsent` | GPS tracking consent for providers |
| `/provider/pending-approval`| `PendingApproval`| Wait screen for admin profile approval |
| `/provider/job/:id` | `ProviderJob` | Active job details and status management |
| `/provider/earnings` | `ProviderEarnings` | Earnings overview and statistics |
| `/provider/profile` | `ProviderProfile` | Provider profile management |

---

## Reusable Components

Located in `src/components`, these are the custom building blocks used across the application.

- **`BookingCard.tsx`**: Displays summary info for a booking in lists.
- **`BottomNav.tsx`**: Main navigation bar for mobile users.
- **`EmptyState.tsx`**: Placeholder for empty lists or search results.
- **`FilterModal.tsx`**: Modal for filtering search or provider results.
- **`MobileLayout.tsx`**: Container component ensuring consistency on mobile screens.
- **`NavLink.tsx`**: Helper for navigation items with active states.
- **`ProviderCard.tsx`**: Displays provider info (name, rating, price) in lists.
- **`ScreenHeader.tsx`**: Standardized header with back button and title.
- **`ServiceCard.tsx`**: Visual card representing a service category.

---

## UI Library (shadcn/ui)

Located in `src/components/ui`. These are base atomic components used to build more complex UI.

- **Layout**: `card`, `separator`, `tabs`, `accordion`, `resizable`, `scroll-area`, `sidebar`.
- **Form Elements**: `button`, `input`, `checkbox`, `radio-group`, `select`, `slider`, `switch`, `textarea`, `label`, `toggle`, `toggle-group`, `input-otp`.
- **Feedback**: `alert`, `alert-dialog`, `dialog`, `drawer`, `sheet`, `toast`, `sonner`, `skeleton`, `progress`.
- **Data Display**: `avatar`, `badge`, `table`, `chart`, `calendar`, `carousel`, `aspect-ratio`.
- **Navigation**: `breadcrumb`, `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `pagination`.
- **Overlay**: `popover`, `tooltip`, `hover-card`, `command`.

---

## State & Data Management

- **`AppContext.tsx`**: Centralized state management for authentication, user profiles, and global app settings.
- **Hooks**: Custom hooks in `src/hooks` for shared logic.
- **TanStack Query**: Used for data fetching, caching, and synchronization with the backend.
