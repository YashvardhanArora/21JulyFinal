import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import logoPath from '@assets/logo hq_1751960302626.jpg';
import bgPath from '@assets/bg_1751959604580.webp';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check credentials
    if (username === "temp" && password === "temp") {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!"
      });
      
      // Store admin session
      localStorage.setItem('adminSession', 'authenticated');
      setLocation('/admin');
    } else {
      setError("Invalid credentials. Please try again.");
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

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#007BFF'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#007BFF'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />

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

        <div style={{
          ...footerStyle,
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          Demo Credentials:<br/>
          Username: <strong>temp</strong><br/>
          Password: <strong>temp</strong>
        </div>
        
        <div style={footerStyle}>
          <span style={footerLinkStyle} onClick={() => setLocation('/')}>
            <ArrowLeft size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Back to ASM Panel
          </span>
        </div>
      </div>
    </div>
  );
}