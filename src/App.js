import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import FormCanvas from './components/FormCanvas';
import Toolbar from './components/Toolbar';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [contours, setContours] = useState([]);
  const [originalContours, setOriginalContours] = useState([]);
  const [showContours, setShowContours] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState(null);
  const [selectedContourIndex, setSelectedContourIndex] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
      }
    };
    document.body.appendChild(script);
  
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setProcessedImage(null);
    setContours([]);
    setOriginalContours([]);
    setBubbleInfo(null);
    setSelectedContourIndex(null);
  
    if (file.type === 'application/pdf') {
      const imageDataUrl = await convertPdfToImage(file);
      if (imageDataUrl) {
        setOriginalImage(imageDataUrl);
      } else {
        alert('PDF dosyası görüntüye dönüştürülemedi.');
        setOriginalImage(null);
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Desteklenmeyen dosya türü. Lütfen bir resim (JPG, PNG) veya PDF dosyası seçin.');
      setOriginalImage(null);
    }
  };

  // PDF'i görüntüye dönüştürme fonksiyonu
  const convertPdfToImage = async (pdfFile) => {
    if (!window.pdfjsLib) {
      console.error('PDF.js kütüphanesi yüklenmedi.');
      return null;
    }
  
    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // İlk sayfayı al
  
      const viewport = page.getViewport({ scale: 1.5 }); // Ölçeklendirme ayarı
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
  
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
  
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // JPG olarak dönüştür
      return imageDataUrl;
    } catch (error) {
      console.error('PDF dönüştürme hatası:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Kontur seçimi
  const handleContourSelect = (index) => {
    setSelectedContourIndex(index);
  };

  // Kontur silme
  const handleDeleteContour = (index) => {
    const newContours = contours.filter((_, i) => i !== index);
    setContours(newContours);
    
    // Seçili kontur silinirse seçimi kaldır
    if (index === selectedContourIndex) {
      setSelectedContourIndex(null);
    } else if (index < selectedContourIndex) {
      // Silinen kontur seçili konturun önündeyse, index'i güncelle
      setSelectedContourIndex(selectedContourIndex - 1);
    }
  };

  // Konturları sıfırla
  const handleResetContours = () => {
    setContours([...originalContours]);
    setSelectedContourIndex(null);
  };

  // Kontur değişikliklerini güncelle
  const handleContoursChange = (newContours) => {
    setContours(newContours);
  };

  // Yeni kontur ekleme
  const handleAddContour = () => {
    if (!processedImage) return;
    
    // Canvas boyutlarını tahmin et (varsayılan olarak merkez)
    const canvasWidth = 800; // Tahmini canvas genişliği
    const canvasHeight = 600; // Tahmini canvas yüksekliği
    
    const newContour = {
      x: canvasWidth / 2 - 60, // Merkez - 60px
      y: canvasHeight / 2 - 40, // Merkez - 40px
      width: 120,
      height: 80,
      area: 9600,
      points: [] // Boş points array
    };
    
    const newContours = [...contours, newContour];
    setContours(newContours);
    setSelectedContourIndex(newContours.length - 1); // Yeni konturu seç
  };

  // İndirme fonksiyonu
  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.download = 'numbered_frames_fixed.jpg';
    link.href = processedImage;
    link.click();
    
    console.log('✅ Numaralı çerçeveler indirildi');
  };

  // Adaptive Threshold (Python kodundaki cv2.adaptiveThreshold benzeri)
  const adaptiveThreshold = (grayData, width, height, blockSize = 31, C = 10) => {
    const binaryData = new Uint8ClampedArray(grayData.length);
    const halfBlock = Math.floor(blockSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        let sum = 0;
        let count = 0;
        
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const ni = (ny * width + nx) * 4;
              sum += grayData[ni];
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const threshold = mean - C;
        
        if (grayData[i] > threshold) {
          binaryData[i] = 255;
          binaryData[i + 1] = 255;
          binaryData[i + 2] = 255;
        } else {
          binaryData[i] = 0;
          binaryData[i + 1] = 0;
          binaryData[i + 2] = 0;
        }
        binaryData[i + 3] = 255;
      }
    }
    
    return binaryData;
  };

  // Binary görüntüyü tersine çevir (Python kodundaki cv2.bitwise_not)
  const bitwiseNot = (binaryData) => {
    const inverted = new Uint8ClampedArray(binaryData.length);
    
    for (let i = 0; i < binaryData.length; i += 4) {
      inverted[i] = 255 - binaryData[i];
      inverted[i + 1] = 255 - binaryData[i + 1];
      inverted[i + 2] = 255 - binaryData[i + 2];
      inverted[i + 3] = binaryData[i + 3];
    }
    
    return inverted;
  };

  // Kontur bulma (Python kodundaki cv2.findContours benzeri)
  const findContours = (binaryData, width, height) => {
    const visited = new Set();
    const foundContours = [];
    
    const minAreaGeneral = 0.015 * width * height;
    const maxArea = 0.95 * width * height;
    const minAreaSmallbox = 0.001 * width * height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        
        const i = (y * width + x) * 4;
        if (binaryData[i] > 128) {
          const contour = traceContour(binaryData, width, height, x, y, visited);
          
          if (contour) {
            const area = contour.width * contour.height;
            
            if (area >= minAreaGeneral && area <= maxArea) {
              foundContours.push(contour);
            } else if (area >= minAreaSmallbox && area <= minAreaGeneral) {
              if (contour.y < height * 0.25) {
                foundContours.push(contour);
              }
            }
          }
        }
      }
    }
    
    return foundContours.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  };

  // Kontur izleme
  const traceContour = (binaryData, width, height, startX, startY, visited) => {
    const queue = [[startX, startY]];
    const contourPoints = [];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const i = (y * width + x) * 4;
      if (binaryData[i] < 128) continue;
      
      visited.add(key);
      contourPoints.push([x, y]);
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          queue.push([x + dx, y + dy]);
        }
      }
    }
    
    if (contourPoints.length > 50) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        area: (maxX - minX) * (maxY - minY),
        points: contourPoints
      };
    }
    
    return null;
  };

  // HoughCircles (Baloncuk algılama)
  const houghCircles = (grayData, width, height, roiX, roiY, roiWidth, roiHeight) => {
    const circles = [];
    const minRadius = 4;
    const maxRadius = 12;
    const minDist = 12;
    
    for (let r = minRadius; r <= maxRadius; r++) {
      for (let cy = roiY + r; cy < roiY + roiHeight - r; cy += 2) {
        for (let cx = roiX + r; cx < roiX + roiWidth - r; cx += 2) {
          let score = 0;
          let edgeCount = 0;
          
          for (let angle = 0; angle < 360; angle += 10) {
            const rad = (angle * Math.PI) / 180;
            const x = Math.round(cx + r * Math.cos(rad));
            const y = Math.round(cy + r * Math.sin(rad));
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const i = (y * width + x) * 4;
              
              const dx = x + 1 < width ? grayData[((y * width + x + 1) * 4)] - grayData[i] : 0;
              const dy = y + 1 < height ? grayData[((y + 1) * width + x) * 4] - grayData[i] : 0;
              const gradient = Math.sqrt(dx * dx + dy * dy);
              
              if (gradient > 30) {
                score += gradient;
                edgeCount++;
              }
            }
          }
          
          if (edgeCount > 15 && score > 800) {
            let tooClose = false;
            for (const existingCircle of circles) {
              const dist = Math.sqrt((cx - existingCircle.x) ** 2 + (cy - existingCircle.y) ** 2);
              if (dist < minDist) {
                tooClose = true;
                break;
              }
            }
            
            if (!tooClose) {
              circles.push({ x: cx, y: cy, r: r, score: score });
            }
          }
        }
      }
    }
    
    return circles.sort((a, b) => b.score - a.score).slice(0, 20);
  };

  // Median blur
  const medianBlur = (grayData, width, height, kernelSize = 5) => {
    const blurred = new Uint8ClampedArray(grayData.length);
    const half = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const values = [];
        
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const ni = (ny * width + nx) * 4;
              values.push(grayData[ni]);
            }
          }
        }
        
        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)];
        
        blurred[i] = median;
        blurred[i + 1] = median;
        blurred[i + 2] = median;
        blurred[i + 3] = grayData[i + 3];
      }
    }
    
    return blurred;
  };

  // Ana görüntü işleme fonksiyonu
  const processImage = async () => {
    if (!originalImage) {
      console.error('İşlenecek görüntü yok.');
      return;
    }

    setIsProcessing(true);

    try {
      // Promise ile image yükleme işlemini sarmalayalım
      const result = await new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Gri tonlamaya çevir
            const grayData = new Uint8ClampedArray(data.length);
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              grayData[i] = gray;
              grayData[i + 1] = gray;
              grayData[i + 2] = gray;
              grayData[i + 3] = data[i + 3];
            }
            
            // Adaptive threshold uygula
            const binaryData = adaptiveThreshold(grayData, canvas.width, canvas.height, 31, 10);
            
            // Binary görüntüyü tersine çevir
            const invertedData = bitwiseNot(binaryData);
            
            // Konturları bul
            const foundContours = findContours(invertedData, canvas.width, canvas.height);
            
            // Baloncuk araması (sadece ilk konturda)
            let bubbleData = null;
            if (foundContours.length > 0) {
              const firstContour = foundContours[0];
              
              // ROI için gri görüntüyü hazırla
              const roiGrayData = new Uint8ClampedArray(firstContour.width * firstContour.height * 4);
              for (let y = 0; y < firstContour.height; y++) {
                for (let x = 0; x < firstContour.width; x++) {
                  const srcIdx = ((firstContour.y + y) * canvas.width + (firstContour.x + x)) * 4;
                  const dstIdx = (y * firstContour.width + x) * 4;
                  
                  if (srcIdx >= 0 && srcIdx < grayData.length && dstIdx >= 0 && dstIdx < roiGrayData.length) {
                    roiGrayData[dstIdx] = grayData[srcIdx];
                    roiGrayData[dstIdx + 1] = grayData[srcIdx + 1];
                    roiGrayData[dstIdx + 2] = grayData[srcIdx + 2];
                    roiGrayData[dstIdx + 3] = grayData[srcIdx + 3];
                  }
                }
              }
              
              // Median blur uygula
              const blurredData = medianBlur(roiGrayData, firstContour.width, firstContour.height, 5);
              
              // Çemberleri bul
              const circles = houghCircles(blurredData, firstContour.width, firstContour.height, 0, 0, firstContour.width, firstContour.height);
              
              if (circles.length > 0) {
                const diameters = circles.map(c => c.r * 2);
                const avgDiameter = diameters.length > 0 ? 
                  diameters.reduce((a, b) => a + b, 0) / diameters.length : 0;
                
                // Baloncuklar arası mesafe hesaplama
                let totalDistance = 0;
                let distanceCount = 0;
                for (let i = 0; i < circles.length; i++) {
                  for (let j = i + 1; j < circles.length; j++) {
                    const dist = Math.sqrt(
                      Math.pow(circles[i].x - circles[j].x, 2) + 
                      Math.pow(circles[i].y - circles[j].y, 2)
                    );
                    totalDistance += dist;
                    distanceCount++;
                  }
                }
                const avgDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
                
                // Min ve max çap
                const minDiameter = Math.min(...diameters);
                const maxDiameter = Math.max(...diameters);
                
                // Yoğunluk hesaplama (10.000 piksel kare başına baloncuk sayısı)
                const area = firstContour.width * firstContour.height;
                const density = (circles.length / area) * 10000;
                
                bubbleData = {
                  count: circles.length,
                  avgDiameter: Number(avgDiameter) || 0,
                  avgDistance: Number(avgDistance) || 0,
                  minDiameter: Number(minDiameter) || 0,
                  maxDiameter: Number(maxDiameter) || 0,
                  density: Number(density) || 0,
                  circles: circles
                };
                
                // Baloncukları orijinal görüntüye çiz
                circles.forEach(circle => {
                  const globalX = firstContour.x + circle.x;
                  const globalY = firstContour.y + circle.y;
                  
                  // Kırmızı çember çiz
                  ctx.beginPath();
                  ctx.arc(globalX, globalY, circle.r, 0, 2 * Math.PI);
                  ctx.strokeStyle = '#ff0000';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                  
                  // Mavi merkez noktası
                  ctx.beginPath();
                  ctx.arc(globalX, globalY, 2, 0, 2 * Math.PI);
                  ctx.fillStyle = '#0000ff';
                  ctx.fill();
                });
              }
            }
            
            // İşlenmiş görüntüyü data URL olarak al
            const processedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Sonuçları resolve et
            resolve({
              contours: foundContours,
              processedImage: processedImageUrl,
              bubbleData: bubbleData
            });
            
          } catch (error) {
            console.error('İşleme hatası:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Görüntü yüklenemedi'));
        };
        
        // Görüntüyü yükle
        img.src = originalImage;
      });

      // State'leri güncelle (Promise tamamlandıktan sonra)
      setContours(result.contours);
      setOriginalContours([...result.contours]); // Orijinal konturları sakla
      setBubbleInfo(result.bubbleData);
      setProcessedImage(result.processedImage);
      setSelectedContourIndex(null); // Seçimi sıfırla
      
      // Konsola Python kodundaki gibi çıktı ver
      console.log('\n✅ Görüntü işleme tamamlandı');
      console.log(`📊 ${result.contours.length} kontur bulundu`);
      console.log('\nYeşil Kutu Koordinatları:');
      
      result.contours.forEach((contour, index) => {
        console.log(`\n${index + 1}. Yeşil Kutu Koordinatları:`);
        console.log(`top left: (${contour.x}, ${contour.y})`);
        console.log(`top right: (${contour.x + contour.width}, ${contour.y})`);
        console.log(`bottom left: (${contour.x}, ${contour.y + contour.height})`);
        console.log(`bottom right: (${contour.x + contour.width}, ${contour.y + contour.height})`);
        
        if (index === 0 && result.bubbleData && result.bubbleData.avgDiameter != null) {
          console.log(`  🔵 Bubbles found : ${result.bubbleData.count}`);
          console.log(`  📏 Avg diameter  : ${result.bubbleData.avgDiameter.toFixed(2)} px`);
        }
      });
      
    } catch (error) {
      console.error('❌ Görüntü işleme hatası:', error);
      alert('Görüntü işlenirken bir hata oluştu: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // CSS animasyonu ekleme ve dinamik stil ekleme
  useEffect(() => {
    const spinnerKeyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.innerHTML = spinnerKeyframes;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Başlık */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          Görüntü Konturu Algılayıcısı
        </h1>

        {/* Ana Layout */}
        {!originalImage ? (
          // Dosya yüklenmediyse - merkez layout
          <FileUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            accept="image/*,.pdf"
          />
        ) : (
          // Dosya yüklendiyse - yan yana layout
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-start'
          }}>
            {/* Sol taraf - Ana içerik */}
            <FormCanvas
              processedImage={processedImage}
              contours={contours}
              showContours={showContours}
              bubbleInfo={bubbleInfo}
              originalImage={originalImage}
              onContoursChange={handleContoursChange}
              selectedContourIndex={selectedContourIndex}
              onContourSelect={handleContourSelect}
            />

            {/* Sağ taraf - Toolbar */}
            <Toolbar
              onProcess={processImage}
              onToggleContours={() => setShowContours(!showContours)}
              showContours={showContours}
              isProcessing={isProcessing}
              hasImage={!!originalImage}
              onDownload={handleDownload}
              selectedContourIndex={selectedContourIndex}
              contours={contours}
              onDeleteContour={handleDeleteContour}
              onResetContours={handleResetContours}
              onAddContour={handleAddContour}
              hasProcessedImage={!!processedImage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;