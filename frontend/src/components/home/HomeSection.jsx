/**
 * HomeSection - Reusable wrapper for all homepage sections
 * 
 * Ensures consistent structure, spacing, and alignment across all homepage components.
 * This component should ONLY be used for homepage sections, not for:
 * - Product Detail pages
 * - Similar Products section
 * - Cart or Checkout
 * - Admin panels
 * 
 * Usage:
 * <HomeSection title="New Arrivals" subtitle="Fresh products">
 *   <div>Your content here</div>
 * </HomeSection>
 */

const HomeSection = ({
  title,
  subtitle,
  children,
  className = "",
  contentClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
}) => {
  return (
    <section className={`py-10 md:py-14 bg-[var(--cream)] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content Container */}
        <div className={contentClassName}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default HomeSection;
