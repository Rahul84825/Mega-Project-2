import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  canonical, 
  ogType = 'website', 
  ogImage = 'https://mithaipune.com/favicon.png',
  schemaData 
}) => {
  const siteName = 'Mithai World';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const url = canonical ? `https://mithaipune.com${canonical}` : 'https://mithaipune.com';

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      <meta name="robots" content="index, follow" />

      {/* Structured Data */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
