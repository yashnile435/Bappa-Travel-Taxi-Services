import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaCar, FaRupeeSign, FaDownload, FaWhatsapp, FaPrint, FaPlus, FaMinus, FaArrowLeft, FaTachometerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import AdminNavbar from './AdminNavbar';
import './BillGeneration.css';

const BillGeneration = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [billData, setBillData] = useState({
    taxiNumber: '',
    date: new Date().toISOString().split('T')[0],
    journeyDate: new Date().toISOString().split('T')[0],
    customerName: '',
    from: '',
    to: '',
    taxiRate: '',
    perDay: '',
    openKm: '',
    closeKm: '',
    totalKm: '',
    totalBill: '',
    extraCharges: '',
    balance: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'create' or 'history' - default to history
  const [billHistory, setBillHistory] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  // MODAL: Add state for modal preview
  const [previewModal, setPreviewModal] = useState({ open:false, bill:null });
  const [shareDropdown, setShareDropdown] = useState({openBillId:null});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch bills from Firebase (history tab)
  const fetchBills = async () => {
    setBillsLoading(true);
    try {
      const sn = await getDocs(collection(db, 'bills'));
      setBillHistory(sn.docs.map(doc => ({id: doc.id, ...doc.data()})));
    } catch (e) {
      setBillHistory([]);
    }
    setBillsLoading(false);
  };
  useEffect(() => {
    if(activeTab === 'history') fetchBills();
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-convert taxi number to uppercase
    let processedValue = value;
    if (name === 'taxiNumber') {
      processedValue = value.toUpperCase();
    }
    
    setBillData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Auto-calculate total km if both open and close km are provided
    if (name === 'openKm' || name === 'closeKm') {
      const openKm = name === 'openKm' ? value : billData.openKm;
      const closeKm = name === 'closeKm' ? value : billData.closeKm;
      if (openKm && closeKm && !isNaN(openKm) && !isNaN(closeKm)) {
        const totalKm = parseFloat(closeKm) - parseFloat(openKm);
        setBillData(prev => ({
          ...prev,
          totalKm: totalKm > 0 ? totalKm.toString() : ''
        }));
        
        // Auto-calculate total bill = total km * taxi rate
        const taxiRate = billData.taxiRate;
        if (taxiRate && !isNaN(taxiRate) && totalKm > 0) {
          const calculatedTotalBill = totalKm * parseFloat(taxiRate);
          setBillData(prev => ({
            ...prev,
            totalBill: calculatedTotalBill.toString()
          }));
        }
      }
    }

    // Auto-calculate total bill when taxi rate changes
    if (name === 'taxiRate') {
      const totalKm = billData.totalKm;
      if (totalKm && !isNaN(totalKm) && value && !isNaN(value)) {
        const calculatedTotalBill = parseFloat(totalKm) * parseFloat(value);
        setBillData(prev => ({
          ...prev,
          totalBill: calculatedTotalBill.toString()
        }));
      }
    }

    // Auto-calculate balance
    if (['totalBill', 'extraCharges', 'perDay'].includes(name)) {
      const totalBill = name === 'totalBill' ? processedValue : billData.totalBill;
      const extraCharges = name === 'extraCharges' ? processedValue : billData.extraCharges;
      const perDay = name === 'perDay' ? processedValue : billData.perDay;
      const balanceCalc =
        (parseFloat(perDay) || 0) + (parseFloat(totalBill) || 0) + (parseFloat(extraCharges) || 0);
      setBillData(prev => ({
        ...prev,
        balance: balanceCalc ? balanceCalc.toString() : ''
      }));
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setBillData(prev => ({
      ...prev,
      customerName: user.name || '',
      customerPhone: user.phone || ''
    }));
  };

  // PDF visual improvements & cleanup
  const defaultBillOrCurrent = (bill) => bill || { ...billData, customerPhone: selectedUser?.phone, customerEmail: selectedUser?.email}
  const generatePDF = (bill) => {
    bill = defaultBillOrCurrent(bill);
    const pdf = new jsPDF();
    pdf.setFontSize(22);
    pdf.setTextColor(220,38,38);
    pdf.setFont('helvetica','bold');
    pdf.text('BAPPA TRAVELS TAXI SERVICES', 105, 24, {align:'center'});
    pdf.setFontSize(10);
    pdf.setFont('helvetica','normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Khandesh Mill Complex, Station Road, Jalgaon-425001', 105,32,{align:'center'});
    pdf.text('Mob.: 90113 33966', 105,38,{align:'center'});
    // Memo
    pdf.setLineWidth(1.2); pdf.setDrawColor(220,38,38);
    pdf.rect(66,48,78,13); pdf.setTextColor(0,0,0); pdf.setFont('helvetica','bold'); pdf.setFontSize(14);
    pdf.text('CASH / CREDIT MEMO', 105, 57, {align:'center'});
    let y=72; pdf.setFontSize(11); pdf.setFont('helvetica','normal'); pdf.setTextColor(0,0,0);
    pdf.text(`TAXE No.: ${bill.taxiNumber}`,18,y); pdf.text(`Date : ${bill.journeyDate}`,122,y);
    y += 12; pdf.text(`Customer Name: ${bill.customerName}`,18,y);
    y += 12; pdf.text(`From: ${bill.from}`, 18, y); pdf.text(`To: ${bill.to}`, 122, y);
    y += 12; pdf.text(`Taxe Rate: ${bill.taxiRate}`, 18, y); pdf.text(`Per. Day: ${bill.perDay}`, 122, y);
    y += 12; pdf.text(`Open Km.: ${bill.openKm}`, 18, y); pdf.text(`Close Km.: ${bill.closeKm}`, 122, y);
    y += 12; pdf.text(`Total Km.: ${bill.totalKm}`, 18, y);
    y += 13; pdf.setFillColor(232,242,254);
    pdf.rect(16,y-8,177,26,'F'); pdf.setFont('helvetica','bold'); pdf.setFontSize(12);
    pdf.setTextColor(25,55,130); pdf.text(`Total Bill: ₹${bill.totalBill}`, 18, y); pdf.text(`Extra Charges: ₹${bill.extraCharges}`, 122, y);
    y += 12; pdf.setFontSize(13);
    pdf.text(`Balance: ₹${bill.balance}`, 18, y);
    pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(80,80,80);
    pdf.text('For - BAPPA TRAVELS TAXI SERVICES', 153, 200, {align:'right'});
    // Filename
    const customerName = (bill.customerName||'').replace(/[^a-zA-Z0-9]/g,'_');
    const journeyDate = (bill.journeyDate||'').replace(/-/g,'_');
    const filename = `Bill_${customerName}_${journeyDate}.pdf`;
    pdf.save(filename);
  };

  // Update WhatsApp sharing logic
  const shareBillOnWhatsApp = (bill) => {
    if (!bill.customerPhone) {
      alert('No mobile registered! Will send via email.');
      // Here trigger backend email (placeholder)
      alert('Email fallback not implemented: Would send bill to '+(bill.customerEmail||'user email'));
      return;
    }
    const message = `*BAPPA TRAVELS TAXI SERVICES*\n\n*Bill Details:*\nTaxi No: ${bill.taxiNumber}\nDate: ${bill.journeyDate}\nCustomer: ${bill.customerName}\nFrom: ${bill.from}\nTo: ${bill.to}\nTotal Bill: ₹${bill.totalBill}\nExtra Charges: ₹${bill.extraCharges}\nBalance: ₹${bill.balance}\n\nThank you for choosing Bappa Travels!`;
    const whatsappUrl = `https://wa.me/91${bill.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const saveBill = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!billData.taxiNumber || !billData.customerName || !billData.journeyDate) {
        alert('Please fill in Taxi Number, Customer Name, and Journey Date');
        return;
      }
      
      // Prepare bill data for Firebase
      const billToSave = {
        ...billData,
        userId: selectedUser?.id || null,
        customerPhone: selectedUser?.phone || '',
        billNumber: `BT${Date.now()}`, // Generate unique bill number
        createdAt: serverTimestamp(),
        status: 'active',
        // Additional metadata
        generatedBy: 'admin',
        billType: 'taxi_service'
      };
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, 'bills'), billToSave);
      
      // Show success message with bill number
      alert(`Bill saved successfully!\nBill Number: ${billToSave.billNumber}\nCustomer: ${billData.customerName}\nJourney Date: ${billData.journeyDate}`);
      
      // Reset form after successful save
      resetForm();
      
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Error saving bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBillData({
      taxiNumber: '',
      date: new Date().toISOString().split('T')[0],
      journeyDate: new Date().toISOString().split('T')[0],
      customerName: '',
      from: '',
      to: '',
      taxiRate: '',
      perDay: '',
      openKm: '',
      closeKm: '',
      totalKm: '',
      totalBill: '',
      extraCharges: '',
      balance: ''
    });
    setSelectedUser(null);
  };

  return (
    <>
      <AdminNavbar />
      <div className="bill-generation-container">
        <div className="bill-header">
        <div className="bill-header-top">
          <button 
            className="dashboard-btn" 
            onClick={() => navigate('/admin/dashboard')}
            title="Go to Admin Dashboard"
          >
            <FaTachometerAlt /> Dashboard
          </button>
          <button 
            className="back-btn" 
            onClick={() => navigate('/admin/dashboard')}
            title="Go Back"
          >
            <FaArrowLeft /> Back
          </button>
        </div>
        <h2><FaCar /> Bill Generation</h2>
        <p>Generate bills for taxi services</p>
      </div>

      <div className="bill-tabs">
        <button
          className={activeTab==='history'?"active":""}
          onClick={()=>setActiveTab('history')}>Previous Bills</button>
        <button
          className={activeTab==='create'?"active new-bill-btn":"new-bill-btn"}
          onClick={()=>{ setActiveTab('create'); resetForm(); }}>+ New Bill</button>
      </div>
      {activeTab==='create' && (
        <div className="bill-content">
          <div className="bill-form-section">
            <div className="form-card">
              <h3><FaUser /> Customer Selection</h3>
              <div className="user-selection">
                <select 
                  value={selectedUser?.id || ''} 
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    handleUserSelect(user);
                  }}
                  className="user-select"
                >
                  <option value="">Select Customer</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-card">
              <h3><FaCalendarAlt /> Bill Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Taxi Number</label>
                  <input
                    type="text"
                    name="taxiNumber"
                    value={billData.taxiNumber}
                    onChange={handleInputChange}
                    placeholder="Enter taxi number"
                  />
                </div>
                <div className="form-group">
                  <label>Bill Date</label>
                  <input
                    type="date"
                    name="date"
                    value={billData.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Journey Date</label>
                  <input
                    type="date"
                    name="journeyDate"
                    value={billData.journeyDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={billData.customerName}
                    onChange={handleInputChange}
                    placeholder="Customer name"
                  />
                </div>
                <div className="form-group">
                  <label><FaMapMarkerAlt /> From</label>
                  <input
                    type="text"
                    name="from"
                    value={billData.from}
                    onChange={handleInputChange}
                    placeholder="Pickup location"
                  />
                </div>
                <div className="form-group">
                  <label><FaMapMarkerAlt /> To</label>
                  <input
                    type="text"
                    name="to"
                    value={billData.to}
                    onChange={handleInputChange}
                    placeholder="Drop location"
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3><FaRupeeSign /> Billing Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Taxi Rate</label>
                  <input
                    type="number"
                    name="taxiRate"
                    value={billData.taxiRate}
                    onChange={handleInputChange}
                    placeholder="Rate per km"
                  />
                </div>
                <div className="form-group">
                  <label>Per Day</label>
                  <input
                    type="number"
                    name="perDay"
                    value={billData.perDay}
                    onChange={handleInputChange}
                    placeholder="Daily rate"
                  />
                </div>
                <div className="form-group">
                  <label>Open Km</label>
                  <input
                    type="number"
                    name="openKm"
                    value={billData.openKm}
                    onChange={handleInputChange}
                    placeholder="Starting km"
                  />
                </div>
                <div className="form-group">
                  <label>Close Km</label>
                  <input
                    type="number"
                    name="closeKm"
                    value={billData.closeKm}
                    onChange={handleInputChange}
                    placeholder="Ending km"
                  />
                </div>
                <div className="form-group">
                  <label>Total Km</label>
                  <input
                    type="number"
                    name="totalKm"
                    value={billData.totalKm}
                    onChange={handleInputChange}
                    placeholder="Total kilometers"
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Total Bill</label>
                  <input
                    type="number"
                    name="totalBill"
                    value={billData.totalBill}
                    onChange={handleInputChange}
                    placeholder="Total amount"
                  />
                </div>
                <div className="form-group">
                  <label>Extra Charges</label>
                  <input
                    type="number"
                    name="extraCharges"
                    value={billData.extraCharges}
                    onChange={handleInputChange}
                    placeholder="Additional charges"
                  />
                </div>
                <div className="form-group">
                  <label>Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={billData.balance}
                    onChange={handleInputChange}
                    placeholder="Final balance"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button onClick={() => setShowPreview(!showPreview)} className="btn-preview">
                <FaPrint /> {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button onClick={generatePDF} className="btn-download">
                <FaDownload /> Download PDF
              </button>
              <button onClick={()=>shareBillOnWhatsApp({ ...billData, customerPhone: selectedUser?.phone, customerEmail: selectedUser?.email })} className="btn-whatsapp" disabled={!selectedUser}>
                <FaWhatsapp /> Share on WhatsApp
              </button>
              <button onClick={saveBill} className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Bill'}
              </button>
              <button onClick={resetForm} className="btn-reset">
                Reset Form
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="bill-preview-section">
              <div className="bill-preview">
                <div className="bill-preview-header">
                  <h2>BAPPA TRAVELS TAXI SERVICES</h2>
                  <p>Khandesh Mill Complex, Station Road, Jalgaon.</p>
                  <p>Mob.: 90963 33966</p>
                  <div className="memo-box">CASH / CREDIT MEMO</div>
                </div>
                
                <div className="bill-preview-content">
                  <div className="bill-row">
                    <span>TAXE No.: {billData.taxiNumber}</span>
                    <span>Date : {billData.journeyDate}</span>
                  </div>
                  <div className="bill-row">
                    <span>Customer Name: {billData.customerName}</span>
                  </div>
                  <div className="bill-row">
                    <span>From: {billData.from}</span>
                    <span>To: {billData.to}</span>
                  </div>
                  <div className="bill-row">
                    <span>Taxe Rate: {billData.taxiRate}</span>
                    <span>Per. Day: {billData.perDay}</span>
                  </div>
                  <div className="bill-row">
                    <span>Open Km: {billData.openKm}</span>
                    <span>Close Km: {billData.closeKm}</span>
                  </div>
                  <div className="bill-row">
                    <span>Total Km: {billData.totalKm}</span>
                  </div>
                  <div className="bill-row">
                    <span>Total Bill: ₹{billData.totalBill}</span>
                    <span>Extra Charges: ₹{billData.extraCharges}</span>
                  </div>
                  <div className="bill-row">
                    <span>Balance: ₹{billData.balance}</span>
                  </div>
                </div>
                
                <div className="bill-preview-footer">
                  <p>For - BAPPA TRAVELS TAXI SERVICES</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab==='history' && (
        <>
          <div className='bill-history-table'>
            {billsLoading ? <div style={{padding: '20px', textAlign: 'center'}}>Loading bills...</div> : (
              <table>
                <thead><tr><th>Date</th><th>Name</th><th>Taxi No.</th><th>From</th><th>To</th><th>Total</th><th colSpan="3">Actions</th></tr></thead>
                <tbody>
                {billHistory.length === 0 && <tr><td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>No bills found.</td></tr>}
                {billHistory.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.journeyDate}</td>
                    <td>{bill.customerName}</td>
                    <td>{bill.taxiNumber}</td>
                    <td>{bill.from}</td>
                    <td>{bill.to}</td>
                    <td>₹{bill.balance}</td>
                    <td><button title='Show' onClick={()=>setPreviewModal({open:true, bill})}>Show Bill</button></td>
                    <td><button title='Download' onClick={()=>generatePDF(bill)}>Download</button></td>
                    <td><div style={{position:'relative',display:'inline-block'}}><button title='Share' onClick={()=>setShareDropdown({openBillId:bill.id})}>Share</button>{shareDropdown.openBillId===bill.id && <div className='share-menu'><button onClick={()=>{shareBillOnWhatsApp(bill);setShareDropdown({openBillId:null})}}>WhatsApp</button><button onClick={()=>{alert('Future: Share via email');setShareDropdown({openBillId:null})}}>Email</button></div>}</div></td>  
                  </tr>
                ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Mobile Card Layout */}
          <div className='bill-history-cards'>
            {billsLoading ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>Loading bills...</div>
            ) : billHistory.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>No bills found.</div>
            ) : (
              billHistory.map(bill => (
                <div key={bill.id} className='bill-history-card'>
                  <div className='bill-history-card-header'>
                    <h3 className='bill-history-card-title'>{bill.customerName}</h3>
                    <span className='bill-history-card-date'>{bill.journeyDate}</span>
                  </div>
                  <div className='bill-history-card-body'>
                    <div className='bill-history-card-row'>
                      <span className='bill-history-card-label'>Taxi No.:</span>
                      <span className='bill-history-card-value'>{bill.taxiNumber}</span>
                    </div>
                    <div className='bill-history-card-row'>
                      <span className='bill-history-card-label'>From:</span>
                      <span className='bill-history-card-value'>{bill.from}</span>
                    </div>
                    <div className='bill-history-card-row'>
                      <span className='bill-history-card-label'>To:</span>
                      <span className='bill-history-card-value'>{bill.to}</span>
                    </div>
                    <div className='bill-history-card-row'>
                      <span className='bill-history-card-label'>Total:</span>
                      <span className='bill-history-card-value' style={{fontWeight: '700', color: '#2c3e50', fontSize: '1.1rem'}}>₹{bill.balance}</span>
                    </div>
                  </div>
                  <div className='bill-history-card-actions'>
                    <button className='btn-show' onClick={()=>setPreviewModal({open:true, bill})}>
                      <FaPrint /> Show Bill
                    </button>
                    <button className='btn-download' onClick={()=>generatePDF(bill)}>
                      <FaDownload /> Download
                    </button>
                    <div style={{position:'relative', display: 'flex', flex: 1, minWidth: '100px'}}>
                      <button className='btn-share' onClick={()=>setShareDropdown({openBillId: shareDropdown.openBillId === bill.id ? null : bill.id})}>
                        <FaWhatsapp /> Share
                      </button>
                      {shareDropdown.openBillId===bill.id && (
                        <div className='share-menu' style={{position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px'}}>
                          <button onClick={()=>{shareBillOnWhatsApp(bill);setShareDropdown({openBillId:null})}}>WhatsApp</button>
                          <button onClick={()=>{alert('Future: Share via email');setShareDropdown({openBillId:null})}}>Email</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {previewModal.open && <div className="bill-modal-backdrop" onClick={()=>setPreviewModal({open:false, bill:null})}><div className="bill-modal" onClick={e=>e.stopPropagation()}><button className="modal-close-btn" onClick={()=>setPreviewModal({open:false, bill:null})}>×</button><div className="bill-preview">{/* Use bill-preview code, but pass previewModal.bill */}<div className="bill-preview-header">
<h2>BAPPA TRAVELS TAXI SERVICES</h2><p>Khandesh Mill Complex, Station Road, Jalgaon.</p><p>Mob.: 90963 33966</p><div className="memo-box">CASH / CREDIT MEMO</div></div><div className="bill-preview-content">
<div className="bill-row"><span>TAXE No.: {previewModal.bill?.taxiNumber}</span><span>Date : {previewModal.bill?.journeyDate}</span></div><div className="bill-row"><span>Customer Name: {previewModal.bill?.customerName}</span></div><div className="bill-row"><span>From: {previewModal.bill?.from}</span><span>To: {previewModal.bill?.to}</span></div><div className="bill-row"><span>Taxe Rate: {previewModal.bill?.taxiRate}</span><span>Per. Day: {previewModal.bill?.perDay}</span></div><div className="bill-row"><span>Open Km: {previewModal.bill?.openKm}</span><span>Close Km: {previewModal.bill?.closeKm}</span></div><div className="bill-row"><span>Total Km: {previewModal.bill?.totalKm}</span></div><div className="bill-row"><span>Total Bill: ₹{previewModal.bill?.totalBill}</span><span>Extra Charges: ₹{previewModal.bill?.extraCharges}</span></div><div className="bill-row"><span>Balance: ₹{previewModal.bill?.balance}</span></div></div><div className="bill-preview-footer"><p>For - BAPPA TRAVELS TAXI SERVICES</p></div></div></div></div>}
      </div>
    </>
  );
};

export default BillGeneration;
