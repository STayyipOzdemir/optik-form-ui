import React, { useRef, useEffect, useState } from 'react';

const FormCanvas = ({ 
  processedImage, 
  contours, 
  showContours,
  bubbleInfo,
  originalImage,
  onContoursChange,
  selectedContourIndex,
  onContourSelect
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStartBounds, setResizeStartBounds] = useState(null);

  useEffect(() => {
    if (!processedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      if (showContours && contours.length > 0) {
        contours.forEach((contour, index) => {
          // Seçili kontur için farklı renk
          if (index === selectedContourIndex) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
          } else {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
          }
          
          ctx.strokeRect(contour.x, contour.y, contour.width, contour.height);
          
          // Kontur numarası
          ctx.fillStyle = index === selectedContourIndex ? '#ff0000' : '#00ff00';
          ctx.font = '20px Arial';
          ctx.fillText(
            (index + 1).toString(),
            contour.x + 10,
            contour.y + 30
          );

          // Seçili kontur için resize handle'ları çiz
          if (index === selectedContourIndex) {
            drawResizeHandles(ctx, contour);
          }
        });

        // Güvenli bubbleInfo kontrolü
        if (bubbleInfo && typeof bubbleInfo.avgDiameter === 'number' && !isNaN(bubbleInfo.avgDiameter)) {
          const firstContour = contours[0];
          const labelY = firstContour.y < 20 ? firstContour.y + firstContour.height + 20 : firstContour.y - 10;
          
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px Arial';
          ctx.fillText(
            `avg = ${bubbleInfo.avgDiameter.toFixed(1)}px`,
            firstContour.x,
            labelY
          );
        }
      }
    };
    
    img.src = processedImage;
  }, [processedImage, contours, showContours, bubbleInfo, selectedContourIndex]);

  const drawResizeHandles = (ctx, contour) => {
    const handleSize = 10;
    const handles = [
      { x: contour.x - handleSize/2, y: contour.y - handleSize/2, type: 'nw' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y - handleSize/2, type: 'ne' },
      { x: contour.x - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 'sw' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 'se' },
      { x: contour.x + contour.width/2 - handleSize/2, y: contour.y - handleSize/2, type: 'n' },
      { x: contour.x + contour.width/2 - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 's' },
      { x: contour.x - handleSize/2, y: contour.y + contour.height/2 - handleSize/2, type: 'w' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y + contour.height/2 - handleSize/2, type: 'e' }
    ];

    // Handle arka planı
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 2;
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const isPointInContour = (x, y, contour) => {
    return x >= contour.x && x <= contour.x + contour.width &&
           y >= contour.y && y <= contour.y + contour.height;
  };

  const getResizeHandle = (x, y, contour) => {
    const handleSize = 10;
    const handles = [
      { x: contour.x - handleSize/2, y: contour.y - handleSize/2, type: 'nw' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y - handleSize/2, type: 'ne' },
      { x: contour.x - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 'sw' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 'se' },
      { x: contour.x + contour.width/2 - handleSize/2, y: contour.y - handleSize/2, type: 'n' },
      { x: contour.x + contour.width/2 - handleSize/2, y: contour.y + contour.height - handleSize/2, type: 's' },
      { x: contour.x - handleSize/2, y: contour.y + contour.height/2 - handleSize/2, type: 'w' },
      { x: contour.x + contour.width - handleSize/2, y: contour.y + contour.height/2 - handleSize/2, type: 'e' }
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize &&
          y >= handle.y && y <= handle.y + handleSize) {
        return handle.type;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    if (!showContours || contours.length === 0) return;

    const pos = getCanvasMousePos(e);
    
    // Önce seçili konturun resize handle'larını kontrol et
    if (selectedContourIndex !== null) {
      const selectedContour = contours[selectedContourIndex];
      const handle = getResizeHandle(pos.x, pos.y, selectedContour);
      
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart(pos);
        setResizeStartBounds({
          x: selectedContour.x,
          y: selectedContour.y,
          width: selectedContour.width,
          height: selectedContour.height
        });
        return;
      }
    }

    // Kontur seçimi
    for (let i = contours.length - 1; i >= 0; i--) {
      if (isPointInContour(pos.x, pos.y, contours[i])) {
        onContourSelect(i);
        setIsDragging(true);
        setDragStart({
          x: pos.x - contours[i].x,
          y: pos.y - contours[i].y
        });
        return;
      }
    }

    // Hiçbir kontur seçilmedi
    onContourSelect(null);
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasMousePos(e);

    if (isResizing && selectedContourIndex !== null && resizeHandle && resizeStartBounds) {
      const newContours = [...contours];
      const contour = { ...newContours[selectedContourIndex] };
      
      // Mouse pozisyonu ile başlangıç pozisyonu arasındaki fark
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;

      // Başlangıç sınırlarından yeni sınırları hesapla
      let newX = resizeStartBounds.x;
      let newY = resizeStartBounds.y;
      let newWidth = resizeStartBounds.width;
      let newHeight = resizeStartBounds.height;

      switch (resizeHandle) {
        case 'nw': // Sol üst köşe
          newX = resizeStartBounds.x + deltaX;
          newY = resizeStartBounds.y + deltaY;
          newWidth = resizeStartBounds.width - deltaX;
          newHeight = resizeStartBounds.height - deltaY;
          break;
        case 'ne': // Sağ üst köşe
          newY = resizeStartBounds.y + deltaY;
          newWidth = resizeStartBounds.width + deltaX;
          newHeight = resizeStartBounds.height - deltaY;
          break;
        case 'sw': // Sol alt köşe
          newX = resizeStartBounds.x + deltaX;
          newWidth = resizeStartBounds.width - deltaX;
          newHeight = resizeStartBounds.height + deltaY;
          break;
        case 'se': // Sağ alt köşe
          newWidth = resizeStartBounds.width + deltaX;
          newHeight = resizeStartBounds.height + deltaY;
          break;
        case 'n': // Üst kenar
          newY = resizeStartBounds.y + deltaY;
          newHeight = resizeStartBounds.height - deltaY;
          break;
        case 's': // Alt kenar
          newHeight = resizeStartBounds.height + deltaY;
          break;
        case 'w': // Sol kenar
          newX = resizeStartBounds.x + deltaX;
          newWidth = resizeStartBounds.width - deltaX;
          break;
        case 'e': // Sağ kenar
          newWidth = resizeStartBounds.width + deltaX;
          break;
      }

      // Minimum boyut kontrolü
      if (newWidth < 20) {
        if (resizeHandle.includes('w')) {
          newX = resizeStartBounds.x + resizeStartBounds.width - 20;
        }
        newWidth = 20;
      }
      if (newHeight < 20) {
        if (resizeHandle.includes('n')) {
          newY = resizeStartBounds.y + resizeStartBounds.height - 20;
        }
        newHeight = 20;
      }

      // Canvas sınırları kontrolü
      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }
      if (newX + newWidth > canvasRef.current.width) {
        newWidth = canvasRef.current.width - newX;
      }
      if (newY + newHeight > canvasRef.current.height) {
        newHeight = canvasRef.current.height - newY;
      }

      contour.x = newX;
      contour.y = newY;
      contour.width = newWidth;
      contour.height = newHeight;

      newContours[selectedContourIndex] = contour;
      onContoursChange(newContours);
    } else if (isDragging && selectedContourIndex !== null) {
      const newContours = [...contours];
      const contour = { ...newContours[selectedContourIndex] };
      
      contour.x = pos.x - dragStart.x;
      contour.y = pos.y - dragStart.y;

      // Canvas sınırları kontrolü
      if (contour.x < 0) contour.x = 0;
      if (contour.y < 0) contour.y = 0;
      if (contour.x + contour.width > canvasRef.current.width) {
        contour.x = canvasRef.current.width - contour.width;
      }
      if (contour.y + contour.height > canvasRef.current.height) {
        contour.y = canvasRef.current.height - contour.height;
      }

      newContours[selectedContourIndex] = contour;
      onContoursChange(newContours);
    } else {
      // Cursor değiştirme
      let cursor = 'default';
      
      if (selectedContourIndex !== null) {
        const selectedContour = contours[selectedContourIndex];
        const handle = getResizeHandle(pos.x, pos.y, selectedContour);
        
        if (handle) {
          switch (handle) {
            case 'nw':
            case 'se':
              cursor = 'nwse-resize';
              break;
            case 'ne':
            case 'sw':
              cursor = 'nesw-resize';
              break;
            case 'n':
            case 's':
              cursor = 'ns-resize';
              break;
            case 'w':
            case 'e':
              cursor = 'ew-resize';
              break;
          }
        } else if (isPointInContour(pos.x, pos.y, selectedContour)) {
          cursor = 'move';
        }
      } else {
        for (const contour of contours) {
          if (isPointInContour(pos.x, pos.y, contour)) {
            cursor = 'pointer';
            break;
          }
        }
      }
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = cursor;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartBounds(null);
  };

  // Güvenli sayı gösterimi için yardımcı fonksiyon
  const safeNumber = (value, decimals = 1) => {
    return (typeof value === 'number' && !isNaN(value)) ? value.toFixed(decimals) : '0.0';
  };

  return (
    <div style={{
      flex: 1,
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Orijinal Görüntü - Sadece işleme yapılmamışsa göster */}
      {originalImage && !processedImage && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            Orijinal Görüntü
          </h3>
          <img
            src={originalImage}
            alt="Original"
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem',
            border: '1px solid #3b82f6'
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#1e40af',
              textAlign: 'center',
              margin: 0
            }}>
              👆 "Konturları Algıla" butonuna basarak görüntüyü işleyin
            </p>
          </div>
        </div>
      )}

      {/* İşlenmiş Görüntü - Sadece işleme yapıldıktan sonra göster */}
      {processedImage && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            İşlenmiş Görüntü
            {selectedContourIndex !== null && (
              <span style={{
                marginLeft: '1rem',
                fontSize: '1rem',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                (Seçili: Kontur {selectedContourIndex + 1})
              </span>
            )}
          </h3>
          
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'white'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {/* Kullanım Talimatları */}
          {showContours && contours.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.5rem',
              border: '1px solid #f59e0b'
            }}>
              <h4 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '0.5rem'
              }}>
                👆 Kullanım Talimatları:
              </h4>
              <div style={{
                fontSize: '0.8rem',
                color: '#92400e'
              }}>
                <p>• Bir konturu seçmek için üzerine tıklayın</p>
                <p>• Seçili konturu taşımak için içinden sürükleyin</p>
                <p>• <strong>Beyaz kareleri sürükleyerek boyutlandırın</strong></p>
                <p>• Köşe kareleri: çapraz boyutlandırma</p>
                <p>• Kenar kareleri: tek yönlü boyutlandırma</p>
                <p>• Seçimi kaldırmak için boş alana tıklayın</p>
              </div>
            </div>
          )}
          
          {/* Sonuçlar */}
          {contours.length > 0 && (
            <div style={{
              marginTop: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                Yeşil Kutu Koordinatları ({contours.length} adet):
              </h4>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {contours.map((contour, index) => (
                  <div 
                    key={index} 
                    style={{
                      backgroundColor: selectedContourIndex === index ? '#fef2f2' : 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: selectedContourIndex === index ? '2px solid #dc2626' : '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => onContourSelect(index)}
                    onMouseEnter={(e) => {
                      if (selectedContourIndex !== index) {
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedContourIndex !== index) {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{
                      fontWeight: '600',
                      color: selectedContourIndex === index ? '#dc2626' : '#1f2937',
                      marginBottom: '0.75rem'
                    }}>
                      {index + 1}. Yeşil Kutu Koordinatları:
                      {selectedContourIndex === index && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: '#dc2626'
                        }}>
                          (SEÇİLİ)
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem'
                    }}>
                      <div style={{ padding: '0.25rem 0' }}>
                        top left: ({Math.round(contour.x)}, {Math.round(contour.y)})
                      </div>
                      <div style={{ padding: '0.25rem 0' }}>
                        top right: ({Math.round(contour.x + contour.width)}, {Math.round(contour.y)})
                      </div>
                      <div style={{ padding: '0.25rem 0' }}>
                        bottom left: ({Math.round(contour.x)}, {Math.round(contour.y + contour.height)})
                      </div>
                      <div style={{ padding: '0.25rem 0' }}>
                        bottom right: ({Math.round(contour.x + contour.width)}, {Math.round(contour.y + contour.height)})
                      </div>
                      
                      {index === 0 && bubbleInfo && bubbleInfo.count > 0 && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #e5e7eb',
                          gridColumn: '1 / -1'
                        }}>
                          <div style={{
                            color: '#2563eb',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            🔵 Baloncuk Analizi:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.25rem',
                            fontSize: '0.8rem',
                            color: '#2563eb'
                          }}>
                            <div>Toplam: {bubbleInfo.count || 0} adet</div>
                            <div>Ort. çap: {safeNumber(bubbleInfo.avgDiameter)} px</div>
                            <div>Ort. mesafe: {safeNumber(bubbleInfo.avgDistance)} px</div>
                            <div>Yoğunluk: {safeNumber(bubbleInfo.density, 2)}/10k px²</div>
                            <div>Min çap: {safeNumber(bubbleInfo.minDiameter)} px</div>
                            <div>Max çap: {safeNumber(bubbleInfo.maxDiameter)} px</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormCanvas;