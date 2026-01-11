import React from 'react';
import './About.css';
import { FaCarAlt, FaUserClock, FaHeadset, FaShieldAlt } from 'react-icons/fa';

const About = () => {
  const features = [
    {
      icon: <FaUserClock />,
      title: '23+ Years Experience',
      description: 'Serving travelers since 2002 with reliability and excellence in transportation services.'
    },
    {
      icon: <FaCarAlt />,
      title: 'Premium Fleet',
      description: 'Wide range of well-maintained vehicles to meet all your travel needs and comfort.'
    },
    {
      icon: <FaHeadset />,
      title: '24/7 Support',
      description: 'Round-the-clock customer service to assist you anytime, anywhere during your journey.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Safe & Reliable',
      description: 'Professional drivers and regularly maintained vehicles ensuring your safety.'
    }
  ];

  const stats = [
    {
      number: '23+',
      label: 'Years of Experience'
    },
    {
      number: '15K+',
      label: 'Happy Customers'
    },
    {
      number: '100+',
      label: 'Premium Vehicles'
    },
    {
      number: '50+',
      label: 'Expert Drivers'
    }
  ];

  return (
    <section className="about" id="about">
      <div className="about-container">
        <div className="about-header">
          <h2>About Bappa Travels taxi services</h2>
          <p>
            Since 2002, Bappa Travels taxi services has been the trusted choice for travelers seeking reliable and comfortable transportation solutions. 
            We take pride in our commitment to excellence, safety, and customer satisfaction.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Remove the experience-counter section */}
      </div>
    </section>
  );
};

export default About; 