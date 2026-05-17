const HomeSection = ({
  title,
  subtitle,
  children,
  className = "",
  contentClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 justify-items-center"
}) => {
  return (
    <section className={`py-6 md:py-10 bg-[var(--cream)] ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-4 md:mb-6 text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-lg">
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
