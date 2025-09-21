// Import required Node.js modules
const fs = require('fs');                  // File system module for reading/writing files
const { create } = require('xmlbuilder2'); // XML builder library to create XML documents

// Set the base URL for your website
const baseUrl = 'https://imagefragmenter.app';
// Add your routes here eg /about, /services, /portfolio, etc.
const routes = [
    '/', // Currently only includes the homepage
    '/privacy',
    '/support',
    '/support/thank-you'
];

// Create a new XML document with the sitemap namespace
// This creates the root <urlset> element with proper XML declaration
const urlset = create({ version: '1.0' }).ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

// Loop through each route and add it to the sitemap
routes.forEach(route => {
    // Create a new <url> element for each route
    const url = urlset.ele('url');
    
    // Add the full URL (base + route) as the <loc> element
    url.ele('loc').txt(baseUrl + route);
    
    // Add the current date/time as the <lastmod> element in ISO format
    url.ele('lastmod').txt(new Date().toISOString());
    
    // Note: You could also add optional elements like:
    // - <changefreq>: how often the page changes (daily, weekly, monthly)
    // - <priority>: importance of this URL relative to other URLs (0.0 to 1.0)
});

// Convert the XML object to a formatted string
const xml = urlset.end({ prettyPrint: true });

// Write the XML to the sitemap.xml file in the public directory
fs.writeFileSync('../../public/sitemap.xml', xml);

// Log a success message to the console
console.log('Sitemap generated successfully!');