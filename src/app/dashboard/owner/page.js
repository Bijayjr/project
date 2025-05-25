'use client';

import Swal from 'sweetalert2';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Image from 'next/image';

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

export default function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [newProperty, setNewProperty] = useState({
    title: '',
    location: '',
    price: '',
    amenities: [],
    images: [],
  });
  const [filesToUpload, setFilesToUpload] = useState([]);

  const router = useRouter();

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/user/me');
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await axios.get('/api/properties');
      setProperties(res.data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchProperties();
  }, [fetchUser, fetchProperties]);

  function handleAuthError(err) {
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      console.error(err);
    }
  }

  async function handleAddProperty() {
    try {
      const imageFiles = await Promise.all(
        filesToUpload.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
              name: file.name,
              type: file.type,
              data: e.target.result
            });
            reader.readAsDataURL(file);
          });
        })
      );

      const propertyData = {
        ...newProperty,
        price: parseFloat(newProperty.price),
        amenities: Array.isArray(newProperty.amenities) ? newProperty.amenities : [],
        images: imageFiles,
        availability: newProperty.availability || 'Available'
      };

      if (editingProperty) {
        await axios.put(`/api/properties/${editingProperty.id}`, propertyData);
      } else {
        await axios.post('/api/properties', propertyData);
      }

      await fetchProperties();
      resetPropertyForm();
      Swal.fire('Success', `Property ${editingProperty ? 'updated' : 'added'} successfully!`, 'success');
    } catch (err) {
      console.error('Failed to save property:', err);
      Swal.fire('Error', 'Failed to save property', 'error');
    }
  }

  function resetPropertyForm() {
    setShowAddProperty(false);
    setEditingProperty(null);
    setNewProperty({
      title: '',
      location: '',
      price: '',
      amenities: [],
      images: [],
    });
    setFilesToUpload([]);
    newProperty.images.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  function handleDeleteProperty(id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/api/properties/${id}`);
          setProperties(prev => prev.filter(p => p.id !== id));
          Swal.fire('Deleted!', 'Your property has been deleted.', 'success');
        } catch (err) {
          handleAuthError(err);
          Swal.fire('Error!', 'Something went wrong.', 'error');
        }
      }
    });
  }

  function handleEditProperty(property) {
    setEditingProperty(property);
    setNewProperty({ 
      title: property.title,
      location: property.location,
      price: property.price.toString(),
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      images: Array.isArray(property.images) ? property.images : [],
      availability: property.availability || 'Available'
    });
    setFilesToUpload([]);
    setShowAddProperty(true);
  }

  async function toggleAvailability(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    const newAvailability = property.availability === 'Available' ? 'Occupied' : 'Available';

    try {
      await axios.put(`/api/properties/${id}`, { 
        ...property, 
        availability: newAvailability 
      });
      await fetchProperties();
    } catch (err) {
      handleAuthError(err);
      Swal.fire('Error', 'Failed to toggle availability', 'error');
    }
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setNewProperty(prev => ({ 
      ...prev, 
      images: [...prev.images, ...urls] 
    }));
    setFilesToUpload(prev => [...prev, ...files]);
  }

  function deleteImage(index) {
    if (newProperty.images[index].startsWith('blob:')) {
      URL.revokeObjectURL(newProperty.images[index]);
    }
    
    setNewProperty(prev => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });

    setFilesToUpload(prev => {
      const updatedFiles = [...prev];
      updatedFiles.splice(index, 1);
      return updatedFiles;
    });
  }

  function handleAmenityChange(amenity) {
    setNewProperty(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  }

  async function logout() {
    try {
      await axios.post('/api/logout');
      setUser(null);
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
        <title>Rento - Property Owner Dashboard</title>
        <meta name="description" content="Manage your rental properties" />
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
                <Image 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  width={32}
                  height={32}
                  className="rounded-full object-cover border-2 border-emerald-400" 
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
            <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Welcome back, {user.name}</h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your rental properties and bookings</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="text-lg font-medium mb-1">Total Properties</h3>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="text-lg font-medium mb-1">Available</h3>
                <p className="text-2xl font-bold">
                  {properties.filter(p => p.availability === 'Available').length}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="text-lg font-medium mb-1">Occupied</h3>
                <p className="text-2xl font-bold">
                  {properties.filter(p => p.availability === 'Occupied').length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section id="properties" className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-emerald-400">Your Properties</h2>
            <button
              onClick={() => {
                resetPropertyForm();
                setShowAddProperty(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Property
            </button>
          </div>

          {properties.length === 0 ? (
            <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 className="mt-2 text-lg font-medium">No properties yet</h3>
              <p className="mt-1 text-gray-500">Add your first property to get started</p>
              <button
                onClick={() => setShowAddProperty(true)}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
              >
                Add Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      property.availability === 'Available' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.availability}
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
                    <div className="flex justify-between border-t pt-3">
                      <button
                        onClick={() => handleEditProperty(property)}
                        className={`text-sm px-3 py-1 rounded ${
                          darkMode
                            ? 'bg-emerald-800 hover:bg-emerald-700'
                            : 'bg-emerald-100 hover:bg-emerald-200'
                        } text-emerald-600 hover:text-emerald-700 transition-colors`}
                      >
                        Edit
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleAvailability(property.id)}
                          className={`text-sm px-3 py-1 rounded ${
                            darkMode
                              ? 'bg-yellow-800 hover:bg-yellow-700'
                              : 'bg-yellow-100 hover:bg-yellow-200'
                          } text-yellow-600 hover:text-yellow-700 transition-colors`}
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className={`text-sm px-3 py-1 rounded ${
                            darkMode 
                              ? 'bg-red-800 hover:bg-red-700' 
                              : 'bg-red-100 hover:bg-red-200'
                          } text-red-600 hover:text-red-700 transition-colors`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add/Edit Property Modal */}
        {showAddProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-emerald-400">
                    {editingProperty ? 'Edit Property' : 'Add New Property'}
                  </h2>
                  <button
                    onClick={resetPropertyForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newProperty.title || !newProperty.location || !newProperty.price) {
                    Swal.fire('Error', 'Please fill in all required fields', 'error');
                    return;
                  }
                  handleAddProperty();
                }} className="space-y-4">
                  {/* Form fields remain the same as before */}
                   <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title*</label>
                  <input
                    type="text"
                    placeholder="Property title"
                    value={newProperty.title}
                    onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-emerald-400 focus:border-transparent`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location*</label>
                  <input
                    type="text"
                    placeholder="Property location"
                    value={newProperty.location}
                    onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-emerald-400 focus:border-transparent`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price (Nu.)*</label>
                  <input
                    type="number"
                    placeholder="Monthly price"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-emerald-400 focus:border-transparent`}
                    required
                    min={0}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AMENITY_OPTIONS.map(amenity => (
                      <label key={amenity} className={`flex items-center space-x-2 p-2 rounded ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={newProperty.amenities.includes(amenity)}
                          onChange={() => handleAmenityChange(amenity)}
                          className={`rounded ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          } text-emerald-600 focus:ring-emerald-500`}
                        />
                        <span>{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Images</label>
                  <div className={`p-4 border-2 border-dashed rounded-lg ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="property-images"
                    />
                    <label
                      htmlFor="property-images"
                      className={`flex flex-col items-center justify-center cursor-pointer ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Click to upload images</p>
                      <p className="text-sm mt-1">(JPEG, PNG, etc.)</p>
                    </label>
                  </div>
                  
                  {newProperty.images.length > 0 && (
                    <div className="mt-4">
                      <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Selected Images ({newProperty.images.length})
                      </h4>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {newProperty.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={img}
                              alt={`Preview ${index + 1}`}
                              width={80}
                              height={80}
                              className="h-20 w-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => deleteImage(index)}
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                  {/* Other form fields... */}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetPropertyForm}
                      className={`px-4 py-2 rounded-md ${
                        darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {editingProperty ? 'Update Property' : 'Add Property'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
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