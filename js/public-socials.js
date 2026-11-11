const socialLinkElements = document.querySelectorAll("[data-social-link]");

const fallbackSocialLinks = {
  whatsapp: "https://wa.me/50944795902",
  instagram: "https://instagram.com/qrcodev",
  facebook: "https://facebook.com/qrcodev",
  tiktok: "https://tiktok.com/@qrcodev"
};

function applySocialLinks(sourceLinks = {}) {
  socialLinkElements.forEach((link) => {
    const socialName = link.dataset.socialLink;
    const href = sourceLinks[socialName];

    if (!href) {
      link.hidden = true;
      return;
    }

    link.href = href;
    link.hidden = false;
  });
}

async function hydratePublicSocialLinks() {
  if (!socialLinkElements.length) {
    return;
  }

  // Always show usable fallback links first, especially on static hosts like Netlify.
  applySocialLinks(fallbackSocialLinks);

  try {
    const response = await fetch("/api/public-config");
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error("Impossible de charger la configuration publique.");
    }

    const socialLinks = payload.data?.socialLinks || {};
    applySocialLinks({ ...fallbackSocialLinks, ...socialLinks });
  } catch (error) {
    console.warn("Configuration publique indisponible, utilisation des liens de secours.", error);
  }
}

hydratePublicSocialLinks();
