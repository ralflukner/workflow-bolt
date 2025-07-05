const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function generatePowerUpIcon() {
  try {
    // Create canvas at exactly 144x144px
    const canvas = createCanvas(144, 144);
    const ctx = canvas.getContext('2d');
    
    // Blue gradient background
    const gradient = ctx.createRadialGradient(72, 72, 0, 72, 72, 72);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    // Fill background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner circle with slight transparency
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.beginPath();
    ctx.arc(72, 72, 60, 0, 2 * Math.PI);
    ctx.fill();
    
    // White workflow arrows
    ctx.fillStyle = 'white';
    
    // Arrow 1 (top)
    ctx.beginPath();
    ctx.moveTo(30, 45);
    ctx.lineTo(50, 45);
    ctx.lineTo(50, 35);
    ctx.lineTo(75, 50);
    ctx.lineTo(50, 65);
    ctx.lineTo(50, 55);
    ctx.lineTo(30, 55);
    ctx.closePath();
    ctx.fill();
    
    // Arrow 2 (middle)
    ctx.beginPath();
    ctx.moveTo(75, 65);
    ctx.lineTo(95, 65);
    ctx.lineTo(95, 55);
    ctx.lineTo(120, 70);
    ctx.lineTo(95, 85);
    ctx.lineTo(95, 75);
    ctx.lineTo(75, 75);
    ctx.closePath();
    ctx.fill();
    
    // Arrow 3 (bottom)
    ctx.beginPath();
    ctx.moveTo(45, 80);
    ctx.lineTo(65, 80);
    ctx.lineTo(65, 70);
    ctx.lineTo(90, 85);
    ctx.lineTo(65, 100);
    ctx.lineTo(65, 90);
    ctx.lineTo(45, 90);
    ctx.closePath();
    ctx.fill();
    
    // Medical cross
    // Vertical bar
    ctx.fillRect(67, 25, 10, 40);
    // Horizontal bar  
    ctx.fillRect(52, 40, 40, 10);
    
    // Gear symbol (automation)
    ctx.save();
    ctx.translate(95, 105);
    ctx.scale(0.7, 0.7);
    
    // Gear outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(15, 15, 8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Gear center
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(15, 15, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
    
    // Data flow dots
    const dots = [
      {x: 40, y: 30, alpha: 0.8},
      {x: 50, y: 25, alpha: 0.6},
      {x: 95, y: 40, alpha: 0.8},
      {x: 105, y: 35, alpha: 0.6},
      {x: 75, y: 110, alpha: 0.8},
      {x: 85, y: 115, alpha: 0.6}
    ];
    
    dots.forEach(dot => {
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(72, 72, 71, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./public/images/trello-power-up-icon.png', buffer);
    
    console.log('✅ Power-Up icon generated successfully at public/images/trello-power-up-icon.png');
    console.log('📏 Size: 144px x 144px');
    console.log('🎨 Format: PNG with transparency');
    console.log('🔗 URL for Trello: https://workflow-bolt.netlify.app/images/trello-power-up-icon.png');
    
  } catch (error) {
    console.error('❌ Error generating icon:', error.message);
    console.log('💡 Installing canvas dependency...');
    
    // Create a simpler HTML canvas fallback
    const htmlCanvas = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" width="144" height="144"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Blue gradient background
        const gradient = ctx.createRadialGradient(72, 72, 0, 72, 72, 72);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1e40af');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(72, 72, 72, 0, 2 * Math.PI);
        ctx.fill();
        
        // Download function
        function download() {
            const link = document.createElement('a');
            link.download = 'trello-power-up-icon.png';
            link.href = canvas.toDataURL();
            link.click();
        }
        
        // Auto download after 1 second
        setTimeout(download, 1000);
    </script>
    <button onclick="download()">Download Icon</button>
</body>
</html>`;
    
    fs.writeFileSync('./icon-generator.html', htmlCanvas);
    console.log('📄 Created icon-generator.html - open in browser to download icon');
  }
}

generatePowerUpIcon();