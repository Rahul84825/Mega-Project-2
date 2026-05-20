export const offers = [
  {
    title: "Diwali Mahotsav",
    description: "Celebrate the festival of lights with 20% flat discount on all Gift Boxes and Premium Collections.",
    discount_percentage: 20,
    offer_type: "banner",
    image: "/uploads/offers/diwali-banner.jpg",
    priority: 1,
    isActive: true
  },
  {
    title: "Bengali Sweet Feast",
    description: "Get up to 15% off on our entire range of authentic Bengali milk sweets. Limited time only!",
    discount_percentage: 15,
    offer_type: "category",
    linked_category_id: "bengali-sweets",
    image: "/uploads/offers/bengali-offer.jpg",
    priority: 2,
    isActive: true
  },
  {
    title: "Healthy Indulgence",
    description: "Switch to sugar-free without compromising on taste. 10% off on all items in the Sugar Free collection.",
    discount_percentage: 10,
    offer_type: "category",
    linked_category_id: "sugar-free",
    image: "/uploads/offers/sugarfree-banner.jpg",
    priority: 3,
    isActive: true
  },
  {
    title: "Signature Treat",
    description: "Try our best-selling Kaju Katli Gold today and experience luxury in every bite.",
    discount_percentage: 5,
    offer_type: "product",
    linked_product_id: "kaju-katli-gold",
    image: "/uploads/offers/kajukatli-offer.jpg",
    priority: 4,
    isActive: true
  }
];
