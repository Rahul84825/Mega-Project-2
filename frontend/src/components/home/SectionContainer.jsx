function SectionContainer({
  as: Tag = "section",
  className = "",
  containerClassName = "",
  children
}) {
  const resolvedContainerClassName = containerClassName || "px-4 sm:px-6 lg:px-8";

  return (
    <Tag className={className}>
      <div className={`mx-auto max-w-7xl ${resolvedContainerClassName}`.trim()}>
        {children}
      </div>
    </Tag>
  );
}

export default SectionContainer;