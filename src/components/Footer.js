import React from 'react';
import './Footer.css';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaWhatsapp, FaDownload, FaClock, FaHome, FaInfoCircle, FaCar } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Quick Links</h3>
          <div className="footer-links">
            <a href="#home" className="footer-link"><FaHome className="footer-link-icon" /> Home</a>
            <a href="#about" className="footer-link"><FaInfoCircle className="footer-link-icon" /> About Us</a>
            <a href="#cars" className="footer-link"><FaCar className="footer-link-icon" /> Our Fleet</a>
            <a href="#contact" className="footer-link"><FaEnvelope className="footer-link-icon" /> Contact</a>
            <a href="https://www.facebook.com/people/Bappa-Travels/pfbid02D2LqJckwbNtF9e8HuAWeHmKS2NJpxim3i22geYnWwsmKfGSj8FTEU6Ph9r4Qxs2ml/" target="_blank" rel="noopener noreferrer" className="footer-link"><FaFacebookF className="footer-link-icon" /> Facebook</a>
            <a href="https://wa.me/919011333966" target="_blank" rel="noopener noreferrer" className="footer-link"><FaWhatsapp className="footer-link-icon" /> WhatsApp</a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Contact Info</h3>
          <div className="footer-contact-info">
            <div className="contact-item">
              <FaPhoneAlt className="contact-icon" />
              <a href="tel:+919011333966" className="footer-link">+91 90113 33966</a>
            </div>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <a href="mailto:travel.bappa15@gmail.com" className="footer-link">travel.bappa15@gmail.com</a>
            </div>
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <a 
                href="https://www.google.com/maps/place/Bappa+Travels+taxi+services/@20.5780424,72.1398393,5z/data=!4m6!3m5!1s0x3bd90fe3ce991af5:0x9bee5db567d1493b!8m2!3d21.0248523!4d75.5620033!16s%2Fg%2F11stwn4bzk?entry=ttu" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link"
              >
                Near Nehru Chowk, Pratap Nagar, Jalgaon
              </a>
            </div>
          </div>
          <a href="/card.jpg" download className="download-card">
            <FaDownload className="download-icon" />
            <span>Download Business Card</span>
          </a>
        </div>

        <div className="footer-section">
          <h3>Business Hours</h3>
          <div className="business-hours">
            <div className="hours-item">
              <FaClock className="contact-icon" />
              <span>24/7 Service Available</span>
            </div>
            <div className="hours-item">
              <span>Monday - Sunday</span>
              <span>Open All Days</span>
            </div>
            <div className="hours-item">
              <span>Emergency Service</span>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Bappa travels taxi services. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 