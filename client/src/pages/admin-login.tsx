import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logoPath from '@assets/logo_1752043363523.png';
import bgPath from '@assets/bg_1751959604580.webp';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const email = `${emailPrefix}@bngroupindia.com`;

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard!"
        });
        
        // Store admin session and token
        localStorage.setItem('adminSession', 'authenticated');
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        
        setLocation('/admin');
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Login failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center' as const,
    backdropFilter: 'blur(5px)',
    fontFamily: "'Poppins', sans-serif",
    margin: '0 auto',
    position: 'relative' as const
  };

  const gradientTextStyle = {
    fontSize: '28px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #007BFF, #e74c3c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '25px'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px',
    margin: '10px 0',
    fontSize: '16px',
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
    padding: '14px',
    margin: '10px 0',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box' as const
  };

  const footerStyle = {
    marginTop: '20px',
    fontSize: '13px',
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
        justifyContent: 'center',
        alignItems: 'center',
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
            width: '100px',
            margin: '0 auto 20px',
            display: 'block'
          }}
        />
        <h1 style={gradientTextStyle}>Admin Portal</h1>

        <form onSubmit={handleSubmit}>
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

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={emailPrefix}
              onChange={(e) => setEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9.]/g, ''))}
              placeholder="Email"
              required
              style={{
                ...inputStyle,
                paddingRight: '180px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <span style={{
              position: 'absolute',
              right: '12px',
              color: '#666',
              fontSize: '14px',
              pointerEvents: 'none'
            }}>
              @bngroupindia.com
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Shield size={16} />
            {isLoading ? 'Signing in...' : 'Admin Login'}
          </button>
        </form>

        
        <div style={footerStyle}>
          <span style={footerLinkStyle} onClick={() => setLocation('/')}>
            <ArrowLeft size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Back to ASM Panel
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