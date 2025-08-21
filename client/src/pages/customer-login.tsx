import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import logoPath from '@assets/logo_1752043363523.png';
import bgPath from '@assets/bg_1751959604580.webp';

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use identifier as-is - support any email format or username
      const finalIdentifier = identifier;
      
      const response = await fetch('/api/asm/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: finalIdentifier, 
          password 
        })
      });
      
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        localStorage.setItem('asmToken', result.token);
        localStorage.setItem('asmUser', JSON.stringify(result.user));
        setLocation('/asm/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };



  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px 30px',
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
    fontSize: '28px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #007BFF, #e74c3c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '25px',
    marginTop: '10px'
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
    fontFamily: "'Poppins', sans-serif"
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

  // Initial welcome screen
  if (!isLoginMode) {
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
        <div style={{...containerStyle, animation: 'fadeIn 0.6s ease-out'}}>
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
          <h1 style={{...gradientTextStyle, animation: 'fadeInDown 0.8s ease-out 0.1s both'}}>BN Support Desk</h1>

          <button 
            style={{...buttonStyle, animation: 'fadeInUp 0.8s ease-out 0.3s both'}}
            onClick={() => setIsLoginMode(true)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#007BFF';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <LogIn size={16} />
            Login
          </button>
          
          <button 
            style={{...buttonStyle, animation: 'fadeInUp 0.8s ease-out 0.5s both'}}
            onClick={() => setLocation('/register')}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#007BFF';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <UserPlus size={16} />
            Register
          </button>

          <div style={footerStyle}>
            Admin? <span style={footerLinkStyle} onClick={() => setLocation('/admin/login')}>Go to Admin Panel</span>
            <br />
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }} className="version-sparkle">
              Version 1.2
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form screen
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
        <h1 style={gradientTextStyle}>ASM Login</h1>

        <form onSubmit={handleLogin}>
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

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#007BFF'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
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
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

        <div style={footerStyle}>
          Don't have an account? <span style={footerLinkStyle} onClick={() => setLocation('/register')}>Sign Up</span>
          <br />
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }} className="version-sparkle">
            Version 1.2
          </div>
        </div>
        


      </div>
    </div>
  );
}