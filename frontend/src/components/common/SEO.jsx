import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords,
  canonical, 
  ogType = 'website', 
  ogImage = 'https://mithaipune.com/og-image.png',
  schemaData 
}) => {
  const siteName = 'Mithai World';
  const fullTitle = title 
    ? (title.includes(siteName) ? title : `${title} | ${siteName}`)
    : 'Mithai World | Best Authentic Indian Sweets in Viman Nagar, Pune';
  
  const cleanCanonical = canonical 
    ? (canonical.startsWith('/') ? canonical : `/${canonical}`) 
    : '';
  const url = `https://mithaipune.com${cleanCanonical}`;

  const defaultDescription = description || "Order authentic Indian sweets, dry fruit mithai, and festive gift boxes online from Mithai World, Viman Nagar, Pune. Freshly handcrafted daily.";

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Favicon references inside Helmet for dynamic routing reassurance */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.webmanifest" />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={defaultDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={defaultDescription} />
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
