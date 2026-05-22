import { MapPin, Phone, Mail, MessageSquare, ExternalLink } from "lucide-react";

/**
 * LocationCard Component
 * Displays store location with address and action buttons
 * Professional premium styling matching Mithai World brand
 */
const LocationCard = ({ compact = false }) => {
  const storeInfo = {
    name: "Mithai World",
    address: "Shop no. 04, Roshma Residency",
    addressLine2: "Central Line, near HDFC Bank",
    addressLine3: "Konark Nagar, Clover Park",
    city: "Viman Nagar, Pune",
    postalCode: "Maharashtra 411014",
    phone: "+91 95112 89914",
    phoneRaw: "9511289914",
    email: "mithaiworld08@gmail.com",
    mapsUrl: "https://maps.google.com/?q=Mithai+World+Viman+Nagar+Pune",
  };

  const ActionButton = ({ icon: Icon, label, href, type = "primary" }) => {
    const baseStyles =
      "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md";

    const variants = {
      primary:
        "bg-[#1e0f0a] text-white hover:bg-[#2a1410]",
      success:
        "bg-[#22c55e] text-white hover:bg-[#16a34a]",
      outline:
        "border border-[rgba(83,44,22,0.15)] bg-white text-[#3b2417] hover:bg-[#fffaf3]",
    };

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseStyles} ${variants[type]}`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </a>
    );
  };

  if (compact) {
    // Compact version for footer/sidebar
    return (
      <div className="rounded-xl border border-[rgba(83,44,22,0.10)] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                          border border-[rgba(212,160,23,0.20)] bg-[rgba(212,160,23,0.08)]">
            <MapPin className="h-3.5 w-3.5 text-[#b76a1f]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[rgba(83,44,22,0.40)]">
              Store Location
            </p>
            <p className="text-sm font-medium text-[#24140f] mt-1">{storeInfo.name}</p>
            <p className="text-xs text-[#6e5443] leading-snug mt-0.5">
              {storeInfo.addressLine3}, {storeInfo.city}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`tel:+91${storeInfo.phoneRaw}`}
            className="text-xs font-medium text-[#b76a1f] hover:text-[#8B5A00] transition-colors"
          >
            Call
          </a>
          <a
            href={`https://wa.me/91${storeInfo.phoneRaw}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#22c55e] hover:text-[#16a34a] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Full version for contact/about pages
  return (
    <div className="rounded-2xl border border-[rgba(83,44,22,0.10)] bg-white p-8 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                          border border-[rgba(212,160,23,0.20)] bg-[rgba(212,160,23,0.08)]">
            <MapPin className="h-5 w-5 text-[#b76a1f]" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[rgba(83,44,22,0.40)]">
              Visit Us
            </p>
            <p className="text-lg font-medium text-[#24140f]">{storeInfo.name}</p>
          </div>
        </div>

        <div className="space-y-1.5 ml-0 text-sm leading-relaxed text-[#6e5443]">
          <p>{storeInfo.address}</p>
          <p>{storeInfo.addressLine2}</p>
          <p>{storeInfo.addressLine3}</p>
          <p className="font-medium text-[#3b2417]">{storeInfo.city}</p>
          <p className="text-xs font-medium text-[#9c6a18]">{storeInfo.postalCode}</p>
        </div>
      </div>

      {/* Contact details */}
      <div className="my-6 border-t border-[rgba(83,44,22,0.07)] pt-6">
        <h4 className="text-sm font-medium text-[#24140f] mb-3">Quick Contact</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-[#b76a1f]" />
            <a
              href={`tel:+91${storeInfo.phoneRaw}`}
              className="text-sm text-[#6e5443] hover:text-[#3b2417] transition-colors"
            >
              {storeInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-[#b76a1f]" />
            <a
              href={`mailto:${storeInfo.email}`}
              className="text-sm text-[#6e5443] hover:text-[#3b2417] transition-colors"
            >
              {storeInfo.email}
            </a>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(83,44,22,0.07)]">
        <ActionButton
          icon={Phone}
          label="Call Now"
          href={`tel:+91${storeInfo.phoneRaw}`}
          type="primary"
        />
        <ActionButton
          icon={MessageSquare}
          label="WhatsApp"
          href={`https://wa.me/91${storeInfo.phoneRaw}`}
          type="success"
        />
        <ActionButton
          icon={Mail}
          label="Email"
          href={`mailto:${storeInfo.email}`}
          type="outline"
        />
        <ActionButton
          icon={ExternalLink}
          label="Open Maps"
          href={storeInfo.mapsUrl}
          type="outline"
        />
      </div>
    </div>
  );
};

export default LocationCard;
