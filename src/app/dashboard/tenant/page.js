'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Swal from 'sweetalert2';

const AMENITY_OPTIONS = [
  'WiFi',
  'Parking',
  'Pool',
  'Kitchen',
  'Air Conditioning',
  'Heating',
  'Washer',
  'Dryer',
  'TV',
  'Workspace',
  'Gym',
  'Elevator',
  'Hot Tub',
  'Pet Friendly',
  'Smoke Alarm',
  'Carbon Monoxide Alarm'
];

export default function TenantDashboard() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    amenities: []
  });

  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      setUser(await res.json());
    } catch (err) {
      router.push('/login');
    }
  }, [router]);

  const fetchAvailableProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/properties/available');
      if (!res.ok) throw new Error('Failed to fetch properties');
      
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      Swal.fire('Error', 'Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...properties];

    // Filter by price range
    if (filters.minPrice) {
      result = result.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(p => p.price <= Number(filters.maxPrice));
    }

    // Filter by location
    if (filters.location) {
      result = result.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by amenities
    if (filters.amenities.length > 0) {
      result = result.filter(p => 
        filters.amenities.every(amenity => 
          p.amenities.includes(amenity)
        )
      );
    }

    setFilteredProperties(result);
  }, [properties, filters]);

  useEffect(() => {
    fetchUser();
    fetchAvailableProperties();
  }, [fetchUser, fetchAvailableProperties]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function handleAmenityFilter(amenity) {
    setFilters(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  }

  function handleContactOwner(property) {
    Swal.fire({
      title: 'Contact Property Owner',
      html: `
        <div class="text-left">
          <p><strong>Property:</strong> ${property.title}</p>
          <p><strong>Location:</strong> ${property.location}</p>
          <p><strong>Price:</strong> Nu.${property.price.toLocaleString()}/month</p>
          <p class="mt-4"><strong>Please contact the admin for viewing appointments</strong></p>
        </div>
      `,
      confirmButtonText: 'Close'
    });
  }

  async function logout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      Swal.fire('Error', 'Failed to logout', 'error');
    }
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Head>
        <title>Rento - Find Your Perfect Home</title>
        <meta name="description" content="Browse available rental properties" />
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
            <h1 className="text-2xl font-bold text-emerald-400">Rento</h1>
          </div>
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
            <div className="flex items-center space-x-2">
              {user.avatarUrl && (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="h-8 w-8 rounded-full object-cover border-2 border-emerald-400" 
                />
              )}
              <span className="font-medium">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-700 hover:text-emerald-600'} transition-colors`}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Welcome, {user.name}</h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Find your perfect rental property in Bhutan</p>
            
            {/* Search Filters */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <h3 className="text-lg font-medium mb-3">Filter Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Any location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Min Price (Nu.)</label>
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Minimum"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                    }`}
                    min="0"
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Price (Nu.)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Maximum"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                    }`}
                    min="0"
                  />
                </div>
                <div>
                  <button
                    onClick={fetchAvailableProperties}
                    className="w-full mt-6 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Refresh Properties
                  </button>
                </div>
              </div>
              
              {/* Amenities Filter */}
              <div className="mt-4">
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {AMENITY_OPTIONS.map(amenity => (
                    <label key={amenity} className={`flex items-center space-x-2 p-2 rounded ${
                      darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => handleAmenityFilter(amenity)}
                        className={`rounded ${
                          darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                        } text-emerald-600`}
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section id="properties" className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-emerald-400">
              Available Properties ({filteredProperties.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium">No properties found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={property.images[0] || '/placeholder.jpg'}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      Available
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-emerald-400 mb-1">{property.title}</h3>
                    <p className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {property.location}
                    </p>
                    <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-800'} font-medium mb-4`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Nu.{Number(property.price).toLocaleString()}/mo
                    </p>
                    
                    {/* Amenities chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.amenities?.slice(0, 4).map(amenity => (
                        <span 
                          key={amenity}
                          className={`px-2 py-1 text-xs rounded-full ${
                            darkMode ? 'bg-gray-700 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities?.length > 4 && (
                        <span 
                          className={`px-2 py-1 text-xs rounded-full ${
                            darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          +{property.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between border-t pt-3">
                      <button
                        onClick={() => handleContactOwner(property)}
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? 'bg-emerald-800 hover:bg-emerald-700'
                            : 'bg-emerald-100 hover:bg-emerald-200'
                        } text-emerald-600 hover:text-emerald-700 transition-colors`}
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: property.title,
                            html: `
                              <div class="text-left">
                                <img src="${property.images[0] || '/placeholder.jpg'}" alt="${property.title}" class="w-full h-48 object-cover mb-4 rounded-lg">
                                <p class="mb-2"><strong>Location:</strong> ${property.location}</p>
                                <p class="mb-2"><strong>Price:</strong> Nu.${Number(property.price).toLocaleString()}/month</p>
                                <p class="mb-2"><strong>Amenities:</strong> ${property.amenities?.join(', ') || 'None'}</p>
                              </div>
                            `,
                            confirmButtonText: 'Close',
                            width: '600px'
                          });
                        }}
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={`py-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors duration-300`}>
        <div className="container mx-auto px-4 text-center">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>© 2023 Rento. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}