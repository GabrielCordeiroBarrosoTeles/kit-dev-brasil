import qrcode from 'qrcode-generator';

const CELL_SIZE = 4;
const MARGIN = 4;

export const qrCodeDataUrl = (text: string): string => {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: CELL_SIZE, margin: MARGIN, scalable: true });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};
