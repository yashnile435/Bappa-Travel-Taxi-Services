import React, { useEffect, useState, useCallback } from 'react';
import './CarList.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaCar } from 'react-icons/fa';

function CarList() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const carsCol = collection(db, 'carlist');
      const snapshot = await getDocs(carsCol);
      const carList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCars(carList);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleBookNow = (carName) => {
    navigate('/book-car', { state: { selectedCar: carName } });
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="cars-grid">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="car-card skeleton">
          <div className="car-image-container">
            <div className="skeleton-image"></div>
          </div>
          <div className="car-details">
            <div className="skeleton-title"></div>
            <div className="skeleton-status"></div>
            <div className="skeleton-description"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="car-list" id="cars">
      <div className="car-list-header">
        <h2>Our Fleet</h2>
        <p>Choose from our wide range of vehicles</p>
      </div>
      
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchCars} className="retry-button">
            Try Again
          </button>
        </div>
      ) : cars.length === 0 ? (
        <div className="no-cars">No cars available at the moment.</div>
      ) : (
        <div className="cars-grid">
          {cars.map((car) => (
            <div key={car.id} className="car-card">
              <div className="car-image-container">
                <img 
                  src={car.imageBase64 ? car.imageBase64 : car.imageUrl} 
                  alt={car.name} 
                  className="car-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="car-image-placeholder" style={{ display: 'none' }}>
                  <FaCar />
                </div>
              </div>
              <div className="car-details">
                <h3>{car.name}</h3>
                <span style={{
                  background: car.status === 'available' ? '#e6f9e6' : '#ffeaea',
                  color: car.status === 'available' ? '#388e3c' : '#d32f2f',
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: '4px 14px',
                  fontSize: 15,
                  marginBottom: 8,
                  display: 'inline-block',
                }}>{car.status?.toUpperCase()}</span>
                {car.description && (
                  <div style={{ color: '#444', fontSize: 15, margin: '6px 0 8px 0' }}>{car.description}</div>
                )}
                <div style={{ margin: '8px 0', fontWeight: 500 }}>
                  <div style={{ marginTop: 4, color: '#555', fontSize: 15 }}>👥 {car.passengers} passengers</div>
                </div>
                <div className="car-actions">
                  {car.status === 'available' && (
                    <button 
                      className="book-now-button"
                      onClick={() => handleBookNow(car.name)}
                    >
                      <FaCar /> Book Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CarList; 