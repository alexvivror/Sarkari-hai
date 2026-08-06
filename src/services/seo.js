/* ============================================================
   services/seo.js — SEO metadata generation
   Title, meta description, canonical, Open Graph, Twitter Cards,
   JSON-LD (WebSite, JobPosting, FAQPage, BreadcrumbList),
   sitemap.xml, robots.txt
   ============================================================ */
"use strict";

const { esc } = require("../lib/utils");

function pageShell({ title, metaDesc, canonical, body, schema = [], SITE }) {
  const ogTitle = esc(title);
  const ogDesc = esc(metaDesc);
  const schemas = schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE)}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDesc}">
  <meta name="theme-color" content="#f97316">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icon.svg" type="image/svg+xml">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  ${schemas}
</head>
<body>
  ${body}
</body>
</html>`;
}

/* WebSite schema with SearchAction */
function websiteSchema(SITE, DOMAIN) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE,
    url: DOMAIN,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DOMAIN}/search.html?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/* JobPosting schema for recruitment posts */
function jobPostingSchema(p, DOMAIN, examLabel) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: p.title,
    datePosted: p.date,
    url: `${DOMAIN}/posts/${p.id}.html`,
    description: p.desc,
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: examLabel || p.org || "Government of India" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "IN" } },
    ...(p.qualification ? { qualifications: p.qualification } : {}),
    ...(p.salary ? { baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", value: p.salary.replace(/[^\d]/g, "") || undefined } } } : {}),
  };
}

/* FAQPage schema */
function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqs || []).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/* BreadcrumbList schema */
function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/* XML sitemap */
function sitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
}

/* robots.txt */
function robotsTxt(DOMAIN) {
  return `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`;
}

module.exports = {
  pageShell, websiteSchema, jobPostingSchema, faqSchema, breadcrumbSchema, sitemapXml, robotsTxt,
};
