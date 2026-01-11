import React, { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './ManageCars.css';

const ManageCars = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        imageUrl: '',
        status: 'available',
        passengers: '',
        description: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imageBase64, setImageBase64] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
		const [isSavingEdit, setIsSavingEdit] = useState(false);
		const [isAddingCar, setIsAddingCar] = useState(false);
		const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchCars = async () => {
            const carsCol = collection(db, 'carlist');
            const snapshot = await getDocs(carsCol);
            setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchCars();
    }, []);

	// Prevent body scroll when any modal is open
	useEffect(() => {
		const hasOpenModal = showAddForm || showEditModal;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = hasOpenModal ? 'hidden' : originalOverflow || '';
		return () => {
			document.body.style.overflow = originalOverflow || '';
		};
	}, [showAddForm, showEditModal]);

    const handleFormChange = e => {
        const { name, value, files } = e.target;
        if (name === 'imageFile') {
            setImageFile(files[0]);
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result);
            };
            if (files[0]) {
                reader.readAsDataURL(files[0]);
            } else {
                setImageBase64('');
            }
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };
    const handleEditFormChange = e => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

	const handleAddCar = async e => {
        e.preventDefault();
		if (!form.name || !imageBase64 || !form.passengers || !form.description) return alert('All fields required (including image)');
		setIsAddingCar(true);
		try {
			const newCar = { ...form, imageBase64, passengers: parseInt(form.passengers), description: form.description };
			const docRef = await addDoc(collection(db, 'carlist'), newCar);
			setCars([...cars, { ...newCar, id: docRef.id }]);
			setForm({ name: '', imageUrl: '', status: 'available', passengers: '', description: '' });
			setImageFile(null);
			setImageBase64('');
			setShowAddForm(false);
		} finally {
			setIsAddingCar(false);
		}
    };

    const handleEdit = car => {
        setEditingId(car.id);
        setEditForm({ ...car });
        setShowEditModal(true);
    };
	const handleSaveEdit = async id => {
		const { name, description, passengers, status } = editForm || {};
		setIsSavingEdit(true);
		try {
			await updateDoc(doc(db, 'carlist', id), {
				name,
				description,
				passengers: parseInt(passengers),
				status,
			});
			setCars(cars.map(car => car.id === id ? { ...car, name, description, passengers: parseInt(passengers), status } : car));
			setEditingId(null);
			setShowEditModal(false);
		} finally {
			setIsSavingEdit(false);
		}
	};
    const handleStatusToggle = async (id, status) => {
        await updateDoc(doc(db, 'carlist', id), { status });
        setCars(cars.map(car => car.id === id ? { ...car, status } : car));
    };

    return (
        <div>
            <AdminNavbar />
            <div className="manage-cars-container">
                <div className="manage-cars-header">
                    <h1 className="manage-cars-title">Manage Cars</h1>
                    {!showAddForm && (
                        <button 
                            type="button" 
                            onClick={() => setShowAddForm(true)} 
                            className="add-car-button"
                        >
                            + Add New Car
                        </button>
                    )}
                </div>
                
                {showAddForm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button 
                                className="modal-close" 
                                onClick={() => { 
                                    setShowAddForm(false); 
                                    setForm({ name: '', imageUrl: '', status: 'available', passengers: '', description: '' }); 
                                    setImageFile(null); 
                                    setImageBase64(''); 
                                }}
                            >
                                ×
                            </button>
                            <h2 className="modal-title">Add New Car</h2>
                            <form onSubmit={handleAddCar}>
                                <div className="form-group">
                                    <label className="form-label">Car Name</label>
                                    <input 
                                        name="name" 
                                        value={form.name} 
                                        onChange={handleFormChange} 
                                        placeholder="Car Name" 
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        name="description" 
                                        value={form.description} 
                                        onChange={handleFormChange} 
                                        placeholder="Description" 
                                        className="form-textarea"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Passengers</label>
                                    <input 
                                        name="passengers" 
                                        value={form.passengers} 
                                        onChange={handleFormChange} 
                                        placeholder="Number of Passengers" 
                                        type="number" 
                                        min="1" 
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Car Image</label>
                                    <input 
                                        name="imageFile" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFormChange} 
                                    />
                                    {imageBase64 && (
                                        <img 
                                            src={imageBase64} 
                                            alt="Preview" 
                                            className="image-preview"
                                        />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={form.status === 'available'} 
                                            onChange={e => setForm(prev => ({ ...prev, status: e.target.checked ? 'available' : 'not available' }))} 
                                            className="form-checkbox"
                                        />
                                        Available for Booking
                                    </label>
                                </div>
                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        onClick={() => { 
                                            setShowAddForm(false); 
                                            setForm({ name: '', imageUrl: '', status: 'available', passengers: '', description: '' }); 
                                            setImageFile(null); 
                                            setImageBase64(''); 
                                        }} 
                                        className="modal-button cancel-button"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="modal-button save-button"
                                    >
                                        Add Car
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                {loading ? (
                    <div className="loading-message">Loading cars...</div>
                ) : (
                    <div className="cars-grid">
                        {cars.map(car => (
                            <div key={car.id} className="car-card">
								<img 
									src={car.imageBase64} 
									alt={car.name} 
									className="car-image"
									loading="lazy"
									onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
								/>
                                <div className="car-content">
                                    <div>
                                        <div className="car-header">
                                            <h2 className="car-name">{car.name}</h2>
                                            <span className={`car-status ${car.status === 'available' ? 'available' : 'unavailable'}`}>
                                                {car.status?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="car-description">{car.description}</div>
                                        <div className="car-passengers">👥 {car.passengers} Passengers</div>
                                    </div>
                                    
									{/* Per-card modal removed; centralized modal below for smoother UX */}
                                    
                                    <div className="car-actions">
                                        <button 
                                            onClick={() => handleEdit(car)} 
                                            className="car-action-button edit-button"
                                        >
                                            ✏️ Edit
                                        </button>
								<button 
									onClick={async () => {
										if (!window.confirm('Delete this car? This action cannot be undone.')) return;
										setDeletingId(car.id);
										try {
											await deleteDoc(doc(db, 'carlist', car.id));
											setCars(prev => prev.filter(c => c.id !== car.id));
										} finally {
											setDeletingId(null);
										}
									}} 
									disabled={deletingId === car.id}
									className="car-action-button delete-button"
								>
                                            🗑️ Delete
                                        </button>
                                        </div>
                                </div>
                            </div>
					))}
                    </div>
                )}

				{/* Centralized Edit Modal */}
				{showEditModal && (
					<div className="modal-overlay">
						<div className="modal-content">
							<button 
								className="modal-close" 
								onClick={() => { setEditingId(null); setShowEditModal(false); }}
							>
								×
							</button>
							<h2 className="modal-title">Edit Car</h2>
							<form onSubmit={e => { e.preventDefault(); if (editingId) handleSaveEdit(editingId); }}>
								<div className="form-group">
									<label className="form-label">Car Name</label>
									<input 
										name="name" 
										value={editForm.name || ''} 
										onChange={handleEditFormChange} 
										placeholder="Car Name" 
										className="form-input"
									/>
								</div>
								<div className="form-group">
									<label className="form-label">Description</label>
									<textarea 
										name="description" 
										value={editForm.description || ''} 
										onChange={handleEditFormChange} 
										placeholder="Description" 
										className="form-textarea"
									/>
								</div>
								<div className="form-group">
									<label className="form-label">Number of Passengers</label>
									<input 
										name="passengers" 
										value={editForm.passengers || ''} 
										onChange={handleEditFormChange} 
										placeholder="Number of Passengers" 
										type="number" 
										min="1" 
										className="form-input"
									/>
								</div>
								<div className="form-group">
									<label className="form-label">Car Image (not editable here)</label>
									<img 
										src={editForm.imageBase64} 
										alt="Preview" 
										className="image-preview"
									/>
								</div>
								<div className="form-group">
									<label className="form-checkbox-label">
										<input 
											type="checkbox" 
											checked={editForm.status === 'available'} 
											onChange={e => setEditForm(prev => ({ ...prev, status: e.target.checked ? 'available' : 'not available' }))} 
											className="form-checkbox"
										/>
										Available for Booking
									</label>
								</div>
								<div className="modal-actions">
									<button 
										type="button" 
										onClick={() => { setEditingId(null); setShowEditModal(false); }} 
										className="modal-button cancel-button"
									>
										Cancel
									</button>
									<button 
										type="submit" 
										className="modal-button save-button"
										disabled={isSavingEdit}
									>
										{isSavingEdit ? 'Saving...' : 'Save'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
            </div>
        </div>
    );
};

export default ManageCars; 