# Minh's Completed Work

Here is the summary of work completed for **Minh's** assigned tasks on the Foodio CraveMap frontend project.

## 4.1 Offline Banner
- **Completed**: Created a new react component [OfflineBanner.tsx](file:///d:/Foodio/frontend/src/components/Common/OfflineBanner.tsx).
- **Functionality**: Listens to the `window.online` and `window.offline` events. Automatically displays a warning banner ("Đang dùng dữ liệu offline" / "Using offline data") at the top of the viewport when offline, without overlapping key navigation or map components.

## 4.2 IndexedDB Cache MVP
- **Completed**: Implemented a lightweight IndexedDB wrapper service in [offlineStore.ts](file:///d:/Foodio/frontend/src/services/offlineStore.ts).
- **Functionality**: Caches loaded `restaurants` and `audioTours` list locally. On startup, the app shell immediately loads and displays cached content for an offline-ready experience, updating it asynchronously on successful network fetch.

## 4.3 Service Worker & App Shell PWA
- **Completed**: Added a PWA web application manifest [manifest.webmanifest](file:///d:/Foodio/frontend/public/manifest.webmanifest) and static Service Worker [sw.js](file:///d:/Foodio/frontend/public/sw.js).
- **Functionality**: Implemented offline App Shell asset serving (HTML, JS, CSS, images, and fonts cache strategy) and registered the Service Worker inside [main.tsx](file:///d:/Foodio/frontend/src/main.tsx).

## 4.4 Public Detail UI Polish
- **Completed**: Updated review creation form inside [PageDetail.tsx](file:///d:/Foodio/frontend/src/pages/PageDetail.tsx).
- **Functionality**: Translated hardcoded labels and toast messages using react-i18next translations. This completely resolves Vietnamese encoding issues (Mojibake) and supports dynamic i18n English/Vietnamese language switching.

## 4.5 Search & Map UX Polish
- **Completed**: Fixed map search suggestion list behaviors inside [NavBar.tsx](file:///d:/Foodio/frontend/src/components/NavBar.tsx) and [PageMap.tsx](file:///d:/Foodio/frontend/src/pages/PageMap.tsx).
- **Functionality**: 
  - Standardized normalization to guarantee that both accented and accentless text searches (e.g. "oc", "Ốc") work correctly.
  - Implemented an `onBlur` timeout to automatically collapse suggestions when the user clicks elsewhere.
  - Ensured map markers are not hidden during active search terms.
  - Updated selection behaviors to pan (`setView`) directly to the selected restaurant. Added an offset on mobile devices to prevent bottom sheet overlap.

## 4.6 i18n Translation Completeness
- **Completed**: Configured both [vi/translation.json](file:///d:/Foodio/frontend/src/i18n/locales/vi/translation.json) and [en/translation.json](file:///d:/Foodio/frontend/src/i18n/locales/en/translation.json) translation dictionaries.
- **Functionality**: Added keys for offline alerts, review forms, buttons, and toast notifications. Tested language toggles successfully.
