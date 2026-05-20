export const products = [
  // BENGALI SWEETS (Slug: bengali-sweets)
  {
    name: "Rasmalai Premium",
    slug: "rasmalai-premium",
    category: "bengali-sweets",
    brand: "Mithai World",
    description: "Soft cottage cheese dumplings soaked in creamy, saffron-infused milk. Garnished with pistachios and almonds.",
    shortDescription: "Saffron milk dumplings.",
    gstPercent: 5,
    isSignature: true,
    isHero: true,
    tags: ["bestseller", "chilled", "milk-based"],
    variants: [
      { label: "2 Pieces", mrp: 180, discountPercent: 10, sellingPrice: 162, stock: 50 },
      { label: "5 Pieces", mrp: 400, discountPercent: 15, sellingPrice: 360, stock: 30 }
    ]
  },
  {
    name: "Saffron Cham Cham",
    slug: "saffron-cham-cham",
    category: "bengali-sweets",
    brand: "Mithai World",
    description: "A traditional Bengali sweet made from curdled milk, flavored with saffron and coated with desiccated coconut.",
    shortDescription: "Saffron flavored milk sweet.",
    gstPercent: 5,
    tags: ["traditional", "bengali"],
    variants: [
      { label: "500g", mrp: 350, discountPercent: 0, sellingPrice: 350, stock: 40 },
      { label: "1kg", mrp: 680, discountPercent: 5, sellingPrice: 646, stock: 20 }
    ]
  },
  {
    name: "Classic Rasgulla",
    slug: "classic-rasgulla",
    category: "bengali-sweets",
    description: "Spongy and light milk balls soaked in clear sugar syrup. Pure indulgence in every bite.",
    gstPercent: 5,
    tags: ["low-fat", "bestseller"],
    variants: [
      { label: "12 Pieces", mrp: 280, discountPercent: 5, sellingPrice: 266, stock: 100 },
      { label: "20 Pieces", mrp: 450, discountPercent: 10, sellingPrice: 405, stock: 60 }
    ]
  },
  {
    name: "Mishti Doi",
    slug: "mishti-doi-premium",
    category: "bengali-sweets",
    description: "Creamy, caramelized fermented yogurt prepared in earthen pots for authentic taste.",
    gstPercent: 5,
    tags: ["chilled", "probiotic"],
    variants: [
      { label: "200g", mrp: 80, discountPercent: 0, sellingPrice: 80, stock: 200 },
      { label: "500g", mrp: 180, discountPercent: 5, sellingPrice: 171, stock: 100 }
    ]
  },
  {
    name: "Sandesh Assorted",
    slug: "sandesh-assorted",
    category: "bengali-sweets",
    description: "Delicate melt-in-mouth milk fudge in Nolen Gur, Saffron, and Pistachio flavors.",
    gstPercent: 5,
    tags: ["gift", "seasonal"],
    variants: [
      { label: "250g", mrp: 220, discountPercent: 0, sellingPrice: 220, stock: 45 },
      { label: "500g", mrp: 420, discountPercent: 5, sellingPrice: 399, stock: 25 }
    ]
  },

  // DRY FRUIT SWEETS (Slug: dry-fruit-sweets)
  {
    name: "Kaju Katli Gold",
    slug: "kaju-katli-gold",
    category: "dry-fruit-sweets",
    description: "Premium cashews ground to perfection and topped with edible silver vark. The ultimate Indian classic.",
    gstPercent: 12,
    isSignature: true,
    tags: ["bestseller", "classic", "celebration"],
    variants: [
      { label: "250g", mrp: 300, discountPercent: 0, sellingPrice: 300, stock: 150 },
      { label: "500g", mrp: 580, discountPercent: 5, sellingPrice: 551, stock: 100 },
      { label: "1kg", mrp: 1100, discountPercent: 10, sellingPrice: 990, stock: 50 }
    ]
  },
  {
    name: "Anjeer Sugarfree Roll",
    slug: "anjeer-sugarfree-roll",
    category: "dry-fruit-sweets",
    description: "Rich figs and crunchy nuts rolled together with no added sugar. Healthy and delicious.",
    gstPercent: 12,
    tags: ["sugarfree", "healthy", "premium"],
    variants: [
      { label: "250g", mrp: 450, discountPercent: 5, sellingPrice: 427, stock: 35 },
      { label: "500g", mrp: 850, discountPercent: 10, sellingPrice: 765, stock: 20 }
    ]
  },
  {
    name: "Dry Fruit Laddu",
    slug: "dry-fruit-laddu",
    category: "dry-fruit-sweets",
    description: "Energy-packed balls made of dates, almonds, cashews, and walnuts. No added syrup.",
    gstPercent: 12,
    tags: ["energy", "immunity"],
    variants: [
      { label: "250g", mrp: 380, discountPercent: 0, sellingPrice: 380, stock: 60 },
      { label: "500g", mrp: 720, discountPercent: 5, sellingPrice: 684, stock: 30 }
    ]
  },
  {
    name: "Pista Launj",
    slug: "pista-launj",
    category: "dry-fruit-sweets",
    description: "Exquisite pistachio fudge prepared with premium Iranian pistachios and pure ghee.",
    gstPercent: 12,
    tags: ["exotic", "limited"],
    variants: [
      { label: "250g", mrp: 550, discountPercent: 10, sellingPrice: 495, stock: 15 }
    ]
  },
  {
    name: "Badam Barfi",
    slug: "badam-barfi-premium",
    category: "dry-fruit-sweets",
    description: "Classic almond fudge made with California almonds. Rich and satisfying.",
    gstPercent: 12,
    tags: ["almond", "classic"],
    variants: [
      { label: "250g", mrp: 350, discountPercent: 0, sellingPrice: 350, stock: 80 },
      { label: "500g", mrp: 680, discountPercent: 5, sellingPrice: 646, stock: 40 }
    ]
  },

  // TRADITIONAL MITHAI (Slug: traditional-mithai)
  {
    name: "Special Motichoor Laddu",
    slug: "special-motichoor-laddu",
    category: "traditional-mithai",
    description: "Tiny gram flour pearls fried in desi ghee and soaked in cardamom-scented syrup.",
    gstPercent: 5,
    isSignature: true,
    tags: ["bestseller", "religious", "ghee-based"],
    variants: [
      { label: "250g", mrp: 180, discountPercent: 0, sellingPrice: 180, stock: 120 },
      { label: "500g", mrp: 350, discountPercent: 5, sellingPrice: 332, stock: 90 },
      { label: "1kg", mrp: 680, discountPercent: 8, sellingPrice: 612, stock: 45 }
    ]
  },
  {
    name: "Gulab Jamun Soft",
    slug: "gulab-jamun-soft",
    category: "traditional-mithai",
    description: "Soft, golden-brown dumplings made of khoya, fried in ghee and soaked in rose-flavored syrup.",
    gstPercent: 5,
    tags: ["hot-served", "bestseller"],
    variants: [
      { label: "6 Pieces", mrp: 150, discountPercent: 0, sellingPrice: 150, stock: 100 },
      { label: "12 Pieces", mrp: 280, discountPercent: 5, sellingPrice: 266, stock: 75 }
    ]
  },
  {
    name: "Mysore Pak (Ghee)",
    slug: "mysore-pak-ghee",
    category: "traditional-mithai",
    description: "South Indian royalty. Porous and rich fudge made with gram flour and an abundance of desi ghee.",
    gstPercent: 5,
    tags: ["south-indian", "rich"],
    variants: [
      { label: "250g", mrp: 210, discountPercent: 0, sellingPrice: 210, stock: 40 },
      { label: "500g", mrp: 400, discountPercent: 5, sellingPrice: 380, stock: 25 }
    ]
  },
  {
    name: "Mathura Peda",
    slug: "mathura-peda-authentic",
    category: "traditional-mithai",
    description: "Roasted milk fudge from the land of Krishna. Dark brown, grainy, and deeply flavorful.",
    gstPercent: 5,
    tags: ["devotional", "authentic"],
    variants: [
      { label: "250g", mrp: 160, discountPercent: 0, sellingPrice: 160, stock: 150 },
      { label: "500g", mrp: 300, discountPercent: 5, sellingPrice: 285, stock: 100 }
    ]
  },
  {
    name: "Besan Laddu",
    slug: "besan-laddu-ghee",
    category: "traditional-mithai",
    description: "Aromatic roasted gram flour laddus with crunchy nut bits. Prepared using slow-roast technique.",
    gstPercent: 5,
    tags: ["homemade-style", "classic"],
    variants: [
      { label: "250g", mrp: 170, discountPercent: 0, sellingPrice: 170, stock: 90 },
      { label: "500g", mrp: 320, discountPercent: 5, sellingPrice: 304, stock: 50 }
    ]
  },

  // SUGAR FREE (Slug: sugar-free)
  {
    name: "Sugarfree Kaju Katli",
    slug: "sugarfree-kaju-katli",
    category: "sugar-free",
    description: "The classic Kaju Katli experience, now with zero added sugar. Uses natural sweeteners.",
    gstPercent: 12,
    tags: ["diet", "diabetic-friendly"],
    variants: [
      { label: "250g", mrp: 350, discountPercent: 0, sellingPrice: 350, stock: 40 },
      { label: "500g", mrp: 680, discountPercent: 5, sellingPrice: 646, stock: 20 }
    ]
  },
  {
    name: "Sugarfree Dry Fruit Barfi",
    slug: "sugarfree-dry-fruit-barfi",
    category: "sugar-free",
    description: "A nutrient-dense barfi made of chopped nuts and sweetened with dates and stevia.",
    gstPercent: 12,
    tags: ["keto", "healthy"],
    variants: [
      { label: "250g", mrp: 480, discountPercent: 5, sellingPrice: 456, stock: 30 }
    ]
  },

  // NAMKEEN & SNACKS (Slug: namkeen-snacks)
  {
    name: "Premium Cashew Mix",
    slug: "premium-cashew-mix",
    category: "namkeen-snacks",
    description: "Roasted cashews blended with traditional spices, raisins, and crunchy cornflakes.",
    gstPercent: 12,
    tags: ["spicy", "savory", "evening-snack"],
    variants: [
      { label: "200g", mrp: 250, discountPercent: 0, sellingPrice: 250, stock: 200 },
      { label: "400g", mrp: 480, discountPercent: 5, sellingPrice: 456, stock: 150 }
    ]
  },
  {
    name: "Moong Dal Namkeen",
    slug: "moong-dal-namkeen",
    category: "namkeen-snacks",
    description: "Crispy, salted split yellow moong dal. Light and protein-rich snack.",
    gstPercent: 12,
    tags: ["light", "crispy"],
    variants: [
      { label: "250g", mrp: 120, discountPercent: 0, sellingPrice: 120, stock: 300 }
    ]
  },
  {
    name: "Mini Bhakarwadi",
    slug: "mini-bhakarwadi-spicy",
    category: "namkeen-snacks",
    description: "Crispy, sweet, and spicy rolls from Maharashtra. Packed with coconut and spice blend.",
    gstPercent: 12,
    tags: ["maharashtrian", "spicy"],
    variants: [
      { label: "250g", mrp: 140, discountPercent: 0, sellingPrice: 140, stock: 180 },
      { label: "500g", mrp: 260, discountPercent: 5, sellingPrice: 247, stock: 100 }
    ]
  },

  // GIFT BOXES (Slug: gift-boxes)
  {
    name: "Festive Celebration Box",
    slug: "festive-celebration-box",
    category: "gift-boxes",
    description: "A beautiful assortment of Kaju Katli, Motichoor Laddu, and Premium Namkeen.",
    gstPercent: 12,
    isHero: true,
    tags: ["gift", "diwali", "wedding"],
    variants: [
      { label: "750g (Small)", mrp: 850, discountPercent: 10, sellingPrice: 765, stock: 50 },
      { label: "1.5kg (Large)", mrp: 1600, discountPercent: 15, sellingPrice: 1360, stock: 30 }
    ]
  },
  {
    name: "Royal Dry Fruit Trunk",
    slug: "royal-dry-fruit-trunk",
    category: "gift-boxes",
    description: "Handcrafted miniature trunk filled with exotic nuts and gold-vark mithais.",
    gstPercent: 12,
    isSignature: true,
    tags: ["luxury", "corporate-gift"],
    variants: [
      { label: "Signature Edition", mrp: 2500, discountPercent: 5, sellingPrice: 2375, stock: 15 }
    ]
  },

  // PREMIUM COLLECTIONS (Slug: premium-collections)
  {
    name: "Saffron Gold Delicacy",
    slug: "saffron-gold-delicacy",
    category: "premium-collections",
    description: "Ultra-premium khoya sweet infused with Kashmiri saffron and topped with real gold leaf.",
    gstPercent: 12,
    isSignature: true,
    tags: ["exclusive", "gold-vark"],
    variants: [
      { label: "250g", mrp: 1200, discountPercent: 0, sellingPrice: 1200, stock: 10 },
      { label: "500g", mrp: 2200, discountPercent: 5, sellingPrice: 2090, stock: 5 }
    ]
  }
  
  // Note: I will add more items in the masterSeeder to reach 50+ 
  // but keeping this list concise for the initial file write.
];
