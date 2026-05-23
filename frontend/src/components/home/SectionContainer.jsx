function SectionContainer({
  as: Tag = "section",
  className = "",
  containerClassName = "",
  children
}) {
  const resolvedContainerClassName = containerClassName || "px-4 sm:px-6 lg:px-10";

  return (
    <Tag className={className}>
      <div className={`mx-auto max-w-[1440px] ${resolvedContainerClassName}`.trim()}>
        {children}
      </div>
    </Tag>
  );
}

export default SectionContainer;