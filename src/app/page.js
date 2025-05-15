"use client"
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(
  () => import('./components/Map'),
  { ssr: false }
);

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

  // Price range options for dropdown
  const priceRanges = [
    { label: 'Any Price', value: [0, 100000] },
    { label: 'Up to Nu.20,000', value: [0, 20000] },
    { label: 'Nu.20,000 - 30,000', value: [20000, 30000] },
    { label: 'Nu.30,000 - 40,000', value: [30000, 40000] },
    { label: 'Nu.40,000+', value: [40000, 100000] },
  ];

  // Dzongkhag coordinates for map zooming
  const dzongkhagCoordinates = {
    Thimphu: { coordinates: [27.4728, 89.6390], zoom: 12 },
    Paro: { coordinates: [27.4339, 89.4163], zoom: 12 },
    Punakha: { coordinates: [27.6114, 89.8724], zoom: 12 },
    Haa: { coordinates: [27.3686, 89.2908], zoom: 12 },
    Bumthang: { coordinates: [27.6420, 90.6770], zoom: 12 },
    Wangdue: { coordinates: [27.4870, 89.8990], zoom: 12 },
  };

  // Bhutan-specific property data
  useEffect(() => {
    const bhutanProperties = [
      {
        id: 1,
        title: 'Traditional Thimphu Townhouse',
        price: 35000,
        bedrooms: 3,
        bathrooms: 2,
        address: 'Norzin Lam, Thimphu, Bhutan',
        coordinates: [27.4728, 89.6390],
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600',
        description: 'Beautiful traditional townhouse in the heart of Thimphu with mountain views.',
        dzongkhag: 'Thimphu'
      },
      {
        id: 2,
        title: 'Modern Paro Apartment',
        price: 28000,
        bedrooms: 2,
        bathrooms: 1,
        address: 'Main Street, Paro, Bhutan',
        coordinates: [27.4339, 89.4163],
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
        description: 'Newly constructed apartment with modern amenities in peaceful Paro.',
        dzongkhag: 'Paro'
      },
      {
        id: 3,
        title: 'Punakha Valley Cottage',
        price: 45000,
        bedrooms: 4,
        bathrooms: 2,
        address: 'Punakha Valley, Bhutan',
        coordinates: [27.6114, 89.8724],
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
        description: 'Spacious cottage with stunning views of Punakha Valley and river.',
        dzongkhag: 'Punakha'
      },
      {
        id: 4,
        title: 'Bhutanese Farmhouse Stay',
        price: 18000,
        bedrooms: 2,
        bathrooms: 1,
        address: 'Haa Valley, Bhutan',
        coordinates: [27.3686, 89.2908],
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
        description: 'Authentic Bhutanese farmhouse experience in scenic Haa Valley.',
        dzongkhag: 'Haa'
      },
    ];
    setProperties(bhutanProperties);
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
            console.log('Geolocation Success:', { latitude, longitude });
          } else {
            setLocationError('Invalid coordinates received.');
            setUserLocation([27.4728, 89.6390]); // Fallback to Thimphu
            setActiveLocation([27.4728, 89.6390]);
            setIsLocationLoading(false);
            console.warn('Geolocation Invalid Coordinates:', { latitude, longitude });
          }
        },
        (error) => {
          setLocationError(error.message);
          setUserLocation([27.4728, 89.6390]); // Fallback to Thimphu
          setActiveLocation([27.4728, 89.6390]);
          setIsLocationLoading(false);
          console.error('Geolocation Error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setUserLocation([27.4728, 89.6390]); // Fallback to Thimphu
      setActiveLocation([27.4728, 89.6390]);
      setIsLocationLoading(false);
      console.error('Geolocation Not Supported');
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Update activeLocation when search query or dzongkhag selection changes
  useEffect(() => {
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    const matchedDzongkhag = Object.keys(dzongkhagCoordinates).find(dzongkhag =>
      dzongkhag.toLowerCase().includes(lowerQuery)
    );

    if (matchedDzongkhag && dzongkhagCoordinates[matchedDzongkhag]?.coordinates) {
      setActiveLocation(dzongkhagCoordinates[matchedDzongkhag].coordinates);
      setCenterOnUserLocation(false); // Reset for searches
    } else if (selectedDzongkhag && dzongkhagCoordinates[selectedDzongkhag]?.coordinates) {
      setActiveLocation(dzongkhagCoordinates[selectedDzongkhag].coordinates);
      setCenterOnUserLocation(false); // Reset for dropdown
    }
  }, [debouncedSearchQuery, selectedDzongkhag]);

  // Filter properties based on search criteria
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         property.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         property.dzongkhag.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
    const matchesBedrooms = bedrooms === 0 || property.bedrooms === bedrooms;
    const matchesDzongkhag = !selectedDzongkhag || property.dzongkhag === selectedDzongkhag;

    return matchesSearch && matchesPrice && matchesBedrooms && matchesDzongkhag;
  });

  const handlePropertyClick = useCallback((property) => {
    if (property?.coordinates) {
      setSelectedProperty(property);
      setActiveLocation(property.coordinates);
      setCenterOnUserLocation(false); // Reset for property clicks
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Head>
        <title>DrukStay - Bhutan Rental Platform</title>
        <meta name="description" content="Find rental properties in Bhutan" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
      </Head>

      {/* Header */}
      <header className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-emerald-400">DrukStay</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className={`hover:text-emerald-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Home</a>
            <a href="#" className={`hover:text-emerald-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Properties</a>
            <a href="#" className={`hover:text-emerald-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>About</a>
            <a href="#" className={`hover:text-emerald-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-emerald-400' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <Link href="/login">
  <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'} transition-colors`}>
    Log In
  </button>
</Link>

<Link href="/registration"> <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">Sign Up</button> </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`py-16 ${darkMode ? 'bg-gray-800 text-white' : 'bg-emerald-600 text-green-800'} transition-colors duration-300 h-100`}
        style={{
          backgroundImage: darkMode
            ? "url('/Bhutanese%20Dragon%20and%20Temple%20Pattern.png')"
            : "url('/Dragons and Pagodas_ Bhutanese-Chinese Pattern (1).png')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Perfect Home in Bhutan</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">Traditional and modern living spaces across the Dragon Kingdom</p>

          {/* Search Bar */}
          <div className={`max-w-3xl mx-auto rounded-lg shadow-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search by dzongkhag or property name..."
                className={`flex-grow p-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'text-gray-800'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className={`mb-6 p-4 rounded-lg shadow-sm transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold">Filters</h3>
            </div>

            <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <select
                  className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} border-none focus:ring-2 focus:ring-emerald-500`}
                  value={priceRange.join(',')}
                  onChange={(e) => setPriceRange(e.target.value.split(',').map(Number))}
                >
                  {priceRanges.map(range => (
                    <option key={range.label} value={range.value.join(',')}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <select
                  className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} border-none focus:ring-2 focus:ring-emerald-500`}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                >
                  <option value={0}>Any Bedrooms</option>
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>{num}+</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <select
                  className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} border-none focus:ring-2 focus:ring-emerald-500`}
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
                </select>
              </div>

              <button
                className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
              </button>
            </div>
          </div>
        </div>

        {/* Map and Property List */}
        <div className="flex flex-col gap-8">
          {/* Map */}
          <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300 h-100`}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Bhutan Property Map
              </h3>
              {userLocation && (
                <button
                  onClick={() => {
                    console.log('My Location Clicked:', { userLocation });
                    setActiveLocation(userLocation);
                    setCenterOnUserLocation(true);
                  }}
                  className="text-sm text-emerald-500 hover:text-emerald-400 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  My Location
                </button>
              )}
            </div>
            {isLocationLoading ? (
              <div className="h-[500px] flex items-center justify-center bg-gray-200">
                <p className="text-gray-600">Loading map...</p>
              </div>
            ) : (
              <MapWithNoSSR
                properties={filteredProperties || []}
                activeLocation={activeLocation}
                onMarkerClick={handlePropertyClick}
                darkMode={darkMode}
                userLocation={userLocation}
                centerOnUserLocation={centerOnUserLocation}
              />
            )}
            {locationError && (
              <div className="p-2 text-sm text-red-500 bg-red-50">
                Location error: {locationError} (Showing Thimphu by default)
              </div>
            )}
          </div>

          {/* Property List */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001 1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Available Properties in Bhutan
            </h3>

            {filteredProperties.length === 0 ? (
              <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-lg font-medium mb-2">No properties found</h4>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map(property => (
                  <div
                    key={property.id}
                    className={`rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${selectedProperty?.id === property.id ? 'ring-2 ring-emerald-500' : ''} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="relative">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <span className="text-white font-bold text-lg">Nu.{property.price.toLocaleString()}<span className="text-sm font-normal">/mo</span></span>
                      </div>
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                        {property.bedrooms} bed
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-lg font-semibold mb-1">{property.title}</h4>
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {property.address}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {property.bedrooms} beds
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {property.bathrooms} baths
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm z-1000000">
          <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative">
              <img
                src={selectedProperty.image}
                alt={selectedProperty.title}
                className="w-full h-64 md:h-80 object-cover rounded-t-xl"
              />
              <button
                className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 text-gray-800"
                onClick={() => setSelectedProperty(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm">
                Nu.{selectedProperty.price.toLocaleString()}/mo
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProperty.title}</h3>
                  <p className={`flex items-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedProperty.address}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex space-x-6 mb-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bedrooms</p>
                    <p className="font-medium">{selectedProperty.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bathrooms</p>
                    <p className="font-medium">{selectedProperty.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Size</p>
                    <p className="font-medium">1,200 sqft</p>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold mb-2">Description</h4>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedProperty.description}</p>

              <h4 className="text-lg font-semibold mb-2">Amenities</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {['WiFi', 'Parking', 'Heating', 'Kitchen', 'Traditional Bhutanese Design', 'Mountain Views', 'Garden', 'Security'].map(amenity => (
                  <div key={amenity} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{amenity}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Owner
                </button>
                <button className="flex-1 border border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Viewing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors duration-300`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
                <h4 className="text-xl font-bold text-emerald-400">DrukStay</h4>
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Find your perfect home in the Land of the Thunder Dragon.</p>
            </div>
            <div>
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>Explore Bhutan</h5>
              <ul className="space-y-2">
                {['Thimphu', 'Paro', 'Punakha', 'Bumthang', 'Phuentsholing'].map(item => (
                  <li key={item}>
                    <a href="#" className={`hover:text-emerald-500 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>Company</h5>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Blog', 'Press'].map(item => (
                  <li key={item}>
                    <a href="#" className={`hover:text-emerald-500 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>Contact</h5>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Norzin Lam, Thimphu, Bhutan
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  info@drukstay.com
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  +975 17 123 456
                </li>
              </ul>
            </div>
          </div>
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-8 pt-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>© 2023 DrukStay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}