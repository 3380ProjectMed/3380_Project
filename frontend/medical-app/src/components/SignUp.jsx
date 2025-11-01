import { useState } from 'react';
import { Mail, Lock, User, Phone, Calendar, MapPin, UserPlus } from 'lucide-react';
import './SignUp.css';

export default function SignUp() {
const [formData, setFormData] = useState({
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  dateOfBirth: '', phone: '', gender: '',
  address: '', city: '', state: '', zipCode: '',
  emergencyContactfn: '',
  emergencyContactln: '',
  emergencyContactrl: '',
  emergencyPhone: ''
});

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/signup.php', {  // Adjust path as needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Account created successfully!');
        // Redirect to login or dashboard
        window.location.href = '/login';
      } else {
        // Display server-side errors
        if (data.errors) {
          setErrors(data.errors);
        }
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        {/* Welcome Header */}
        <div className="signup-welcome">
          <div className="signup-icon-wrapper">
            <UserPlus />
          </div>
          <h1 className="signup-title">Create Patient Account</h1>
          <p className="signup-subtitle">Join us to manage your healthcare journey</p>
        </div>

        {/* Main Card */}
        <div className="signup-card">
          <div className="signup-card-content">
            {/* Personal Information */}
            <div className="signup-section">
              <h3 className="signup-section-title">Personal Information</h3>
              
              <div className="signup-grid">
                <div className="signup-field">
                  <label htmlFor="firstName" className="signup-label">
                    First Name *
                  </label>
                  <div className="signup-input-wrapper">
                    <User className="signup-input-icon" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`signup-input signup-input-with-icon ${errors.firstName ? 'signup-input-error' : ''}`}
                    />
                  </div>
                  {errors.firstName && <span className="signup-error-message">{errors.firstName}</span>}
                </div>

                <div className="signup-field">
                  <label htmlFor="lastName" className="signup-label">
                    Last Name *
                  </label>
                  <div className="signup-input-wrapper">
                    <User className="signup-input-icon" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`signup-input signup-input-with-icon ${errors.lastName ? 'signup-input-error' : ''}`}
                    />
                  </div>
                  {errors.lastName && <span className="signup-error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="signup-grid">
                <div className="signup-field">
                  <label htmlFor="dateOfBirth" className="signup-label">
                    Date of Birth *
                  </label>
                  <div className="signup-input-wrapper">
                    <Calendar className="signup-input-icon" />
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`signup-input signup-input-with-icon ${errors.dateOfBirth ? 'signup-input-error' : ''}`}
                    />
                  </div>
                  {errors.dateOfBirth && <span className="signup-error-message">{errors.dateOfBirth}</span>}
                </div>

                <div className="signup-field">
                  <label htmlFor="gender" className="signup-label">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`signup-select ${errors.gender ? 'signup-select-error' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.gender && <span className="signup-error-message">{errors.gender}</span>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="signup-section">
              <h3 className="signup-section-title">Contact Information</h3>
              
              <div className="signup-field">
                <label htmlFor="email" className="signup-label">
                  Email Address *
                </label>
                <div className="signup-input-wrapper">
                  <Mail className="signup-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`signup-input signup-input-with-icon ${errors.email ? 'signup-input-error' : ''}`}
                  />
                </div>
                {errors.email && <span className="signup-error-message">{errors.email}</span>}
              </div>

              <div className="signup-field">
                <label htmlFor="phone" className="signup-label">
                  Phone Number *
                </label>
                <div className="signup-input-wrapper">
                  <Phone className="signup-input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className={`signup-input signup-input-with-icon ${errors.phone ? 'signup-input-error' : ''}`}
                  />
                </div>
                {errors.phone && <span className="signup-error-message">{errors.phone}</span>}
              </div>

              <div className="signup-field">
                <label htmlFor="address" className="signup-label">
                  Street Address
                </label>
                <div className="signup-input-wrapper">
                  <MapPin className="signup-input-icon" />
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="signup-input signup-input-with-icon"
                  />
                </div>
              </div>

              <div className="signup-grid-3">
                <div className="signup-field">
                  <label htmlFor="city" className="signup-label">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="signup-input"
                  />
                </div>
                <div className="signup-field">
                  <label htmlFor="state" className="signup-label">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="signup-input"
                  />
                </div>
                <div className="signup-field">
                  <label htmlFor="zipCode" className="signup-label">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="signup-input"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="signup-section">
              <h3 className="signup-section-title">Emergency Contact</h3>
              
              <div className="signup-grid">
                <div className="signup-field">
                  <label htmlFor="emergencyContactfn" className="signup-label">
                    Contact First Name
                  </label>
                  <input
                    type="text"
                    id="emergencyContactfn"
                    name="emergencyContactfn"
                    value={formData.emergencyContactfn}
                    onChange={handleChange}
                    className="signup-input"
                  />
                  <label htmlFor="emergencyContactln" className="signup-label">
                    Contact Last Name
                  </label>
                  <input
                    type="text"
                    id="emergencyContactln"
                    name="emergencyContactln"
                    value={formData.emergencyContactln}
                    onChange={handleChange}
                    className="signup-input"
                  />
                  <label htmlFor="emergencyContactrl" className="signup-label">
                    Contact Relation to Patient
                  </label>
                  <input
                    type="text"
                    id="emergencyContactrl"
                    name="emergencyContactrl"
                    value={formData.emergencyContactrl}
                    onChange={handleChange}
                    className="signup-input"
                  />
                </div>
                <div className="signup-field">
                  <label htmlFor="emergencyPhone" className="signup-label">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="signup-input"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="signup-section">
              <h3 className="signup-section-title">Create Password</h3>
              
              <div className="signup-field">
                <label htmlFor="password" className="signup-label">
                  Password *
                </label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`signup-input signup-input-with-icon ${errors.password ? 'signup-input-error' : ''}`}
                  />
                </div>
                {errors.password && <span className="signup-error-message">{errors.password}</span>}
              </div>

              <div className="signup-field">
                <label htmlFor="confirmPassword" className="signup-label">
                  Confirm Password *
                </label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`signup-input signup-input-with-icon ${errors.confirmPassword ? 'signup-input-error' : ''}`}
                  />
                </div>
                {errors.confirmPassword && <span className="signup-error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="signup-submit"
            >
              {isSubmitting ? (
                <>
                  <div className="signup-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="signup-submit-icon" />
                  Create Account
                </>
              )}
            </button>

            {/* Divider */}
            <div className="signup-divider">
              <div className="signup-divider-line"></div>
              <span className="signup-divider-text">or</span>
              <div className="signup-divider-line"></div>
            </div>

            {/* Sign In Link */}
            <div className="signup-signin">
              <p className="signup-signin-text">
                Already have an account?{' '}
                <a href="/login" className="signup-signin-link">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}