/**
 * Single Source of Truth for Pune Pincode Delivery Zones.
 */
export const PINCODE_ZONES = {
  "411014": {
    area: "Viman Nagar / Vadgaon Sheri",
    city: "Pune",
    fee: 0,
    eta: "30-45 mins",
    available: true
  },
  "411006": {
    area: "Yerwada / Kalyani Nagar",
    city: "Pune",
    fee: 0,
    eta: "35-50 mins",
    available: true
  },
  "411032": {
    area: "Dhanori / Tingre Nagar",
    city: "Pune",
    fee: 0,
    eta: "40-55 mins",
    available: true
  },
  "411047": {
    area: "Lohegaon",
    city: "Pune",
    fee: 60,
    eta: "40-60 mins",
    available: true
  },
  "411015": {
    area: "Vishrantwadi",
    city: "Pune",
    fee: 60,
    eta: "40-55 mins",
    available: true
  },
  "411036": {
    area: "Mundhwa / Ghorpadi",
    city: "Pune",
    fee: 60,
    eta: "35-50 mins",
    available: true
  },
  "411001": {
    area: "Pune Camp / MG Road",
    city: "Pune",
    fee: 60,
    eta: "45-60 mins",
    available: true
  },
  "412207": {
    area: "Wagholi",
    city: "Pune",
    fee: 60,
    eta: "70-95 mins",
    available: true
  },
  "411005": {
    area: "Shivajinagar",
    city: "Pune",
    fee: 80,
    eta: "60-80 mins",
    available: true
  },
  "411028": {
    area: "Hadapsar / Magarpatta",
    city: "Pune",
    fee: 80,
    eta: "50-70 mins",
    available: true
  },
  "412307": {
    area: "Manjari",
    city: "Pune",
    fee: 80,
    eta: "70-95 mins",
    available: true
  },
  "411040": {
    area: "Wanowrie",
    city: "Pune",
    fee: 80,
    eta: "50-70 mins",
    available: true
  },
  "411004": {
    area: "Deccan / Erandwane",
    city: "Pune",
    fee: 80,
    eta: "65-85 mins",
    available: true
  },
  "411011": {
    area: "Kasba Peth",
    city: "Pune",
    fee: 80,
    eta: "55-75 mins",
    available: true
  },
  "411002": {
    area: "Swargate",
    city: "Pune",
    fee: 80,
    eta: "60-80 mins",
    available: true
  },
  "411003": {
    area: "Raviwar Peth",
    city: "Pune",
    fee: 80,
    eta: "60-80 mins",
    available: true
  },
  "411007": {
    area: "Aundh / University",
    city: "Pune",
    fee: 80,
    eta: "65-90 mins",
    available: true
  },
  "411105": {
    area: "Alandi",
    city: "Pune",
    fee: 120,
    eta: "75-100 mins",
    available: true
  },
  "412105": {
    area: "Alandi (Devachi)",
    city: "Pune",
    fee: 120,
    eta: "75-100 mins",
    available: true
  }
};

/**
 * Helper to get delivery zone by pincode
 * @param {string} pincode 
 * @returns {Object|null} Zone info if found, else null
 */
export const getZoneByPincode = (pincode) => {
  if (!pincode) return null;
  const cleanPincode = String(pincode).trim();
  return PINCODE_ZONES[cleanPincode] || null;
};
