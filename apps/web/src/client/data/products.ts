import type { ProductSeed } from '../types/catalog';

const LMD = 'Lanka Mobile Distributors';
const CAI = 'Ceylon Audio Imports';
const ICS = 'Island Computer Supplies';
const SLL = 'SmartLiving Lanka';
const CAH = 'Colombo Accessory House';

export const productSeeds: ProductSeed[] = [
{
  id: 'p-iph15', name: 'Apple iPhone 15', type: 'physical', status: 'active', category: 'Phones', brand: 'Apple', supplier: LMD,
  description: '6.1-inch Super Retina XDR display, A16 Bionic, 48MP main camera, USB-C.', optionNames: ['Storage', 'Colour'], reorderPoint: 3, reorderQty: 6, demand: 9,
  variants: [
  { options: { Storage: '128GB', Colour: 'Black' }, sku: 'IPH15-128-BLK', price: 289900, cost: 246000, compareAt: 304900 },
  { options: { Storage: '128GB', Colour: 'Blue' }, sku: 'IPH15-128-BLU', price: 289900, cost: 246000, compareAt: 304900 },
  { options: { Storage: '256GB', Colour: 'Black' }, sku: 'IPH15-256-BLK', price: 334900, cost: 285000 }]

},
{
  id: 'p-iph15pro', name: 'Apple iPhone 15 Pro', type: 'physical', status: 'active', category: 'Phones', brand: 'Apple', supplier: LMD,
  description: 'Titanium design, A17 Pro chip, 5x telephoto on Pro Max, Action button.', optionNames: ['Storage', 'Colour'], reorderPoint: 2, reorderQty: 4, demand: 5,
  variants: [
  { options: { Storage: '256GB', Colour: 'Natural Titanium' }, sku: 'IPH15P-256-NAT', price: 429900, cost: 368000 },
  { options: { Storage: '256GB', Colour: 'Black Titanium' }, sku: 'IPH15P-256-BLK', price: 429900, cost: 368000 }]

},
{
  id: 'p-gs24', name: 'Samsung Galaxy S24', type: 'physical', status: 'active', category: 'Phones', brand: 'Samsung', supplier: LMD,
  description: '6.2-inch Dynamic AMOLED 2X, Galaxy AI features, 50MP triple camera.', optionNames: ['Storage', 'Colour'], reorderPoint: 3, reorderQty: 5, demand: 6,
  variants: [
  { options: { Storage: '256GB', Colour: 'Onyx Black' }, sku: 'GS24-256-BLK', price: 284900, cost: 241000 },
  { options: { Storage: '256GB', Colour: 'Marble Grey' }, sku: 'GS24-256-GRY', price: 284900, cost: 241000 }]

},
{
  id: 'p-ga55', name: 'Samsung Galaxy A55 5G', type: 'physical', status: 'active', category: 'Phones', brand: 'Samsung', supplier: LMD,
  description: 'Metal frame, 6.6-inch Super AMOLED 120Hz, IP67, 5000mAh battery.', optionNames: ['Storage', 'Colour'], reorderPoint: 4, reorderQty: 8, demand: 9,
  variants: [
  { options: { Storage: '128GB', Colour: 'Navy' }, sku: 'GA55-128-NVY', price: 134900, cost: 112000, wholesale: 124900 },
  { options: { Storage: '256GB', Colour: 'Navy' }, sku: 'GA55-256-NVY', price: 149900, cost: 125000, wholesale: 139900 }]

},
{
  id: 'p-rn13', name: 'Redmi Note 13 Pro', type: 'physical', status: 'active', category: 'Phones', brand: 'Xiaomi', supplier: LMD,
  description: '200MP camera, 6.67-inch AMOLED, 67W turbo charging.', optionNames: ['Storage', 'Colour'], reorderPoint: 4, reorderQty: 8, demand: 7,
  variants: [{ options: { Storage: '256GB', Colour: 'Midnight Black' }, sku: 'RN13P-256-BLK', price: 94900, cost: 78000, wholesale: 88900 }]
},
{
  id: 'p-pix8a', name: 'Google Pixel 8a', type: 'physical', status: 'active', category: 'Phones', brand: 'Google', supplier: LMD,
  description: 'Tensor G3, 7 years of OS updates, Magic Eraser and Best Take.', optionNames: ['Storage', 'Colour'], reorderPoint: 2, reorderQty: 4, demand: 3,
  variants: [{ options: { Storage: '128GB', Colour: 'Obsidian' }, sku: 'PIX8A-128-OBS', price: 159900, cost: 134000 }]
},
{
  id: 'p-airpods', name: 'AirPods Pro (2nd generation)', type: 'physical', status: 'active', category: 'Audio', brand: 'Apple', supplier: CAI,
  description: 'Active noise cancellation, adaptive audio, USB-C MagSafe case.', optionNames: [], reorderPoint: 5, reorderQty: 10, demand: 10,
  variants: [{ options: {}, sku: 'APP2-USBC', price: 84900, cost: 69000 }]
},
{
  id: 'p-wh1000', name: 'Sony WH-1000XM5', type: 'physical', status: 'active', category: 'Audio', brand: 'Sony', supplier: CAI,
  description: 'Industry-leading noise cancelling over-ear headphones, 30-hour battery.', optionNames: ['Colour'], reorderPoint: 2, reorderQty: 4, demand: 4,
  variants: [
  { options: { Colour: 'Black' }, sku: 'WH1000XM5-BLK', price: 129900, cost: 104000 },
  { options: { Colour: 'Silver' }, sku: 'WH1000XM5-SLV', price: 129900, cost: 104000 }]

},
{
  id: 'p-jblflip', name: 'JBL Flip 6', type: 'physical', status: 'active', category: 'Audio', brand: 'JBL', supplier: CAI,
  description: 'Portable waterproof Bluetooth speaker with bold JBL Pro Sound.', optionNames: ['Colour'], reorderPoint: 3, reorderQty: 8, demand: 8,
  variants: [
  { options: { Colour: 'Black' }, sku: 'FLIP6-BLK', price: 44900, cost: 33500, wholesale: 40500 },
  { options: { Colour: 'Blue' }, sku: 'FLIP6-BLU', price: 44900, cost: 33500, wholesale: 40500 },
  { options: { Colour: 'Red' }, sku: 'FLIP6-RED', price: 44900, cost: 33500, wholesale: 40500 }]

},
{
  id: 'p-buds2', name: 'Samsung Galaxy Buds2 Pro', type: 'physical', status: 'active', category: 'Audio', brand: 'Samsung', supplier: CAI,
  description: '24-bit Hi-Fi audio, intelligent ANC, ergonomic fit.', optionNames: [], reorderPoint: 3, reorderQty: 6, demand: 4,
  variants: [{ options: {}, sku: 'BUDS2PRO-GRA', price: 59900, cost: 47000 }]
},
{
  id: 'p-jbltune', name: 'JBL Tune 520BT', type: 'physical', status: 'active', category: 'Audio', brand: 'JBL', supplier: CAI,
  description: 'Wireless on-ear headphones with 57-hour battery life.', optionNames: [], reorderPoint: 4, reorderQty: 12, demand: 7,
  variants: [{ options: {}, sku: 'JBLT520-BLK', price: 16900, cost: 11800, wholesale: 14900 }]
},
{
  id: 'p-sonos', name: 'Sonos Era 100', type: 'physical', status: 'active', category: 'Audio', brand: 'Sonos', supplier: CAI,
  description: 'Compact smart speaker with stereo sound and Trueplay tuning.', optionNames: [], reorderPoint: 1, reorderQty: 2, demand: 0, slowMover: true,
  variants: [{ options: {}, sku: 'SONOS-ERA100-BLK', price: 99900, cost: 82000 }]
},
{
  id: 'p-mba13', name: 'MacBook Air 13" M3', type: 'physical', status: 'active', category: 'Laptops', brand: 'Apple', supplier: ICS,
  description: 'M3 chip, 13.6-inch Liquid Retina display, up to 18 hours battery.', optionNames: ['Configuration'], reorderPoint: 2, reorderQty: 4, demand: 5,
  variants: [
  { options: { Configuration: '8GB / 256GB Midnight' }, sku: 'MBA13M3-8-256', price: 389900, cost: 334000 },
  { options: { Configuration: '16GB / 512GB Midnight' }, sku: 'MBA13M3-16-512', price: 489900, cost: 421000 }]

},
{
  id: 'p-thinkpad', name: 'Lenovo ThinkPad E14 Gen 5', type: 'physical', status: 'active', category: 'Laptops', brand: 'Lenovo', supplier: ICS,
  description: 'Business laptop with 14-inch WUXGA display and MIL-STD durability.', optionNames: ['Configuration'], reorderPoint: 2, reorderQty: 5, demand: 4,
  variants: [{ options: { Configuration: 'i5 / 16GB / 512GB' }, sku: 'TPE14G5-I5-16', price: 274900, cost: 229000, wholesale: 259900 }]
},
{
  id: 'p-ideapad', name: 'Lenovo IdeaPad Slim 3', type: 'physical', status: 'active', category: 'Laptops', brand: 'Lenovo', supplier: ICS,
  description: 'Everyday 15.6-inch laptop, slim and light with fast charging.', optionNames: ['Configuration'], reorderPoint: 2, reorderQty: 5, demand: 5,
  variants: [{ options: { Configuration: 'i5 / 8GB / 512GB' }, sku: 'IPS3-I5-8', price: 189900, cost: 158000 }]
},
{
  id: 'p-victus', name: 'HP Victus 15', type: 'physical', status: 'active', category: 'Laptops', brand: 'HP', supplier: ICS,
  description: 'Gaming laptop with RTX 3050 graphics and 144Hz display.', optionNames: ['Configuration'], reorderPoint: 1, reorderQty: 3, demand: 3,
  variants: [{ options: { Configuration: 'i5 / 16GB / RTX 3050' }, sku: 'VICTUS15-I5-3050', price: 314900, cost: 268000 }]
},
{
  id: 'p-vivobook', name: 'ASUS Vivobook 15', type: 'physical', status: 'active', category: 'Laptops', brand: 'ASUS', supplier: ICS,
  description: 'Affordable 15.6-inch FHD laptop for study and work.', optionNames: ['Configuration'], reorderPoint: 2, reorderQty: 5, demand: 4,
  variants: [{ options: { Configuration: 'i3 / 8GB / 512GB' }, sku: 'VIVO15-I3-8', price: 149900, cost: 124000 }]
},
{
  id: 'p-echo', name: 'Amazon Echo Dot (5th Gen)', type: 'physical', status: 'active', category: 'Smart Home', brand: 'Amazon', supplier: SLL,
  description: 'Smart speaker with Alexa, improved audio and temperature sensor.', optionNames: [], reorderPoint: 3, reorderQty: 8, demand: 5,
  variants: [{ options: {}, sku: 'ECHO5-CHR', price: 21900, cost: 15500 }]
},
{
  id: 'p-tapo', name: 'TP-Link Tapo C210 Camera', type: 'physical', status: 'active', category: 'Smart Home', brand: 'TP-Link', supplier: SLL,
  description: '3MP pan/tilt home security Wi-Fi camera with night vision.', optionNames: [], reorderPoint: 4, reorderQty: 10, demand: 6,
  variants: [{ options: {}, sku: 'TAPO-C210', price: 11900, cost: 8100, wholesale: 10400 }]
},
{
  id: 'p-bulb', name: 'Xiaomi Smart LED Bulb', type: 'physical', status: 'active', category: 'Smart Home', brand: 'Xiaomi', supplier: SLL,
  description: 'Wi-Fi colour bulb, voice control, E27 fitting.', optionNames: [], reorderPoint: 6, reorderQty: 20, demand: 5,
  variants: [{ options: {}, sku: 'MI-BULB-E27', price: 4900, cost: 3100, wholesale: 4100 }]
},
{
  id: 'p-deco', name: 'TP-Link Deco X20 (2-pack)', type: 'physical', status: 'active', category: 'Smart Home', brand: 'TP-Link', supplier: SLL,
  description: 'AX1800 whole-home mesh Wi-Fi 6 system.', optionNames: [], reorderPoint: 2, reorderQty: 4, demand: 3,
  variants: [{ options: {}, sku: 'DECO-X20-2P', price: 52900, cost: 41000 }]
},
{
  id: 'p-ring', name: 'Ring Video Doorbell', type: 'physical', status: 'active', category: 'Smart Home', brand: 'Ring', supplier: SLL,
  description: '1080p HD video doorbell with two-way talk.', optionNames: [], reorderPoint: 1, reorderQty: 2, demand: 0, slowMover: true,
  variants: [{ options: {}, sku: 'RING-VDB-2', price: 49900, cost: 39000 }]
},
{
  id: 'p-nesthub', name: 'Google Nest Hub (2nd Gen)', type: 'physical', status: 'active', category: 'Smart Home', brand: 'Google', supplier: SLL,
  description: '7-inch smart display with sleep sensing.', optionNames: [], reorderPoint: 1, reorderQty: 2, demand: 0, slowMover: true,
  variants: [{ options: {}, sku: 'NEST-HUB-2', price: 34900, cost: 27000 }]
},
{
  id: 'p-anker20', name: 'Anker 20W USB-C Charger', type: 'physical', status: 'active', category: 'Accessories', brand: 'Anker', supplier: CAH,
  description: 'Compact PD fast charger for iPhone and Android.', optionNames: [], reorderPoint: 8, reorderQty: 24, demand: 9,
  variants: [{ options: {}, sku: 'ANK-PD20', price: 6900, cost: 3900, wholesale: 5600 }]
},
{
  id: 'p-powerbank', name: 'Anker PowerCore 10000', type: 'physical', status: 'active', category: 'Accessories', brand: 'Anker', supplier: CAH,
  description: 'Slim 10,000mAh power bank with PowerIQ.', optionNames: ['Colour'], reorderPoint: 5, reorderQty: 15, demand: 6,
  variants: [
  { options: { Colour: 'Black' }, sku: 'ANK-PC10K-BLK', price: 11900, cost: 7600, wholesale: 9900 },
  { options: { Colour: 'White' }, sku: 'ANK-PC10K-WHT', price: 11900, cost: 7600, wholesale: 9900 }]

},
{
  id: 'p-cable', name: 'Belkin USB-C to USB-C Cable 2m', type: 'physical', status: 'active', category: 'Accessories', brand: 'Belkin', supplier: CAH,
  description: 'Braided 60W charging and data cable.', optionNames: [], reorderPoint: 10, reorderQty: 30, demand: 8,
  variants: [{ options: {}, sku: 'BLK-USBC-2M', price: 4500, cost: 2400, wholesale: 3600 }]
},
{
  id: 'p-case', name: 'Spigen Case for iPhone 15', type: 'physical', status: 'active', category: 'Accessories', brand: 'Spigen', supplier: CAH,
  description: 'Ultra Hybrid shock-absorbing clear case.', optionNames: ['Style'], reorderPoint: 6, reorderQty: 20, demand: 7,
  variants: [
  { options: { Style: 'Clear' }, sku: 'SPG-IP15-CLR', price: 5900, cost: 2900, wholesale: 4600 },
  { options: { Style: 'Matte Black' }, sku: 'SPG-IP15-BLK', price: 5900, cost: 2900, wholesale: 4600 }]

},
{
  id: 'p-glass', name: 'Tempered Glass Screen Protector', type: 'physical', status: 'active', category: 'Accessories', brand: 'Serendib Essentials', supplier: CAH,
  description: '9H hardness, bubble-free installation kit included.', optionNames: [], reorderPoint: 15, reorderQty: 50, demand: 7,
  variants: [{ options: {}, sku: 'SE-GLASS-UNI', price: 2500, cost: 900, wholesale: 1800 }]
},
{
  id: 'p-m331', name: 'Logitech M331 Silent Mouse', type: 'physical', status: 'active', category: 'Accessories', brand: 'Logitech', supplier: CAH,
  description: 'Wireless mouse with 90% less click noise.', optionNames: [], reorderPoint: 5, reorderQty: 15, demand: 5,
  variants: [{ options: {}, sku: 'LOGI-M331', price: 7900, cost: 5200, wholesale: 6800 }]
},
{
  id: 'p-k380', name: 'Logitech K380 Keyboard', type: 'physical', status: 'active', category: 'Accessories', brand: 'Logitech', supplier: CAH,
  description: 'Multi-device Bluetooth keyboard, switch between 3 devices.', optionNames: ['Colour'], reorderPoint: 4, reorderQty: 12, demand: 4,
  variants: [
  { options: { Colour: 'Graphite' }, sku: 'LOGI-K380-GRA', price: 14900, cost: 10400, wholesale: 12900 },
  { options: { Colour: 'Rose' }, sku: 'LOGI-K380-ROSE', price: 14900, cost: 10400, wholesale: 12900 }]

},
{
  id: 'p-c920', name: 'Logitech C920 HD Webcam', type: 'physical', status: 'active', category: 'Accessories', brand: 'Logitech', supplier: CAH,
  description: 'Full HD 1080p video calls with stereo audio.', optionNames: [], reorderPoint: 3, reorderQty: 8, demand: 3,
  variants: [{ options: {}, sku: 'LOGI-C920', price: 27900, cost: 21000 }]
},
{
  id: 'p-jabra', name: 'Jabra Evolve2 30 Headset', type: 'physical', status: 'active', category: 'Accessories', brand: 'Jabra', supplier: CAH,
  description: 'USB-C wired stereo headset certified for Teams and Zoom.', optionNames: [], reorderPoint: 3, reorderQty: 8, demand: 3,
  variants: [{ options: {}, sku: 'JABRA-EV2-30', price: 32900, cost: 25500 }]
},
{
  id: 'p-stand', name: 'Aluminium Laptop Stand', type: 'physical', status: 'active', category: 'Accessories', brand: 'Serendib Essentials', supplier: CAH,
  description: 'Adjustable ergonomic stand for 11–17 inch laptops.', optionNames: [], reorderPoint: 4, reorderQty: 12, demand: 3,
  variants: [{ options: {}, sku: 'SE-STAND-ALU', price: 8900, cost: 4800 }]
},
{
  id: 'p-sleeve', name: 'Laptop Sleeve 14"', type: 'physical', status: 'active', category: 'Accessories', brand: 'Serendib Essentials', supplier: CAH,
  description: 'Water-resistant neoprene sleeve with accessory pocket.', optionNames: [], reorderPoint: 2, reorderQty: 6, demand: 0, slowMover: true,
  variants: [{ options: {}, sku: 'SE-SLEEVE-14', price: 5900, cost: 2700 }]
},
{
  id: 'p-watch', name: 'Apple Watch SE (2nd Gen)', type: 'physical', status: 'draft', category: 'Accessories', brand: 'Apple', supplier: LMD,
  description: 'Arriving next month — listing being prepared.', optionNames: ['Size'], reorderPoint: 2, reorderQty: 4, demand: 0,
  variants: [{ options: { Size: '44mm Midnight' }, sku: 'AWSE2-44-MID', price: 89900, cost: 74000 }]
},
{
  id: 'p-care', name: 'Serendib Care+ (1 year)', type: 'service', status: 'active', category: 'Services', brand: 'Serendib', supplier: 'In-house',
  description: 'Extended accidental damage cover with in-store repair priority.', optionNames: [], reorderPoint: 0, reorderQty: 0, demand: 0,
  variants: [{ options: {}, sku: 'CARE-1Y', price: 14900, cost: 0 }]
},
{
  id: 'p-wfh', name: 'Work-From-Home Kit', type: 'bundle', status: 'active', category: 'Bundles', brand: 'Serendib', supplier: 'Kit — built from stock',
  description: 'Logitech K380, M331 Silent mouse, Jabra Evolve2 30 and an aluminium laptop stand.', optionNames: [], reorderPoint: 0, reorderQty: 0, demand: 2,
  variants: [{ options: {}, sku: 'KIT-WFH', price: 59900, cost: 0, compareAt: 64600 }],
  bundle: [
  { sku: 'LOGI-K380-GRA', quantity: 1 },
  { sku: 'LOGI-M331', quantity: 1 },
  { sku: 'JABRA-EV2-30', quantity: 1 },
  { sku: 'SE-STAND-ALU', quantity: 1 }]

}];