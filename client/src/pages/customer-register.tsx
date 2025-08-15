import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logoPath from '@assets/logo_1752043363523.png';
import bgPath from '@assets/bg_1751959604580.webp';

export default function CustomerRegister() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/asm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email, // Use email as username
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });
      
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully!"
        });
        setLocation('/login');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '30px 25px',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center' as const,
    backdropFilter: 'blur(5px)',
    fontFamily: "'Poppins', sans-serif",
    margin: '0 auto',
    position: 'relative' as const
  };

  const gradientTextStyle = {
    fontSize: '24px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #007BFF, #e74c3c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#007BFF',
    color: 'white',
    textDecoration: 'none',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.3s ease, transform 0.2s',
    boxShadow: '0 6px 15px rgba(0, 123, 255, 0.3)',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box' as const
  };

  const footerStyle = {
    marginTop: '15px',
    fontSize: '12px',
    color: '#666'
  };

  const footerLinkStyle = {
    color: '#007BFF',
    fontWeight: '500',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  return (
    <div 
      style={{
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingLeft: '25%',
        backgroundImage: `linear-gradient(to right, rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)), url(${bgPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100vw',
        padding: '20px',
        margin: 0,
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div style={containerStyle}>
        <img 
          src={logoPath} 
          alt="BN Group Logo" 
          loading="eager"
          style={{
            width: '80px',
            margin: '0 auto 15px',
            display: 'block'
          }}
        />
        <h1 style={gradientTextStyle}>Create ASM Account</h1>

        <form onSubmit={handleRegister}>
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
              style={{ ...inputStyle, width: 'calc(50% - 5px)' }}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <input
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
              style={{ ...inputStyle, width: 'calc(50% - 5px)' }}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>



          <div style={{ position: 'relative' }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              style={{...inputStyle, paddingRight: '50px'}}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#666'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
              required
              style={{...inputStyle, paddingRight: '50px'}}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#666'
              }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            style={buttonStyle}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#007BFF';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <UserPlus size={16} />
            {isLoading ? 'Creating ASM Account...' : 'Create ASM Account'}
          </button>
        </form>

        <div style={footerStyle}>
          Already have an ASM account? <span style={footerLinkStyle} onClick={() => setLocation('/login')}>Sign In</span>
        </div>

        <div style={footerStyle}>
          <span style={footerLinkStyle} onClick={() => setLocation('/login')}>
            <ArrowLeft size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Back to Login
          </span>
          <br />
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
            Version 1.1
          </div>
        </div>
        


      </div>
    </div>
  );
}