const Jimp = require('jimp');
const fs = require('fs');

const INPUT = 'C:/Users/csa08/.gemini/antigravity/brain/de4fd8f7-6866-4981-a209-92bf9dc90988/media__1783658344743.jpg';
const OUTPUT_PNG = 'C:/Users/csa08/.gemini/antigravity/brain/de4fd8f7-6866-4981-a209-92bf9dc90988/shinchan_nuki.png';
const OUTPUT_SVG = 'C:/Users/csa08/Documents/antigravity/intelligent-salk/public/favicon.svg';

// 색상 거리 계산 (유클리드 거리)
function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

async function removeBackground() {
  console.log('이미지 로딩 중...');
  const image = await Jimp.read(INPUT);
  
  const width = image.getWidth();
  const height = image.getHeight();
  
  // 네 모서리의 배경색 샘플링 (평균)
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width / 2), y: 0 },       // 상단 중앙
    { x: 0, y: Math.floor(height / 2) },       // 좌측 중앙
    { x: width - 1, y: Math.floor(height / 2) } // 우측 중앙
  ];
  
  let totalR = 0, totalG = 0, totalB = 0;
  corners.forEach(({ x, y }) => {
    const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
    totalR += pixel.r;
    totalG += pixel.g;
    totalB += pixel.b;
  });
  const bgR = Math.round(totalR / corners.length);
  const bgG = Math.round(totalG / corners.length);
  const bgB = Math.round(totalB / corners.length);
  
  console.log(`배경색 감지: rgb(${bgR}, ${bgG}, ${bgB})`);
  
  // 허용 오차 (배경색과 이 거리 이내인 픽셀은 투명 처리)
  const TOLERANCE = 55;
  
  // 투명 배경 PNG로 변환
  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const dist = colorDistance(r, g, b, bgR, bgG, bgB);
    
    if (dist < TOLERANCE) {
      // 배경색 → 완전 투명
      this.bitmap.data[idx + 3] = 0;
    }
  });
  
  // 가장자리 부드럽게 처리 (블렌딩)
  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    
    if (a > 0) {
      const dist = colorDistance(r, g, b, bgR, bgG, bgB);
      if (dist < TOLERANCE + 25) {
        // 반투명 블렌딩 (가장자리 안티앨리어싱)
        const alpha = Math.round(((dist - TOLERANCE) / 25) * 255);
        this.bitmap.data[idx + 3] = Math.min(a, Math.max(0, alpha));
      }
    }
  });
  
  console.log('PNG 저장 중...');
  await image.writeAsync(OUTPUT_PNG);
  console.log('PNG 저장 완료!');
  
  // PNG → base64 → SVG favicon 생성
  const pngBuffer = fs.readFileSync(OUTPUT_PNG);
  const b64 = pngBuffer.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512"/>
</svg>`;
  
  fs.writeFileSync(OUTPUT_SVG, svg);
  console.log('favicon.svg 생성 완료! (완전 투명 배경)');
}

removeBackground().catch(console.error);
