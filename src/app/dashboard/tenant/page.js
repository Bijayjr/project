"use client"
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
  const [newProperty, setNewProperty] = useState({ title: '', location: '', price: '', amenities: [], images: [], availability: 'Available' });

  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchProperties();
  }, []);

  async function fetchUser() {
    try {
      const res = await axios.get('/api/user/me');
      setUser(res.data);
    } catch (err) {
      router.push('/login');
    }
  }

  async function fetchProperties() {
    try {
      const res = await axios.get('/api/properties');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddProperty() {
    try {
      if (editingProperty) {
        await axios.put(`/api/properties/${editingProperty.id}`, newProperty);
      } else {
        await axios.post('/api/properties', newProperty);
      }
      fetchProperties();
      setShowAddProperty(false);
      setNewProperty({ title: '', location: '', price: '', amenities: [], images: [], availability: 'Available' });
    } catch (err) {
      console.error(err);
    }
  }

  function handleDeleteProperty(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      axios.delete(`/api/properties/${id}`)
        .then(() => {
          setProperties(properties.filter((p) => p.id !== id));
          Swal.fire('Deleted!', 'Your property has been deleted.', 'success');
        })
        .catch((error) => {
          Swal.fire('Error!', 'Something went wrong.', 'error');
        });
    }
  });
}

  function handleEditProperty(property) {
    setEditingProperty(property);
    setNewProperty({ ...property });
    setShowAddProperty(true);
  }

  async function toggleAvailability(id) {
    const updated = properties.find((p) => p.id === id);
    updated.availability = updated.availability === 'Available' ? 'Occupied' : 'Available';
    await axios.put(`/api/properties/${id}`, updated);
    fetchProperties();
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setNewProperty({ ...newProperty, images: [...newProperty.images, ...urls] });
  }

  function moveImage(fromIndex, toIndex) {
    const images = [...newProperty.images];
    const [moved] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, moved);
    setNewProperty({ ...newProperty, images });
  }

  function deleteImage(index) {
    const images = [...newProperty.images];
    images.splice(index, 1);
    setNewProperty({ ...newProperty, images });
  }

  async function logout() {
    try {
      const response = await axios.post('/api/logout');
      if (response.status === 200) {
        // Add a small delay to ensure cookie is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      Swal.fire('Error', 'Failed to logout', 'error');
    }
  }

  if (!user) return null;

  return (
    <div className={darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}>
      <header className="p-4 flex justify-between items-center bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">Welcome, {user.name}</h1>
        <div className="flex space-x-2">
          <button onClick={() => setDarkMode(!darkMode)} className="bg-white text-emerald-600 px-3 py-1 rounded-md">Toggle Theme</button>
          <button onClick={logout} className="bg-red-500 px-3 py-1 rounded-md hover:bg-red-600">Logout</button>
        </div>
      </header>

      <main className="p-6">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Profile</h2>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}> 
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.avatarUrl && <img src={user.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full mt-2" />}
          </div>
        </section>

        {/* Properties section - already provided */}
        {/* Paste your provided JSX block here */}
        {/* Properties Section */}
            <section id="properties" className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-emerald-400">Your Properties</h2>
                <button
                  onClick={() => {
                    setShowAddProperty(true);
                    setEditingProperty(null);
                    setNewProperty({ title: '', location: '', price: '', amenities: [], images: [], availability: 'Available' });
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
                    className={`rounded-xl overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}
                  >
                    <img
                      src={property.images[0] || '/placeholder.jpg'}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-emerald-400">{property.title}</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{property.location}</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Nu.{property.price.toLocaleString()}/mo
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
                          className={`text-sm ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'} hover:underline`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className={`text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'} hover:underline`}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleAvailability(property.id)}
                          className={`text-sm ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'} hover:underline`}
                        >
                          Toggle {property.availability === 'Available' ? 'Occupied' : 'Available'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Property Modal */}
              {showAddProperty && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div
      className={`rounded-xl max-w-lg w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[80vh] overflow-y-auto`}
    >
      <h3 className="text-xl font-semibold text-emerald-400 mb-4">
        {editingProperty ? 'Edit Property' : 'Add Property'}
      </h3>
      <form onSubmit={(e) => { e.preventDefault(); handleAddProperty(); }}>
        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Title
          </label>
          <input
            type="text"
            value={newProperty.title}
            onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
            className={`mt-1 w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Location
          </label>
          <input
            type="text"
            value={newProperty.location}
            onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
            className={`mt-1 w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Price (Nu./mo)
          </label>
          <input
            type="number"
            value={newProperty.price}
            onChange={(e) => setNewProperty({ ...newProperty, price: Number(e.target.value) })}
            className={`mt-1 w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Amenities
          </label>
          <input
            type="text"
            value={newProperty.amenities.join(', ')}
            onChange={(e) => setNewProperty({ ...newProperty, amenities: e.target.value.split(',').map((a) => a.trim()) })}
            className={`mt-1 w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            placeholder="WiFi, Parking, etc."
          />
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className={`mt-1 w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {newProperty.images.map((image, index) => (
              <div key={index} className="relative w-24 h-24 rounded overflow-hidden shadow-md">
                <img
                  src={image}
                  alt={`Property Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => deleteImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition"
                  title="Delete Image"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowAddProperty(false)}
            className={`px-4 py-2 rounded-md ${darkMode ? 'text-gray-300 hover:text-gray-400' : 'text-gray-700 hover:text-gray-800'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
          >
            {editingProperty ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

            </section>
      </main>
    </div>
  );
}
