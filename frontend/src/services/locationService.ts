export type LocationMode = 'real' | 'mock';

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  source: LocationMode;
  updatedAt: number;
}

let watchId: number | null = null;
let currentMockPos: [number, number] = [10.7580, 106.7020];
let keydownListener: ((e: KeyboardEvent) => void) | null = null;

export function startLocationTracking(
  mode: LocationMode,
  onPosition: (pos: UserPosition) => void
) {
  stopLocationTracking();

  if (mode === 'real') {
    let lastUpdate = 0;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          // Throttle updates to ~5 seconds
          if (now - lastUpdate >= 5000) {
            lastUpdate = now;
            onPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'real',
              updatedAt: now
            });
          }
        },
        (error) => {
          console.warn('Real GPS access failed, falling back to mock mode.', error);
          startLocationTracking('mock', onPosition);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('Geolocation not supported, falling back to mock mode.');
      startLocationTracking('mock', onPosition);
    }
  } else {
    // Mock mode
    // Initial emit
    onPosition({
      lat: currentMockPos[0],
      lng: currentMockPos[1],
      source: 'mock',
      updatedAt: Date.now()
    });

    keydownListener = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = 0.00015;
        let lat = currentMockPos[0];
        let lng = currentMockPos[1];

        switch (e.key) {
          case 'ArrowUp':
            lat += delta;
            break;
          case 'ArrowDown':
            lat -= delta;
            break;
          case 'ArrowLeft':
            lng -= delta;
            break;
          case 'ArrowRight':
            lng += delta;
            break;
        }

        // Apply boundaries [10.7500, 106.6950] (SW) to [10.7650, 106.7150] (NE)
        lat = Math.max(10.7500, Math.min(10.7650, lat));
        lng = Math.max(106.6950, Math.min(106.7150, lng));

        currentMockPos = [lat, lng];

        onPosition({
          lat,
          lng,
          source: 'mock',
          updatedAt: Date.now()
        });
      }
    };

    window.addEventListener('keydown', keydownListener);
  }
}

export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (keydownListener !== null) {
    window.removeEventListener('keydown', keydownListener);
    keydownListener = null;
  }
}

export async function requestBestEffortPosition(): Promise<UserPosition> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: 'real',
            updatedAt: Date.now()
          });
        },
        () => {
          resolve({
            lat: currentMockPos[0],
            lng: currentMockPos[1],
            source: 'mock',
            updatedAt: Date.now()
          });
        },
        { timeout: 5000 }
      );
    } else {
      resolve({
        lat: currentMockPos[0],
        lng: currentMockPos[1],
        source: 'mock',
        updatedAt: Date.now()
      });
    }
  });
}
