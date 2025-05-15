'use client';

import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [newProperty, setNewProperty] = useState({
    title: '',
    location: '',
    price: '',
    amenities: [],
    images: [],
    availability: 'Available',
  });

  const router = useRouter();

  // Configure axios defaults once
  axios.defaults.withCredentials = true; // Send cookies with every request

  useEffect(() => {
    fetchUser();
    fetchProperties();
  }, []);

  // Centralized error handling for 401
  function handleAuthError(err) {
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      console.error(err);
    }
  }

  async function fetchUser() {
    try {
      const res = await axios.get('/api/user/me');
      setUser(res.data);
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function fetchProperties() {
    try {
      const res = await axios.get('/api/properties');
      setProperties(res.data);
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function handleAddProperty() {
    try {
      if (editingProperty) {
        await axios.put(`/api/properties/${editingProperty.id}`, newProperty);
      } else {
        await axios.post('/api/properties', newProperty);
      }
      await fetchProperties();
      resetPropertyForm();
    } catch (err) {
      handleAuthError(err);
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
      availability: 'Available',
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
          setProperties((prev) => prev.filter((p) => p.id !== id));
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
    setNewProperty({ ...property });
    setShowAddProperty(true);
  }

  async function toggleAvailability(id) {
    const property = properties.find((p) => p.id === id);
    if (!property) return;

    const newAvailability = property.availability === 'Available' ? 'Occupied' : 'Available';

    try {
      await axios.put(`/api/properties/${id}`, { ...property, availability: newAvailability });
      await fetchProperties();
    } catch (err) {
      handleAuthError(err);
      Swal.fire('Error', 'Failed to toggle availability', 'error');
    }
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    // Create object URLs for preview; in real apps upload to server or cloud storage
    const urls = files.map((file) => URL.createObjectURL(file));
    setNewProperty((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  }

  function deleteImage(index) {
    setNewProperty((prev) => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
  }

  async function logout() {
    try {
      const response = await axios.post('/api/logout');
      if (response.status === 200) {
        // Delay to ensure cookie is cleared before redirect
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to logout', 'error');
    }
  }

  if (!user) return null;

  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
      <header className="p-4 flex justify-between items-center bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">Welcome, {user.name}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white text-emerald-600 px-3 py-1 rounded-md"
            aria-label="Toggle dark mode"
          >
            Toggle Theme
          </button>
          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded-md hover:bg-red-600"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Profile</h2>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full mt-2 object-cover" />
            )}
          </div>
        </section>

        {/* Properties Section */}
        <section id="properties" className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-emerald-400">Your Properties</h2>
            <button
              onClick={() => {
                resetPropertyForm();
                setShowAddProperty(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Add Property
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className={`rounded-xl overflow-hidden shadow-sm ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } transition-colors duration-300`}
              >
                <img
                  src={property.images[0] || '/placeholder.jpg'}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-emerald-400">{property.title}</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {property.location}
                  </p>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nu.{Number(property.price).toLocaleString()}/mo
                  </p>
                  <p
                    className={`mt-2 ${
                      property.availability === 'Available' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {property.availability}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleEditProperty(property)}
                      className={`text-sm ${
                        darkMode
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-emerald-600 hover:text-emerald-500'
                      } hover:underline`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(property.id)}
                      className={`text-sm ${
                        darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'
                      } hover:underline`}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toggleAvailability(property.id)}
                      className={`text-sm ${
                        darkMode
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-yellow-600 hover:text-yellow-500'
                      } hover:underline`}
                    >
                      Toggle Availability
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add/Edit Property Form */}
        {showAddProperty && (
          <section className="mt-8 p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddProperty();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Title"
                value={newProperty.title}
                onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={newProperty.location}
                onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newProperty.price}
                onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                min={0}
              />
              <textarea
                placeholder="Amenities (comma separated)"
                value={newProperty.amenities.join(', ')}
                onChange={(e) =>
                  setNewProperty({
                    ...newProperty,
                    amenities: e.target.value.split(',').map((a) => a.trim()),
                  })
                }
                className="w-full px-3 py-2 border rounded"
              />

              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full"
                />
              </label>
              <div className="flex space-x-2 mt-2 overflow-x-auto">
                {newProperty.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Property image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => deleteImage(index)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1 hover:bg-red-700"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <select
                value={newProperty.availability}
                onChange={(e) => setNewProperty({ ...newProperty, availability: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                >
                  {editingProperty ? 'Update Property' : 'Add Property'}
                </button>
                <button
                  type="button"
                  onClick={resetPropertyForm}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
