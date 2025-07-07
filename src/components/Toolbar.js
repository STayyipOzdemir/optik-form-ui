import React from 'react';
import { Eye, EyeOff, Zap, Download, Trash2, RotateCcw, Plus } from 'lucide-react';

const Toolbar = ({ 
  onProcess, 
  onToggleContours, 
  showContours, 
  isProcessing, 
  hasImage,
  onDownload,
  selectedContourIndex,
  contours,
  onDeleteContour,
  onResetContours,
  onAddContour,
  hasProcessedImage
}) => {
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    width: '100%'
  };

  const disabledStyle = {
    opacity: 0.6,
    cursor: 'not-allowed'
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Araçlar
      </h3>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* İşleme Butonu */}
        {hasImage && (
          <button
            onClick={onProcess}
            disabled={isProcessing}
            style={{
              ...buttonStyle,
              backgroundColor: '#16a34a',
              color: 'white',
              ...(isProcessing ? disabledStyle : {})
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#15803d';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#16a34a';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isProcessing ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                İşleniyor...
              </>
            ) : (
              <>
                <Zap size={16} />
                Konturları Algıla
              </>
            )}
          </button>
        )}

        {/* Kontur Görünürlük */}
        <button
          onClick={onToggleContours}
          style={{
            ...buttonStyle,
            backgroundColor: '#9333ea',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7c3aed';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#9333ea';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {showContours ? (
            <>
              <EyeOff size={16} />
              Konturları Gizle
            </>
          ) : (
            <>
              <Eye size={16} />
              Konturları Göster
            </>
          )}
        </button>

        {/* Yeni Kontur Ekleme */}
        {hasProcessedImage && (
          <button
            onClick={onAddContour}
            style={{
              ...buttonStyle,
              backgroundColor: '#059669',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#047857';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            Yeni Kontur Ekle
          </button>
        )}

        {/* Seçili Kontur İşlemleri */}
        {selectedContourIndex !== null && contours && contours.length > 0 && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '2px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Seçili Kontur: {selectedContourIndex + 1}
            </h4>

            {/* Kontur Silme */}
            <button
              onClick={() => onDeleteContour(selectedContourIndex)}
              style={{
                ...buttonStyle,
                backgroundColor: '#ef4444',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Trash2 size={16} />
              Seçili Konturu Sil
            </button>
          </div>
        )}

        {/* Kontur Sıfırlama */}
        {contours && contours.length > 0 && (
          <button
            onClick={onResetContours}
            style={{
              ...buttonStyle,
              backgroundColor: '#f59e0b',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d97706';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f59e0b';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RotateCcw size={16} />
            Konturları Sıfırla
          </button>
        )}

        {/* İndirme Butonu */}
        {hasImage && (
          <button
            onClick={onDownload}
            style={{
              ...buttonStyle,
              backgroundColor: '#ea580c',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c2410c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ea580c';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download size={16} />
            Görüntüyü İndir
          </button>
        )}


      </div>

      {/* Bilgi Paneli */}
      {hasImage && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Bilgiler
          </h4>
          <div style={{
            fontSize: '0.8rem',
            color: '#6b7280'
          }}>
            <p>• Konturlar yeşil çerçevelerle gösterilir</p>
            <p>• Baloncuklar kırmızı çemberlerle işaretlenir</p>
            <p>• Koordinatlar alt panelde listelenir</p>
            <p>• Konturlara tıklayarak seçim yapabilirsiniz</p>
            <p>• Seçili konturları beyaz kareler ile boyutlandırın</p>
            <p>• "Yeni Kontur Ekle" ile manuel kontur oluşturun</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;