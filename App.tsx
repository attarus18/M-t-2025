import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Heart, Droplets, Wind, Navigation, Plus, AlertCircle, RefreshCw, WifiOff, MapPinOff } from 'lucide-react';
import { fetchWeatherByCity, fetchWeatherByCoords, fetchForecastByCoords } from './services/weatherService';
import { WeatherData, ForecastData, FavoriteCity, ForecastItem, AppLocation } from './types';
import { WeatherIcon } from './components/WeatherIcon';
import { Drawer } from './components/Drawer';
import { ForecastDetailModal } from './components/ForecastDetailModal';

function App() {
  // --- State Management ---
  
  // Locations: always starts with GPS, followed by favorites
  const [favorites, setFavorites] = useState<FavoriteCity[]>(() => {
    try {
      const saved = localStorage.getItem('galaxy_weather_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Caches to store loaded data so swiping is instant
  const [weatherCache, setWeatherCache] = useState<{[key: number]: WeatherData}>({});
  const [forecastCache, setForecastCache] = useState<{[key: number]: ForecastData}>({});
  const [loadingMap, setLoadingMap] = useState<{[key: number]: boolean}>({});
  const [errorMap, setErrorMap] = useState<{[key: number]: { message: string, type: 'network' | 'gps' | 'general' }}>({});

  const [selectedForecastItem, setSelectedForecastItem] = useState<ForecastItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Touch handling for swipe
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  // Constructed list of all locations (GPS + Favorites)
  const allLocations: AppLocation[] = [
    { type: 'gps', id: 'gps', name: 'Posizione Corrente' },
    ...favorites.map(f => ({ type: 'saved' as const, id: f.id, name: f.name, country: f.country }))
  ];

  // --- Logic ---

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        // Retry loading current page if it was in error state due to network
        if (errorMap[currentIndex]?.type === 'network') {
            loadLocationData(currentIndex);
        }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentIndex, errorMap]);

  const getBackgroundClass = (iconCode: string) => {
    if (iconCode.includes('n')) return 'bg-gradient-to-b from-[#0f1026] via-[#1a1c38] to-[#24243e]'; 
    const code = iconCode.replace('d', '');
    switch (code) {
      case '01': return 'bg-gradient-to-b from-[#2c88f7] to-[#86c0f8]';
      case '02': case '03': return 'bg-gradient-to-b from-[#4e95e8] to-[#88b8e8]';
      case '04': return 'bg-gradient-to-b from-[#6b7b8c] to-[#9aa9ba]';
      case '09': case '10': return 'bg-gradient-to-b from-[#3a4b66] to-[#5d6d85]';
      case '11': return 'bg-gradient-to-b from-[#2d3038] to-[#4a4d55]';
      case '13': return 'bg-gradient-to-b from-[#9ba5b5] to-[#c2cddb]';
      case '50': return 'bg-gradient-to-b from-[#606c75] to-[#8c969e]';
      default: return 'bg-gradient-to-b from-[#2c88f7] to-[#86c0f8]';
    }
  };

  const updateCache = (index: number, weather: WeatherData | null, forecast: ForecastData | null, error: { message: string, type: 'network' | 'gps' | 'general' } | null) => {
    if (weather) setWeatherCache(prev => ({ ...prev, [index]: weather }));
    if (forecast) setForecastCache(prev => ({ ...prev, [index]: forecast }));
    if (error) setErrorMap(prev => ({ ...prev, [index]: error }));
    else setErrorMap(prev => { const n = {...prev}; delete n[index]; return n; });
    
    setLoadingMap(prev => ({ ...prev, [index]: false }));
  };

  const loadLocationData = useCallback(async (index: number) => {
    const location = allLocations[index];
    if (!location) return;

    // Immediate check for network
    if (!navigator.onLine) {
        updateCache(index, null, null, { message: "Nessuna connessione internet. Controlla Wi-Fi o Dati.", type: 'network' });
        return;
    }

    setLoadingMap(prev => ({ ...prev, [index]: true }));

    try {
      let weather: WeatherData;
      
      if (location.type === 'gps') {
        // Handle GPS
        if (!navigator.geolocation) {
             updateCache(index, null, null, { message: "Geolocalizzazione non supportata dal browser.", type: 'gps' });
             return;
        }
        
        await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                weather = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
                const forecast = await fetchForecastByCoords(pos.coords.latitude, pos.coords.longitude).catch(() => null);
                updateCache(index, weather, forecast, null);
                resolve();
              } catch (e: any) {
                // Network error during fetch despite having coords
                updateCache(index, null, null, { message: e.message || "Errore di connessione.", type: 'network' });
                resolve(); // Resolved promise but with error state handled
              }
            },
            (err) => {
              // Specific GPS Errors
              let msg = "Impossibile rilevare la posizione.";
              let type: 'gps' | 'general' = 'gps';

              switch(err.code) {
                  case 1: // PERMISSION_DENIED
                      msg = "Permesso di localizzazione negato. Abilita la posizione nelle impostazioni.";
                      break;
                  case 2: // POSITION_UNAVAILABLE
                      msg = "Segnale GPS debole o GPS spento. Attiva la posizione.";
                      break;
                  case 3: // TIMEOUT
                      msg = "Timeout richiesta GPS. Spostati in un'area aperta o riprova.";
                      break;
              }
              
              updateCache(index, null, null, { message: msg, type: type });
              resolve(); // Don't crash, just show error UI
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      } else {
        // Handle Saved City
        weather = await fetchWeatherByCity(location.name);
        const forecast = await fetchForecastByCoords(weather.coord.lat, weather.coord.lon).catch(() => null);
        updateCache(index, weather, forecast, null);
      }
    } catch (err: any) {
      console.error(`Error loading index ${index}`, err);
      // Catch-all for API errors (404, etc)
      updateCache(index, null, null, { message: err.message || "Errore di caricamento", type: 'general' });
    }
  }, [allLocations]); // Re-create if locations change, but generally stable

  // Load data when index changes or locations change
  useEffect(() => {
    // If we don't have data for current index, load it.
    // Also re-check if we have an error (to allow retry)
    const hasData = !!weatherCache[currentIndex];
    const hasError = !!errorMap[currentIndex];
    
    if (!hasData || hasError) {
       // Debounce slightly to allow swiping without triggering instant loads
       const timer = setTimeout(() => loadLocationData(currentIndex), 100);
       return () => clearTimeout(timer);
    }
  }, [currentIndex, allLocations.length, loadLocationData]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('galaxy_weather_favs', JSON.stringify(favorites));
  }, [favorites]);


  // --- Event Handlers ---

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < allLocations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const addFavorite = async (cityName: string) => {
    setIsDrawerOpen(false);
    
    if (!navigator.onLine) {
        alert("Impossibile cercare città: Nessuna connessione internet.");
        return;
    }

    const existsIndex = allLocations.findIndex(l => l.name.toLowerCase() === cityName.toLowerCase());
    if (existsIndex >= 0) {
      setCurrentIndex(existsIndex);
      return;
    }

    try {
        setLoadingMap(prev => ({...prev, [allLocations.length]: true}));
        const weather = await fetchWeatherByCity(cityName);
        const newFav: FavoriteCity = { id: weather.id, name: weather.name, country: weather.sys.country };
        
        setFavorites(prev => [...prev, newFav]);
        setWeatherCache(prev => ({ ...prev, [allLocations.length]: weather }));
        
        fetchForecastByCoords(weather.coord.lat, weather.coord.lon)
            .then(fore => setForecastCache(prev => ({ ...prev, [allLocations.length]: fore })))
            .catch(() => {});

        setCurrentIndex(allLocations.length);
        setLoadingMap(prev => ({...prev, [allLocations.length]: false}));

    } catch (e: any) {
        alert("Città non trovata: " + cityName);
        setLoadingMap(prev => ({...prev, [allLocations.length]: false}));
    }
  };

  const removeFavorite = (id: number) => {
    const indexToDelete = allLocations.findIndex(l => l.id === id);
    if (currentIndex >= indexToDelete && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const toggleCurrentFavorite = () => {
    const currentData = weatherCache[currentIndex];
    if (!currentData) return;
    
    const isSaved = favorites.some(f => f.id === currentData.id);
    if (isSaved) {
       removeFavorite(currentData.id);
    } else {
       const newFav: FavoriteCity = { id: currentData.id, name: currentData.name, country: currentData.sys.country };
       setFavorites(prev => [...prev, newFav]);
    }
  };

  // --- Render Helpers ---

  const currentData = weatherCache[currentIndex];
  const currentForecast = forecastCache[currentIndex];
  const currentLoading = loadingMap[currentIndex];
  const currentError = errorMap[currentIndex];

  const bgClass = currentData 
    ? getBackgroundClass(currentData.weather[0].icon) 
    : 'bg-gradient-to-b from-[#2c3e50] to-[#000000]';

  const isCurrentSaved = currentData && favorites.some(f => f.id === currentData.id);

  // Determine Error Icon
  const ErrorIcon = currentError?.type === 'network' ? WifiOff : (currentError?.type === 'gps' ? MapPinOff : AlertCircle);

  return (
    <div 
        className={`min-h-screen w-full ${bgClass} text-white transition-all duration-700 ease-in-out font-sans overflow-hidden flex flex-col relative`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      
      {/* Detail Modal */}
      <ForecastDetailModal 
        item={selectedForecastItem} 
        fullForecast={currentForecast?.list || []}
        onClose={() => setSelectedForecastItem(null)} 
      />

      {/* Drawer */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        favorites={favorites}
        onSelectCity={addFavorite}
        onSelectFavorite={(idx) => {
            setCurrentIndex(idx);
            setIsDrawerOpen(false);
        }}
        onRemoveFavorite={removeFavorite}
        onUseCurrentLocation={() => {
            setCurrentIndex(0);
            setIsDrawerOpen(false);
        }}
      />

      {/* Header */}
      <header className="w-full px-6 pt-6 pb-2 flex justify-between items-center z-20">
        <button 
          onClick={() => setIsDrawerOpen(true)} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 duration-200"
          aria-label="Menu"
        >
          <Menu size={26} />
        </button>
        
        {/* Dynamic Pagination Dots */}
        <div className="flex gap-1.5 items-center">
             <div 
                className={`transition-all duration-300 rounded-full cursor-pointer ${currentIndex === 0 ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'}`}
                onClick={() => setCurrentIndex(0)}
             />
             
             {favorites.map((_, idx) => {
                 const realIndex = idx + 1;
                 return (
                    <div 
                        key={idx}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${currentIndex === realIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'}`}
                        onClick={() => setCurrentIndex(realIndex)}
                    />
                 );
             })}
        </div>

        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 duration-200"
          aria-label="Aggiungi città"
        >
          <Plus size={26} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center px-6 overflow-y-auto no-scrollbar pb-10 z-10 relative">
        
        {currentLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse mt-20">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-sm font-medium opacity-60 tracking-widest uppercase">
                {currentIndex === 0 ? 'Cerco posizione...' : 'Caricamento meteo...'}
            </p>
          </div>
        ) : currentError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto mt-10 animate-slide-up">
            <div className="bg-white/10 p-8 rounded-[2rem] backdrop-blur-md border border-white/20 shadow-2xl w-full flex flex-col items-center">
              <ErrorIcon size={48} className="text-red-300 mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">
                  {currentError.type === 'network' ? 'Nessuna Connessione' : (currentError.type === 'gps' ? 'Posizione non disponibile' : 'Errore')}
              </h3>
              <p className="opacity-80 mb-8 text-sm leading-relaxed">{currentError.message}</p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => loadLocationData(currentIndex)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> Riprova
                </button>
                {/* Fallback to Manual Search if GPS fails */}
                {currentError.type === 'gps' && currentIndex === 0 && (
                     <button 
                     onClick={() => setIsDrawerOpen(true)}
                     className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     Cerca Città Manualmente
                   </button>
                )}
              </div>
            </div>
          </div>
        ) : currentData ? (
          <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-slide-up key={currentIndex}"> 
            
            {/* City Info */}
            <div className="flex flex-col items-center mt-4 mb-6">
              <h2 className="text-3xl font-normal tracking-wide flex items-center gap-2 drop-shadow-md text-center">
                {currentIndex === 0 && <Navigation size={20} className="fill-current" />} 
                {currentData.name}
              </h2>
              <p className="text-sm opacity-80 mt-1 font-light tracking-wide">
                {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Weather Hero */}
            <div className="flex flex-col items-center mb-12 relative w-full select-none">
              <div className="mb-4 filter drop-shadow-2xl scale-125 animate-float">
                <WeatherIcon iconCode={currentData.weather[0].icon} size={150} />
              </div>
              
              <div className="text-[6.5rem] leading-none font-thin tracking-tighter text-white drop-shadow-xl ml-4">
                {Math.round(currentData.main.temp)}°
              </div>

              <div className="text-xl font-medium capitalize mt-1 opacity-90 drop-shadow-md">
                {currentData.weather[0].description}
              </div>

              <div className="flex gap-6 mt-6 text-sm font-medium bg-black/20 px-6 py-2.5 rounded-full backdrop-blur-md border border-white/5 shadow-lg">
                <span className="flex items-center gap-1.5"><span className="opacity-60">Max</span> {Math.round(currentData.main.temp_max)}°</span>
                <div className="w-px bg-white/20 h-4"></div>
                <span className="flex items-center gap-1.5"><span className="opacity-60">Min</span> {Math.round(currentData.main.temp_min)}°</span>
              </div>
              
              <button 
                onClick={toggleCurrentFavorite}
                className="absolute top-0 right-2 p-3 rounded-full hover:bg-white/10 transition-all active:scale-90"
              >
                {isCurrentSaved ? (
                   <Heart size={24} className="text-red-500 fill-current drop-shadow-lg" />
                ) : (
                   <Heart size={24} className="text-white/60 hover:text-white transition-colors" />
                )}
              </button>
            </div>

            {/* Grid Stats */}
            <div className="w-full grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-5 flex flex-col gap-1 border border-white/10 shadow-lg">
                <div className="flex items-center gap-2 text-xs opacity-60 font-bold uppercase tracking-wider mb-1">
                  <Wind size={14} /> Vento
                </div>
                <span className="text-2xl font-medium">{Math.round(currentData.wind.speed * 3.6)} <span className="text-sm opacity-60 font-normal">km/h</span></span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-5 flex flex-col gap-1 border border-white/10 shadow-lg">
                <div className="flex items-center gap-2 text-xs opacity-60 font-bold uppercase tracking-wider mb-1">
                  <Droplets size={14} /> Umidità
                </div>
                <span className="text-2xl font-medium">{currentData.main.humidity}<span className="text-sm opacity-60 font-normal">%</span></span>
              </div>
            </div>

            {/* Forecast Sections */}
            {currentForecast ? (
              <>
                {/* Hourly */}
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[2rem] p-6 mb-6 border border-white/10 shadow-lg">
                  <h3 className="text-xs font-bold opacity-60 uppercase tracking-widest mb-5 flex items-center gap-2">
                    Previsioni Orarie
                  </h3>
                  <div className="flex overflow-x-auto gap-7 pb-2 no-scrollbar snap-x">
                    {currentForecast.list.slice(0, 10).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex flex-col items-center min-w-[3.5rem] gap-2 snap-start cursor-pointer hover:scale-110 transition-transform active:scale-95"
                        onClick={() => setSelectedForecastItem(item)}
                      >
                        <span className="text-xs font-medium opacity-80">
                          {idx === 0 ? 'Ora' : item.dt_txt.split(' ')[1].substring(0, 5)}
                        </span>
                        <div className="my-1 pointer-events-none">
                          <WeatherIcon iconCode={item.weather[0].icon} size={28} />
                        </div>
                        <span className="text-lg font-semibold">{Math.round(item.main.temp)}°</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily */}
                <div className="w-full bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 shadow-lg">
                   <h3 className="text-xs font-bold opacity-60 uppercase tracking-widest mb-4">
                    Prossimi giorni
                  </h3>
                  
                  {/* Column Headers */}
                  <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                      <span className="w-28">Giorno</span>
                      <span className="flex-1 text-center">Meteo</span>
                      <span className="w-28 text-right">Temp</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {currentForecast.list.filter((_, i) => i % 8 === 0).map((item, idx) => {
                      const date = new Date(item.dt * 1000);
                      const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                      const dayName = idx === 0 ? 'Oggi' : days[date.getDay()];
                      
                      return (
                        <div 
                            key={idx} 
                            className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded-xl cursor-pointer active:scale-98"
                            onClick={() => setSelectedForecastItem(item)}
                        >
                          <span className="w-28 font-medium text-lg pointer-events-none">{dayName}</span>
                          <div className="flex items-center gap-2 flex-1 justify-center pointer-events-none">
                            <WeatherIcon iconCode={item.weather[0].icon} size={24} />
                            {item.pop >= 0.2 && (
                              <span className="text-xs text-blue-100 font-bold bg-blue-500/40 px-1.5 py-0.5 rounded">
                                {Math.round(item.pop * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="w-28 flex justify-end items-center gap-3 pointer-events-none">
                            <span className="opacity-50 font-medium text-lg">{Math.round(item.main.temp_min)}°</span>
                             <div className="w-12 h-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <div className="h-full bg-gradient-to-r from-blue-300 to-yellow-200 w-[60%] rounded-full opacity-80"></div>
                             </div>
                            <span className="font-bold text-lg">{Math.round(item.main.temp_max)}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="opacity-60 text-sm">Previsioni non disponibili al momento.</p>
              </div>
            )}
            
            <div className="mt-8 mb-4 opacity-40 text-xs">
                {currentIndex > 0 ? (
                    <span>Scorri o usa il menu per altre città</span>
                ) : (
                    <span>Scorri per vedere i preferiti</span>
                )}
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;