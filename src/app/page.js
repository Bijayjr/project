'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const MapWithNoSSR = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [bedrooms, setBedrooms] = useState(0);
  const [activeLocation, setActiveLocation] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedDzongkhag, setSelectedDzongkhag] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [centerOnUserLocation, setCenterOnUserLocation] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Reference for the house image
  const houseImageRef = useRef(null);

  // Price range options
  const priceRanges = [
    { label: 'Any Price', value: [0, 100000] },
    { label: 'Up to Nu.20,000', value: [0, 20000] },
    { label: 'Nu.20,000 - 30,000', value: [20000, 30000] },
    { label: 'Nu.30,000 - 40,000', value: [30000, 40000] },
    { label: 'Nu.40,000+', value: [40000, 100000] },
  ];

  // Dzongkhag coordinates
  const dzongkhagCoordinates = useMemo(() => ({
    'Thimphu': {
      coordinates: [27.4728, 89.6390],
      description: 'The capital city of Bhutan'
    },
    'Paro': {
      coordinates: [27.4333, 89.4167],
      description: 'Home to the international airport'
    },
    'Phuentsholing': {
      coordinates: [26.8516, 89.3883],
      description: 'The commercial hub of Bhutan'
    },
    'Punakha': {
      coordinates: [27.5917, 89.8633],
      description: 'The former capital of Bhutan'
    },
    'Bumthang': {
      coordinates: [27.5333, 90.7333],
      description: 'The spiritual heart of Bhutan'
    }
  }), []);

  // Calculate distance function
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get nearby properties
  const getNearbyProperties = (properties, userLocation) => {
    if (!userLocation || !Array.isArray(userLocation) || userLocation.length !== 2) {
      return properties;
    }

    return [...properties].sort((a, b) => {
      if (!a.coordinates || !b.coordinates) return 0;
      
      const distanceA = calculateDistance(
        userLocation[0],
        userLocation[1],
        a.coordinates[0],
        a.coordinates[1]
      );
      
      const distanceB = calculateDistance(
        userLocation[0],
        userLocation[1],
        b.coordinates[0],
        b.coordinates[1]
      );

      return distanceA - distanceB;
    });
  };

  // Mock properties data
  useEffect(() => {
    const mockProperties = [
      {
        id: 1,
        title: 'Thunder Dragon Haven',
        address: 'Rinchending, Phuentsholing',
        dzongkhag: 'Chhukha',
        price: 25000,
        bedrooms: 2,
        bathrooms: 1,
        image: '/house1.jpeg',
        coordinates: [26.8517, 89.3883],
        description: 'A modern apartment infused with Bhutanese charm in Phuentsholing.',
      },
      {
        id: 2,
        title: 'Paro Valley Retreat',
        address: 'Paro Valley, Paro',
        dzongkhag: 'Paro',
        price: 35000,
        bedrooms: 3,
        bathrooms: 2,
        image: '/house2.jpeg',
        coordinates: [27.4339, 89.4163],
        description: 'A serene retreat with traditional Bhutanese architecture.',
      },
      {
        id: 3,
        title: 'Punakha Serenity Villa',
        address: 'Lobesa, Punakha',
        dzongkhag: 'Punakha',
        price: 40000,
        bedrooms: 4,
        bathrooms: 3,
        image: '/house3.jpeg',
        coordinates: [27.6114, 89.8724],
        description: 'A luxurious villa with panoramic mountain views.',
      },
    ];
    setProperties(mockProperties);
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isFinite(latitude) && isFinite(longitude)) {
            setUserLocation([latitude, longitude]);
            setActiveLocation([latitude, longitude]);
            setIsLocationLoading(false);
          } else {
            setLocationError('Invalid coordinates received.');
            setUserLocation([27.4728, 89.6390]);
            setActiveLocation([27.4728, 89.6390]);
            setIsLocationLoading(false);
          }
        },
        (error) => {
          setLocationError(error.message);
          setUserLocation([27.4728, 89.6390]);
          setActiveLocation([27.4728, 89.6390]);
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported.');
      setUserLocation([27.4728, 89.6390]);
      setActiveLocation([27.4728, 89.6390]);
      setIsLocationLoading(false);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Update activeLocation
  useEffect(() => {
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    const matchedDzongkhag = Object.keys(dzongkhagCoordinates).find((dzongkhag) =>
      dzongkhag.toLowerCase().includes(lowerQuery)
    );

    if (matchedDzongkhag && dzongkhagCoordinates[matchedDzongkhag]?.coordinates) {
      setActiveLocation(dzongkhagCoordinates[matchedDzongkhag].coordinates);
      setCenterOnUserLocation(false);
    } else if (selectedDzongkhag && dzongkhagCoordinates[selectedDzongkhag]?.coordinates) {
      setActiveLocation(dzongkhagCoordinates[selectedDzongkhag].coordinates);
      setCenterOnUserLocation(false);
    }
  }, [debouncedSearchQuery, selectedDzongkhag]);

  // GSAP Animation for house image
  useEffect(() => {
    if (houseImageRef.current) {
      const houseImage = houseImageRef.current;
      const newSection = document.querySelector('.why-choose-us-section');

      if (newSection) {
        gsap.to(houseImage, {
          x: 300,
          y: 780,
          opacity: 1,
          zIndex: 2000, // Ensure it appears above the glassmorphism effect
          ease: 'power1.out',
          scrollTrigger: {
            trigger: newSection,
            start: 'top center',
            end: 'bottom center',
            scrub: true,
            markers: false,
            invalidateOnRefresh: true,
          },
        });
      }
    }
  }, [houseImageRef]);

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      property.dzongkhag.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
    const matchesBedrooms = bedrooms === 0 || property.bedrooms === bedrooms;
    const matchesDzongkhag = !selectedDzongkhag || property.dzongkhag === selectedDzongkhag;

    return matchesSearch && matchesPrice && matchesBedrooms && matchesDzongkhag;
  });

  // Get nearby properties
  const nearbyProperties = getNearbyProperties(filteredProperties, userLocation);

  const handlePropertyClick = useCallback((property) => {
    if (property?.coordinates) {
      setSelectedProperty(property);
      setActiveLocation(property.coordinates);
      setCenterOnUserLocation(false);
      setIsOverlayOpen(true);
    }
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      if (selectedProperty) setIsOverlayOpen(true);
    },
    onSwipedDown: () => {
      setIsOverlayOpen(false);
      setSelectedProperty(null);
    },
    trackMouse: true,
    delta: 50,
  });

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <Head>
        <title>Rento - Bhutanese Rental Platform</title>
        <meta name="description" content="Discover futuristic rental properties in Bhutan" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
      </Head>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className={`sticky top-0 z-30 backdrop-blur-md ${
          darkMode ? 'bg-gray-900/70' : 'bg-gray-50/70'
        } shadow-lg transition-colors duration-500`}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">Rento</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            {['Home', 'Properties', 'About', 'Contact'].map((item) => (
              <motion.a
                key={item}
                 href={`#${item.toLowerCase()}`}
                whileHover={{ scale: 1.05, color: '#34d399' }}
                className={`text-lg font-medium transition-colors ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {item}
              </motion.a>
            ))}
          </nav>
          <div className="flex items-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full ${
                darkMode ? 'bg-gray-800 text-emerald-400' : 'bg-gray-200 text-gray-700'
              } transition-colors`}
            >
              {darkMode ? (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </motion.button>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`px-5 py-2 text-lg ${
                  darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'
                } transition-colors`}
              >
                Log In
              </motion.button>
            </Link>
            <Link href="/registration">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section
        className={`py-20 ${darkMode ? 'bg-gray-800/90' : 'bg-emerald-600/90'} transition-colors duration-500 relative overflow-hidden`}
        style={{
          backgroundImage: darkMode
            ? "url('/Bhutanese Dragon and Temple Pattern.png')"
            : "url('/Dragons and Pagodas_ Bhutanese-Chinese Pattern (1).png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Discover Your Bhutanese Sanctuary
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            Experience the fusion of tradition and modernity in the Dragon Kingdom
          </p>

          {/* Search Bar */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`max-w-4xl mx-auto rounded-xl shadow-2xl p-2 backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/30' : 'bg-white/30'
            } border border-gray-500/20`}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by dzongkhag or property name..."
                className={`flex-grow p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-transparent ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <svg
                  className="h-6 w-6 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                Search
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/20 z-0" />
      </section>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-12">
        {/* Sticky Map */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="sticky top-0 z-10 h-[400px] rounded-xl shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/20" />
          <div className="relative p-6 border-b border-gray-700/20 flex justify-between items-center backdrop-blur-sm bg-gray-900/10">
            <h3 className="text-xl font-semibold flex items-center">
              <svg
                className="h-6 w-6 mr-2 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Properties near you
            </h3>
            {userLocation && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setActiveLocation(userLocation);
                  setCenterOnUserLocation(true);
                }}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                My Location
              </motion.button>
            )}
          </div>
          {isLocationLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-200/50">
              <p className="text-gray-600">Loading map...</p>
            </div>
          ) : (
            <MapWithNoSSR
              properties={filteredProperties}
              activeLocation={activeLocation}
              onMarkerClick={handlePropertyClick}
              darkMode={darkMode}
              userLocation={userLocation}
              centerOnUserLocation={centerOnUserLocation}
            />
          )}
          {locationError && (
            <div className="absolute bottom-0 w-full p-3 text-sm text-red-400 bg-red-500/10">
              Location error: {locationError} (Showing Thimphu by default)
            </div>
          )}
        </motion.section>

        {/* Filters and Gallery Overlay */}
        <div className="relative z-20 pt-8">
          {/* Filters Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`mb-8 p-6 rounded-xl backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/30' : 'bg-white/30'
            } shadow-xl border border-gray-500/20 transition-colors duration-500`}
          >
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-emerald-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-xl font-semibold">Refine Your Search</h3>
              </div>

              <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  className={`w-full sm:w-48 p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-100/50 text-gray-800'
                  } border-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm`}
                  value={priceRange.join(',')}
                  onChange={(e) => setPriceRange(e.target.value.split(',').map(Number))}
                >
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.value.join(',')}>
                      {range.label}
                    </option>
                  ))}
                </motion.select>

                <motion.select
                  whileHover={{ scale: 1.02 }}
                  className={`w-full sm:w-48 p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-100/50 text-gray-800'
                  } border-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm`}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                >
                  <option value={0}>Any Bedrooms</option>
                  {[1, 2, 3, 4].map((num) => (
                    <option key={num} value={num}>
                      {num}+
                    </option>
                  ))}
                </motion.select>

                <motion.select
                  whileHover={{ scale: 1.02 }}
                  className={`w-full sm:w-48 p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-100/50 text-gray-800'
                  } border-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm`}
                  value={selectedDzongkhag}
                  onChange={(e) => {
                    setSelectedDzongkhag(e.target.value);
                    if (e.target.value && dzongkhagCoordinates[e.target.value]) {
                      setActiveLocation(dzongkhagCoordinates[e.target.value].coordinates);
                      setCenterOnUserLocation(false);
                    }
                  }}
                >
                  <option value="">All Dzongkhags</option>
                  <option value="Thimphu">Thimphu</option>
                  <option value="Paro">Paro</option>
                  <option value="Punakha">Punakha</option>
                  <option value="Bumthang">Bumthang</option>
                  <option value="Haa">Haa</option>
                  <option value="Wangdue">Wangdue Phodrang</option>
                </motion.select>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                  }`}
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                    setPriceRange([0, 100000]);
                    setBedrooms(0);
                    setSelectedDzongkhag('');
                    setActiveLocation(userLocation || [27.4728, 89.6390]);
                    setCenterOnUserLocation(!!userLocation);
                  }}
                >
                  Clear Filters
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* Gallery Overlay */}
          <motion.section
            id='properties'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`p-6 rounded-xl backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/30' : 'bg-white/30'
            } shadow-xl border border-gray-500/20 transition-colors duration-500 mb-12`}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <svg
                className="h-6 w-6 mr-2 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6zm3 3h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2z"
                  clipRule="evenodd"
                />
              </svg>
              {userLocation ? 'Properties Sorted by Distance' : 'Available Properties'}
            </h3>
            <AnimatePresence>
              {nearbyProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyProperties.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg cursor-pointer backdrop-blur-sm ${
                        darkMode ? 'bg-gray-700/30 text-gray-200' : 'bg-gray-100/30 text-gray-800'
                      } border border-gray-500/20 hover:shadow-2xl transition-all duration-300`}
                      onClick={() => handlePropertyClick(property)}
                    >
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-52 object-cover rounded-lg mb-4"
                      />
                      <h4 className="text-lg font-semibold">{property.title}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {property.address}, {property.dzongkhag}
                      </p>
                      <p className="text-emerald-400 font-medium mt-2">
                        Nu.{property.price.toLocaleString()}/mo
                      </p>
                      {userLocation && (
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {calculateDistance(
                            userLocation[0],
                            userLocation[1],
                            property.coordinates[0],
                            property.coordinates[1]
                          ).toFixed(1)} km away
                        </p>
                      )}
                      <div className="flex space-x-4 mt-3">
                        <span className="flex items-center text-sm">
                          <svg
                            className="h-5 w-5 mr-1 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          {property.bedrooms} Beds
                        </span>
                        <span className="flex items-center text-sm">
                          <svg
                            className="h-5 w-5 mr-1 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {property.bathrooms} Baths
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  No properties found matching your criteria.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>

          {/* About Us Section */}
          <motion.section
            id="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`p-6 rounded-xl backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/30' : 'bg-white/30'
            } shadow-xl border border-gray-500/20 transition-colors duration-500 mb-12 about-us-section`}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <svg
                className="h-6 w-6 mr-2 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              About Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image
                  ref={houseImageRef}
                  src="/house.png"
                  alt="Living in Harmony in Bhutan"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg"
                  style={{ position: 'relative', zIndex: 1000000 }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h4 className="text-lg font-semibold mb-4 text-emerald-400">
                  The Essence of Bhutan
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nestled in the heart of the Himalayas, Bhutan beckons with its serene valleys and sacred monasteries. Druk Yul, the Land of the Thunder Dragon, offers a harmonious blend of tradition and innovation. From the vibrant festivals of Thimphu to the tranquil retreats of Paro, each dzongkhag tells a story of Gross National Happiness. Explore properties that embody Bhutanese craftsmanship, where wooden beams and prayer flags coexist with modern comforts. Let Rento guide you to a home that resonates with the spirit of the Dragon Kingdom.
                </p>
                <h4 className="text-lg font-semibold mt-6 mb-4 text-emerald-400">
                  Living in Harmony
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  In Bhutan, life unfolds in rhythm with nature and spirituality. From the prayer wheels spinning in Punakha to the ancient dzongs of Bumthang, every corner of the kingdom invites serenity. Rento connects you to homes that reflect this balance, offering spaces where modern amenities meet the timeless beauty of Bhutanese culture. Discover a lifestyle rooted in peace and purpose.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Why Choose Us Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`p-6 rounded-xl backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/30' : 'bg-white/30'
            } shadow-xl border border-gray-500/20 transition-colors duration-500 mb-12 why-choose-us-section`}
            style={{ height: '100vh' }}
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center justify-center">
              <svg
                className="h-6 w-6 mr-2 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Why Choose Us
            </h3>
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[80%]">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`p-4 max-w-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <h4 className="text-lg font-semibold mb-2 text-emerald-400">Curated Properties</h4>
                <p className="text-sm">
                  Rento offers a handpicked selection of properties that blend Bhutanese tradition with modern luxury. Each home is carefully vetted to ensure it meets our high standards of comfort and cultural authenticity.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className={`p-4 max-w-sm text-right ml-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <h4 className="text-lg font-semibold mb-2 text-emerald-400">Local Expertise</h4>
                <p className="text-sm">
                  Our team, rooted in Bhutan, provides unparalleled knowledge of local dzongkhags, ensuring you find a home that perfectly matches your lifestyle and preferences in the Land of the Thunder Dragon.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`p-4 max-w-sm self-end ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <h4 className="text-lg font-semibold mb-2 text-emerald-400">Seamless Experience</h4>
                <p className="text-sm">
                  From property discovery to booking, Rento streamlines the rental process with a user-friendly platform, making it easy to find and secure your ideal home in Bhutan.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className={`p-4 max-w-sm self-end text-right ml-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <h4 className="text-lg font-semibold mb-2 text-emerald-400">Cultural Immersion</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Live like a local with Rento&apos;s homes, designed to immerse you in Bhutan&apos;s vibrant culture, from proximity to sacred sites to interiors reflecting traditional craftsmanship.
                </p>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Swipeable Overlay */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isOverlayOpen ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl backdrop-blur-lg ${
              darkMode ? 'bg-gray-800/40' : 'bg-white/40'
            } border-t border-gray-500/30 shadow-2xl`}
            {...swipeHandlers}
          >
            <div className="relative p-8">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-500/50 rounded-full" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-500/50 text-white hover:bg-gray-600/50"
                onClick={() => {
                  setIsOverlayOpen(false);
                  setSelectedProperty(null);
                }}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              <div className="relative">
                <Image
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  width={800}
                  height={400}
                  className="w-full h-72 object-cover rounded-xl"
                />
                <div className="absolute bottom-4 left-4 bg-emerald-600/80 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Nu.{selectedProperty.price.toLocaleString()}/mo
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold">{selectedProperty.title}</h3>
                <p className={`flex items-center mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <svg
                    className="h-5 w-5 mr-2 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {selectedProperty.address}
                </p>

                <div className="flex space-x-6 mt-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bedrooms</p>
                      <p className="font-medium">{selectedProperty.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bathrooms</p>
                      <p className="font-medium">{selectedProperty.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
  <svg
    className="h-5 w-5 text-emerald-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
    />
  </svg>
</div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Size</p>
                      <p className="font-medium">1,200 sqft</p>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold mt-6 mb-3">Description</h4>
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedProperty.description}
                </p>

                <h4 className="text-lg font-semibold mb-3">Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {['WiFi', 'Parking', 'Heating', 'Kitchen', 'Bhutanese Design', 'Mountain Views', 'Garden', 'Security'].map(
                    (amenity) => (
                      <div key={amenity} className="flex items-center">
                        <svg
                          className="h-5 w-5 text-emerald-400 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{amenity}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact Owner
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 border border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-600/10 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Schedule Viewing
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`py-16 ${darkMode ? 'bg-gray-800/90' : 'bg-gray-100/90'} transition-colors duration-500 mt-12`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-emerald-400">Rento</h4>
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your gateway to futuristic living in the Land of the Thunder Dragon.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                Explore Bhutan
              </h5>
              <ul className="space-y-3">
                {['Thimphu', 'Paro', 'Punakha', 'Bumthang', 'Phuentsholing'].map((item) => (
                  <li key={item}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 5, color: '#34d399' }}
                      className={`hover:text-emerald-400 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                Company
              </h5>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                  <li key={item}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 5, color: '#34d399' }}
                      className={`hover:text-emerald-400 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                Contact
              </h5>
              <ul className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-emerald-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Rinchending, Phuentsholing, Chhukha, Bhutan
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-emerald-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  info@rento.com
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-emerald-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  +975 17413091
                </li>
              </ul>
            </motion.div>
          </div>
          <div
            className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} mt-12 pt-8 text-center ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <p>© 2025 Rento. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}