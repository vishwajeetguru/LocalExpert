/**
 * Bundled free-library imagery (Wikimedia Commons, freely licensed) keyed by
 * category slug. Works in mock AND WordPress mode — the server never ships
 * pixels. Regenerate: node scripts/fetch-category-images.cjs
 */
export const CATEGORY_IMAGES: Record<string, unknown> = {
  'ac-repair': require('../../../assets/categories/ac-repair.png'),
  'bike-repair': require('../../../assets/categories/bike-repair.png'),
  'car-repair': require('../../../assets/categories/car-repair.png'),
  'carpenter': require('../../../assets/categories/carpenter.png'),
  'cleaning': require('../../../assets/categories/cleaning.png'),
  'computer-repair': require('../../../assets/categories/computer-repair.png'),
  'cooler-repair': require('../../../assets/categories/cooler-repair.png'),
  'dentist': require('../../../assets/categories/dentist.png'),
  'doctor': require('../../../assets/categories/doctor.png'),
  'electrician': require('../../../assets/categories/electrician.png'),
  'fan-repair': require('../../../assets/categories/fan-repair.png'),
  'fridge-repair': require('../../../assets/categories/fridge-repair.png'),
  'mobile-repair': require('../../../assets/categories/mobile-repair.png'),
  'plumber': require('../../../assets/categories/plumber.png'),
  'tailor': require('../../../assets/categories/tailor.png'),
  'salon': require('../../../assets/categories/salon.png'),
  'painter': require('../../../assets/categories/painter.png'),
  'tutor': require('../../../assets/categories/tutor.png'),
  'photographer': require('../../../assets/categories/photographer.png'),
  'printing': require('../../../assets/categories/printing.png'),
  // Renamed leaves reuse the closest bundled art.
  'deep-cleaning': require('../../../assets/categories/cleaning.png'),
};
