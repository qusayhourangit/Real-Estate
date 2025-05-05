// PropertyCard.js

import React from 'react'; // Removed useState, useEffect
import { useNavigate } from 'react-router-dom'; // Keep Link if you decide to add it back inside
import { Card, Badge, Button, Spinner } from 'react-bootstrap'; // Added Spinner
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyCard.css'; // Make sure this CSS file exists and is styled correctly
import api from '../API/api'; // Keep for image base URL or remove if not needed

// --- Helper Functions (Define or Import these) ---
// You can move these to a separate utils file and import them
const formatPrice = (price) => {
  // Simplified price display - assumes price is a number or null/undefined
  if (price == null || isNaN(Number(price))) {
     return 'السعر عند الطلب';
  }
  // Using basic toLocaleString for number formatting with Syrian Pounds symbol
  return `${Number(price).toLocaleString('en-US')} ل.س`;
};

const getDealTypeColor = (type) => type === 'sale' ? 'danger' : type === 'rent' ? 'success' : 'primary';
const getPropertyTypeColor = (type) => type === 'house' ? 'info' : type === 'commercial' ? 'warning' : 'secondary';
const getCategoryArabic = (type) => type === 'house' ? 'شقة' : type === 'commercial' ? 'محل' : 'نوع غير معروف';
const getTypeArabic = (purpose) => purpose === 'sale' ? 'للبيع' : purpose === 'rent' ? 'للإيجار' : 'غير محدد';

// --- Component Definition ---
// ===== ACCEPT PROPS FROM PARENT =====
const PropertyCard = ({ property, isSaved, onToggleFavorite, isSaving }) => {
  const navigate = useNavigate();

  // Component now relies entirely on props for saved state and actions

  if (!property) {
    // Optional: Render a placeholder or null if property data is missing
    console.warn("PropertyCard received null or undefined property data.");
    return null;
  }

  // Image URL logic
  const imageUrl = (property.images && property.images.length > 0 && property.images[0]?.image)
    ? `${api.defaults.baseURL}/storage/${property.images[0].image}` // Correct URL construction
    : 'https://via.placeholder.com/400x250/cccccc/969696?text=No+Image'; // Placeholder

  // Handler for clicking the entire card
  const handleCardClick = () => {
    if (property.id) {
      navigate(`/properties/${property.id}`); // Navigate to property details
    } else {
      console.warn("Property ID is missing, cannot navigate.");
    }
  };

  // Handler for clicking the favorite button ONLY
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // IMPORTANT: Prevent event from bubbling up to the Card's onClick
    // Check if onToggleFavorite is a valid function before calling
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(); // Execute the function passed down from the parent component
    } else {
      console.error("PropertyCard: onToggleFavorite prop is missing or not a function.");
      // You might want to redirect to login here if you can check auth state,
      // but ideally, the parent should handle the auth check before passing the function.
    }
  };

  return (
    <Card
      className="property-card h-100 border-0 rounded-4 overflow-hidden shadow-sm" // Added shadow-sm back, adjust as needed
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }} // Make it clear the card is clickable
    >
      <div className="position-relative">
        <Card.Img
          variant="top"
          className="card-img-top" // Ensure consistent styling
          src={imageUrl}
          alt={property.title || 'صورة عقار'}
          onError={(e) => {
            e.target.onerror = null; // Prevent potential infinite loops on error
            e.target.src = 'https://via.placeholder.com/400x250/cccccc/969696?text=Image+Error';
          }}
          style={{ height: '200px', objectFit: 'cover' }} // Consistent image height and fit
        />

        {/* Property Tags (Positioned Top-Right) */}
        <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
          {property.purpose && (
            <Badge bg={getDealTypeColor(property.purpose)} className="rounded-pill px-2 py-1 text-white small">
              {getTypeArabic(property.purpose)}
            </Badge>
          )}
          {property.type && (
            <Badge bg={getPropertyTypeColor(property.type)} className="rounded-pill px-2 py-1 text-white small">
              {getCategoryArabic(property.type)}
            </Badge>
          )}
        </div>

        {/* Favorite Button (Positioned Top-Left) */}
        {/* Conditionally render the button only if the handler function exists */}
        {typeof onToggleFavorite === 'function' && (
          <Button
            variant="light" // Base variant
            className="fav-button position-absolute top-0 start-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center"
            style={{ width: '35px', height: '35px', border: 'none', zIndex: 2 }} // Ensure button is clickable above image potentially
            onClick={handleFavoriteClick} // Use the specific favorite click handler
            disabled={isSaving} // Disable button during save operation (using prop)
            aria-label={isSaved ? "إزالة من المفضلة" : "إضافة للمفضلة"} // Accessibility label (using prop)
          >
            {/* Display Spinner or Heart Icon based on props */}
            {isSaving ? (
              <Spinner animation="border" size="sm" variant="secondary" /> // Show spinner when saving
            ) : isSaved ? ( // Check the isSaved prop
              <FaHeart className="text-danger" /> // Show filled heart if saved
            ) : (
              <FaRegHeart className="text-secondary" /> // Show empty heart if not saved
            )}
          </Button>
        )}
      </div>

      {/* Card Body Content */}
      <Card.Body className="d-flex flex-column p-3">
        {/* Price */}
        <div className="fw-bold fs-5 mb-1" style={{ color: '#d6762e' }}>
          {formatPrice(property.price)}
          {property.purpose === 'rent' && <span className="rent-period text-muted small"> / شهري</span>}
        </div>

        {/* Title */}
        <h5 className="card-title text-truncate mb-2" style={{color: '#333'}}> {/* Ensure title is not the link text */}
          {property.title || 'عنوان غير متوفر'}
        </h5>

        {/* Address (Pushed to the bottom) */}
        <p className="card-text small text-muted mt-auto mb-0 text-truncate">
          {/* Make sure Bootstrap Icons CSS is loaded */}
          <i className="bi bi-geo-alt-fill me-1" style={{ color: '#e38e49' }}></i>
          {property.address || 'العنوان غير محدد'}
        </p>
      </Card.Body>
    </Card>
  );
};

export default PropertyCard;