const { Jimp } = require('jimp');
const fs = require('fs');

const INPUT = 'C:/Users/csa08/.gemini/antigravity/brain/de4fd8f7-6866-4981-a209-92bf9dc90988/media__1783658344743.jpg';
const OUTPUT_PNG = 'C:/Users/csa08/.gemini/antigravity/brain/de4fd8f7-6866-4981-a209-92bf9dc90988/shinchan_nuki.png';
const OUTPUT_SVG = 'C:/Users/csa08/Documents/antigravity/intelligent-salk/public/favicon.svg';

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

  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // 네 모서리 + 추가 샘플 포인트로 배경색 평균 산출
  const samples = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width * 0.1), y: Math.floor(height * 0.1) },
    { x: Math.floor(width * 0.9), y: Math.floor(height * 0.1) },
    { x: Math.floor(width / 2), y: 0 },
    { x: width - 1, y: Math.floor(height / 2) },
  ];

  let totalR = 0, totalG = 0, totalB = 0;
  samples.forEach(({ x, y }) => {
    const idx = (y * width + x) * 4;
    totalR += image.bitmap.data[idx];
    totalG += image.bitmap.data[idx + 1];
    totalB += image.bitmap.data[idx + 2];
  });
  const bgR = Math.round(totalR / samples.length);
  const bgG = Math.round(totalG / samples.length);
  const bgB = Math.round(totalB / samples.length);

  console.log(`배경색 감지: rgb(${bgR}, ${bgG}, ${bgB})`);

  const TOLERANCE = 60;
  const FEATHER = 30;

  // 픽셀 스캔 및 투명화
  const data = image.bitmap.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = colorDistance(r, g, b, bgR, bgG, bgB);

      if (dist < TOLERANCE) {
        data[idx + 3] = 0; // 완전 투명
      } else if (dist < TOLERANCE + FEATHER) {
        // 가장자리 안티앨리어싱
        const alpha = Math.round(((dist - TOLERANCE) / FEATHER) * 255);
        data[idx + 3] = alpha;
      }
      // else: 원본 불투명도 유지
    }
  }

  console.log('PNG 저장 중...');
  await image.write(OUTPUT_PNG);
  console.log('PNG 저장 완료!');

  // SVG favicon으로 변환 (배경 없음)
  const pngBuffer = fs.readFileSync(OUTPUT_PNG);
  const b64 = pngBuffer.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  fs.writeFileSync(OUTPUT_SVG, svg);
  console.log('favicon.svg 생성 완료! (투명 배경 누끼)');

  // 임시 파일 정리
  fs.unlinkSync('C:/Users/csa08/Documents/antigravity/intelligent-salk/remove_bg.cjs');
}

removeBackground().catch(console.error);
