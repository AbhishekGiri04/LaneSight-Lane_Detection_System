import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [outputVideo, setOutputVideo] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 4000);
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Select a video first!");
    if (!file.name.match(/\.(mp4|avi|mov)$/)) {
      alert("Invalid file type! Please upload MP4, AVI, or MOV.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("http://localhost:8000/upload-video", formData, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFileName(res.data.filename);
    } catch (error) {
      console.error('Upload error:', error);
      alert("Upload failed: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleProcess = async () => {
    if (!uploadedFileName) return alert("Upload video first!");
    setProcessing(true);
    setOutputVideo(false);
    try {
      const processResponse = await axios.get(
        `http://localhost:8000/start-detection?filename=${uploadedFileName}`,
        { timeout: 120000 }
      );
      
      if (processResponse.data.status === "error") {
        throw new Error(processResponse.data.message);
      }
      
      setOutputVideo(true);
    } catch (error) {
      console.error('Processing error:', error);
      alert("Processing failed: " + (error.response?.data?.message || error.message));
    }
    setProcessing(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `http://localhost:8000/download-video?filename=${uploadedFileName}`;
    link.download = 'lanesight_processed_video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://i.pinimg.com/originals/72/18/a1/7218a1302960c48611e068302450c2a6.gif)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 9999
      }}>
        <div style={{
          textAlign: 'center',
          position: 'absolute',
          top: '20%',
          width: '100%'
        }}>
          <h1 style={{ 
            color: 'white',
            fontSize: '4rem', 
            margin: '0',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            LaneSight
          </h1>
          <p style={{ 
            color: '#87CEEB',
            fontSize: '1.5rem', 
            margin: '20px 0 0 0',
            fontWeight: '600',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            Smart Lane Monitoring<br/>Initializing System...
          </p>
        </div>
      </div>
    );
  }

  const Header = () => (
    <header style={{
      background: 'rgba(15, 23, 42, 0.95)',
      padding: '20px 0',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06d6a0, #f59e0b)',
        animation: 'gradientShift 3s ease-in-out infinite'
      }}></div>
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 30px',
        position: 'relative'
      }}>
        <div 
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0px',
            transition: 'all 0.3s ease'
          }} 
          onClick={() => setCurrentPage('home')}
        >
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.9rem', 
              fontWeight: '800', 
              background: 'linear-gradient(45deg, #ffffff, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>LaneSight</h1>
            <small style={{ 
              fontSize: '0.85rem', 
              color: '#94a3b8', 
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>Smart Lane Monitoring</small>
          </div>
        </div>
        
        <nav style={{ 
          display: 'flex', 
          gap: '8px',
          background: 'rgba(30, 41, 59, 0.6)',
          padding: '8px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <span 
            style={{ 
              cursor: 'pointer', 
              padding: '12px 24px', 
              borderRadius: '12px', 
              background: currentPage === 'home' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              transition: 'all 0.4s ease',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: currentPage === 'home' ? '#ffffff' : '#cbd5e1',
              boxShadow: currentPage === 'home' 
                ? '0 4px 15px rgba(59, 130, 246, 0.4)' 
                : 'none',
              transform: currentPage === 'home' ? 'translateY(-1px)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => setCurrentPage('home')}
          >
            {currentPage === 'home' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 2s ease-in-out infinite'
              }}></div>
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>Home</span>
          </span>
          <span 
            style={{ 
              cursor: 'pointer', 
              padding: '12px 24px', 
              borderRadius: '12px', 
              background: currentPage === 'about' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              transition: 'all 0.4s ease',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: currentPage === 'about' ? '#ffffff' : '#cbd5e1',
              boxShadow: currentPage === 'about' 
                ? '0 4px 15px rgba(59, 130, 246, 0.4)' 
                : 'none',
              transform: currentPage === 'about' ? 'translateY(-1px)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => setCurrentPage('about')}
          >
            {currentPage === 'about' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 2s ease-in-out infinite'
              }}></div>
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>About</span>
          </span>
        </nav>
      </div>
    </header>
  );

  const Footer = () => (
    <footer style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      color: 'white',
      padding: '80px 0 30px',
      marginTop: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06d6a0, #f59e0b)',
        animation: 'gradientShift 4s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '4px',
        height: '4px',
        background: '#3b82f6',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '15%',
        width: '6px',
        height: '6px',
        background: '#8b5cf6',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '20%',
        width: '3px',
        height: '3px',
        background: '#06d6a0',
        borderRadius: '50%',
        animation: 'float 7s ease-in-out infinite'
      }}></div>
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '50px',
          marginBottom: '50px'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px'
              }}>LaneSight</h3>
              <div style={{
                width: '50px',
                height: '3px',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                borderRadius: '2px',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
            </div>
            <p style={{ color: '#cbd5e1', lineHeight: '1.8', fontSize: '1rem', marginBottom: '0' }}>
  Professional computer vision lane detection system with advanced image processing algorithms, real-time vehicle tracking, and intelligent road analysis for automotive safety applications.
            </p>
          </div>
          
          <div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              marginBottom: '25px', 
              color: '#06d6a0', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: '#06d6a0',
                borderRadius: '50%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></span>
              Tech Stack
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {['React.js', 'FastAPI', 'OpenCV', 'Python'].map((tech, index) => (
                <div key={tech} style={{
                  background: 'linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(59, 130, 246, 0.1))',
                  color: '#06d6a0',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  border: '1px solid rgba(6, 214, 160, 0.2)',
                  textAlign: 'center',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}>{tech}</div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ 
              fontSize: '1.3rem', 
              marginBottom: '25px', 
              color: '#f59e0b', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: '#f59e0b',
                borderRadius: '50%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></span>
              Key Features
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {['Real-time Lane Departure Warning', 'Professional Computer Vision Analysis', 'Advanced Image Processing Algorithms', 'Curvature-based Road Detection'].map((feature, index) => (
                <div key={feature} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  padding: '8px 0',
                  transition: 'all 0.3s ease',
                  animation: `slideInLeft 0.6s ease-out ${index * 0.1}s both`
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
                    borderRadius: '50%',
                    animation: 'glow 2s ease-in-out infinite'
                  }}></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Social Media Icons */}
        <div style={{
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <a 
              href="https://www.linkedin.com/in/abhishek-giri04/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0077b5 0%, #005885 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 119, 181, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            
            <a 
              href="https://github.com/abhishekgiri04" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #333 0%, #24292e 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(51, 51, 51, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            
            <a 
              href="https://t.me/AbhishekGiri7" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 136, 204, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </a>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          paddingTop: '30px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.5)',
          margin: '0 -20px',
          padding: '30px 20px',
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <p style={{ 
              margin: 0, 
              color: '#94a3b8', 
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              © 2025 <span style={{ color: '#3b82f6', fontWeight: '700' }}>LaneSight Vision AI</span>
            </p>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Powered by</span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  color: '#3b82f6', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>React</span>
                <span style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  color: '#22c55e', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>OpenCV</span>
                <span style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  color: '#8b5cf6', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>FastAPI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  const HomePage = () => (
    <div style={{ 
      padding: '40px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
        borderRadius: '25px',
        padding: '80px 40px',
        textAlign: 'center',
        marginBottom: '50px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 100px rgba(30, 58, 138, 0.4)'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)',
          animation: 'slideRight 3s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '80px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
          animation: 'slideLeft 4s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '120px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
          animation: 'slideRight 5s ease-in-out infinite'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ 
            fontSize: '3.8rem', 
            fontWeight: '800', 
            background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '25px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            LaneSight Vision AI
          </h1>
          <p style={{ 
            fontSize: '1.4rem', 
            color: '#e0e7ff', 
            marginBottom: '50px',
            maxWidth: '700px',
            margin: '0 auto 50px',
            fontWeight: '400'
          }}>
            Professional Lane Detection with Advanced Computer Vision & AI
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '25px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'rgba(96, 165, 250, 0.15)',
              padding: '30px 20px',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚠️</div>
              <h3 style={{ color: '#60a5fa', margin: '0 0 8px 0', fontSize: '1.2rem' }}>LDW System</h3>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.95rem' }}>Real-time Lane Departure Warnings</p>
            </div>
            <div style={{
              background: 'rgba(52, 211, 153, 0.15)',
              padding: '30px 20px',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🌀</div>
              <h3 style={{ color: '#34d399', margin: '0 0 8px 0', fontSize: '1.2rem' }}>Road Analysis</h3>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.95rem' }}>Straight & Curved Road Detection</p>
            </div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              padding: '30px 20px',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🧠</div>
              <h3 style={{ color: '#f59e0b', margin: '0 0 8px 0', fontSize: '1.2rem' }}>Computer Vision</h3>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.95rem' }}>Advanced Image Processing</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '50px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        marginBottom: '40px',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
            AI Processing Center
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Upload road videos for advanced computer vision analysis and lane detection</p>
        </div>
        
        <div style={{
          border: '3px dashed #6366f1',
          borderRadius: '20px',
          padding: '50px',
          textAlign: 'center',
          background: file ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))' : 'linear-gradient(135deg, rgba(148, 163, 184, 0.03), rgba(203, 213, 225, 0.05))',
          transition: 'all 0.4s ease',
          marginBottom: '35px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)',
            animation: file ? 'pulse 2s infinite' : 'none'
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '20px'
            }}>📁</div>
            <input 
              type="file" 
              accept=".mp4,.avi,.mov" 
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="fileInput"
            />
            <label 
              htmlFor="fileInput"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                marginBottom: '20px',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                border: 'none'
              }}
            >
              Choose Video File
            </label>
            <p style={{ color: '#64748b', margin: '0', fontSize: '1rem', fontWeight: '500' }}>
              {file ? `✅ Selected: ${file.name}` : 'Drag & drop or click to select • MP4, AVI, MOV'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleUpload}
            disabled={!file}
            style={{
              padding: '18px 36px',
              background: !file ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: !file ? '#94a3b8' : 'white',
              border: !file ? '2px solid #e2e8f0' : 'none',
              borderRadius: '16px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: !file ? 'not-allowed' : 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: !file ? 'none' : '0 8px 30px rgba(245, 158, 11, 0.4)',
              transform: !file ? 'none' : 'translateY(-2px)',
              minWidth: '180px'
            }}
          >
            Upload Video
          </button>
          <button 
            onClick={handleProcess}
            disabled={!uploadedFileName || processing}
            style={{
              padding: '18px 36px',
              background: (!uploadedFileName || processing) ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: (!uploadedFileName || processing) ? '#94a3b8' : 'white',
              border: (!uploadedFileName || processing) ? '2px solid #e2e8f0' : 'none',
              borderRadius: '16px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: (!uploadedFileName || processing) ? 'not-allowed' : 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: (!uploadedFileName || processing) ? 'none' : '0 8px 30px rgba(139, 92, 246, 0.4)',
              transform: (!uploadedFileName || processing) ? 'none' : 'translateY(-2px)',
              minWidth: '180px'
            }}
          >
            {processing ? 'Processing...' : 'Start Detection'}
          </button>
        </div>
        
        {uploadedFileName && (
          <div style={{
            marginTop: '25px',
            padding: '15px 20px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '1px solid #22c55e',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#15803d', margin: 0, fontWeight: '500' }}>
              ✅ Successfully uploaded: <strong>{uploadedFileName}</strong>
            </p>
          </div>
        )}
        
        {processing && (
          <div style={{
            marginTop: '30px',
            padding: '40px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
              animation: 'slideRight 2s ease-in-out infinite'
            }}></div>
            
            {/* Main Spinner */}
            <div style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '25px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid rgba(59, 130, 246, 0.3)',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                position: 'relative'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '50px',
                height: '50px',
                border: '3px solid rgba(139, 92, 246, 0.3)',
                borderBottom: '3px solid #8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1.5s linear infinite reverse'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
            </div>
            
            {/* Processing Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '12px',
                  height: '12px',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
                }}></div>
              ))}
            </div>
            
            <h3 style={{ 
              color: '#ffffff', 
              margin: '0 0 15px 0', 
              fontSize: '1.4rem',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>AI Processing</h3>
            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '1.1rem' }}>Neural networks analyzing lane boundaries and vehicle position...</p>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '2px',
              marginTop: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '60%',
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '2px',
                animation: 'progress 3s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        )}
      </div>

      {outputVideo && (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '50px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '10px' }}>🎬 AI Analysis Complete</h3>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Computer vision analysis completed with lane detection and vehicle tracking</p>

          </div>
          

          
          <div style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
            border: '2px solid #22c55e',
            boxShadow: '0 10px 30px rgba(34, 197, 94, 0.2)'
          }}>
            <video 
              width="100%" 
              height="500"
              controls
              muted
              preload="auto"
              style={{ 
                borderRadius: '12px',
                backgroundColor: '#000'
              }}
            >
              <source src={`http://localhost:8000/download-video?t=${Date.now()}`} type="video/mp4" />
              Video not supported
            </video>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={handleDownload}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Download Processed Video
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const AboutPage = () => (
    <div style={{ 
      minHeight: '100vh',
      padding: '60px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite reverse'
      }}></div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '80px',
          padding: '60px 40px',
          background: 'rgba(0, 0, 0, 0.85)',
          borderRadius: '30px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: '800',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06d6a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '30px'
          }}>
            About LaneSight Vision AI
          </h1>
          <p style={{ 
            fontSize: '1.4rem', 
            color: '#cbd5e1', 
            lineHeight: '1.8',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Professional lane detection system with real-time video processing, advanced computer vision algorithms, and mathematical analysis for automotive safety applications.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px',
          marginBottom: '80px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '40px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ 
              fontSize: '1.8rem', 
              color: '#3b82f6', 
              marginBottom: '20px',
              fontWeight: '700'
            }}>Real-Time Processing</h3>
            <p style={{ 
              color: '#e2e8f0', 
              fontSize: '1.1rem', 
              lineHeight: '1.7'
            }}>
              LaneSight processes uploaded videos with computer vision lane detection algorithms. Features include straight and curved road recognition, real-time vehicle position tracking, lane departure warnings with flashing alerts, and adaptive analysis for various lighting conditions.
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '40px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ 
              fontSize: '1.8rem', 
              color: '#e47027ff', 
              marginBottom: '20px',
              fontWeight: '700'
            }}>Video Analysis</h3>
            <p style={{ 
              color: '#e2e8f0', 
              fontSize: '1.1rem', 
              lineHeight: '1.7'
            }}>
              Upload MP4/AVI/MOV videos for computer vision processing. System outputs processed videos with short yellow tracking dashes, lane area overlays, departure warnings, and curvature analysis. Supports various road conditions with optimized H264 encoding for web delivery.
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '60px 40px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          marginBottom: '80px'
        }}>
          <h2 style={{ 
            textAlign: 'center',
            fontSize: '2.5rem', 
            color: '#06d6a0', 
            marginBottom: '50px',
            fontWeight: '700'
          }}>Technology Stack</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            {[
              { name: 'React.js', desc: 'Interactive Web Interface', color: '#61dafb', icon: '⚛️' },
              { name: 'FastAPI', desc: 'Video Processing API', color: '#009688', icon: '🚀' },
              { name: 'OpenCV', desc: 'Computer Vision Engine', color: '#5c85d6', icon: '🎨' },
              { name: 'Python', desc: 'Backend Processing', color: '#3776ab', icon: '🐍' },
              { name: 'NumPy', desc: 'Mathematical Algorithms', color: '#013243', icon: '🧩' },
              { name: 'HLS/HSV/LAB', desc: 'Color Space Analysis', color: '#ff6b6b', icon: '🌈' }
            ].map((tech, index) => (
              <div key={tech.name} style={{
                background: `rgba(${parseInt(tech.color.slice(1,3), 16)}, ${parseInt(tech.color.slice(3,5), 16)}, ${parseInt(tech.color.slice(5,7), 16)}, 0.1)`,
                padding: '30px 25px',
                borderRadius: '20px',
                border: `1px solid rgba(${parseInt(tech.color.slice(1,3), 16)}, ${parseInt(tech.color.slice(3,5), 16)}, ${parseInt(tech.color.slice(5,7), 16)}, 0.3)`,
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{tech.icon}</div>
                <h4 style={{ color: tech.color, margin: '0 0 10px 0', fontSize: '1.3rem', fontWeight: '700' }}>{tech.name}</h4>
                <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.95rem' }}>{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '60px 40px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          marginBottom: '80px'
        }}>
          <h2 style={{ 
            textAlign: 'center',
            fontSize: '2.5rem', 
            color: '#f59e0b', 
            marginBottom: '50px',
            fontWeight: '700'
          }}>Professional Features ✨</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[
              { title: 'Video Upload & Processing', desc: 'Support for MP4, AVI, MOV formats with computer vision processing and H264 compression', icon: '📤' },
              { title: 'Short Yellow Dash Overlay', desc: 'Precise 2-4 pixel yellow tracking dashes that follow detected lane markings', icon: '🛣️' },
              { title: 'Real-time Position Tracking', desc: 'Curvature-based offset calculation with adaptive lane departure thresholds', icon: '🚙' },
              { title: 'Adaptive Road Analysis', desc: 'RANSAC polynomial fitting with straight/curved road detection and smoothing', icon: '🌀' },
              { title: 'Professional Output', desc: 'H264 encoded video with lane overlays, confidence metrics, and curvature display', icon: '💾' },
              { title: 'Advanced UI', desc: 'React-based interface with real-time confidence, curvature radius, and processing status', icon: '🖥️' }
            ].map((feature, index) => (
              <div key={feature.title} style={{
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '15px' }}>{feature.icon}</div>
                <h4 style={{ color: '#f59e0b', margin: '0 0 15px 0', fontSize: '1.3rem', fontWeight: '700' }}>{feature.title}</h4>
                <p style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'rgba(0, 0, 0, 0.85)',
          borderRadius: '30px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: '20px',
            fontWeight: '700'
          }}>Ready to Experience LaneSight ?</h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#cbd5e1', 
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Upload your road videos and get instant lane detection analysis with downloadable processed results.
          </p>
          <button 
            onClick={() => setCurrentPage('home')}
            style={{
              padding: '18px 40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1.2rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            Try LaneSight Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundImage: currentPage === 'home' ? 'url(https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&h=1920&q=80)' : 'url(https://wallpaperbat.com/img/196485-hd-vertical-wallpaper.jpg)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes slideRight {
            0% { transform: translateX(-100px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(200px); opacity: 0; }
          }
          @keyframes slideLeft {
            0% { transform: translateX(100px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(-200px); opacity: 0; }
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            0% { opacity: 0; transform: translateX(-30px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
            50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes progressSlide {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <Header />
      <main style={{ flex: 1 }}>
        {currentPage === 'home' ? <HomePage /> : <AboutPage />}
      </main>
      <Footer />
    </div>
  );
}

export default App;