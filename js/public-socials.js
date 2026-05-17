const socialLinkElements = document.querySelectorAll("[data-social-link]");

async function hydratePublicSocialLinks() {
  if (!socialLinkElements.length) {
    return;
  }

  try {
    const response = await fetch("/api/public-config");
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error("Impossible de charger la configuration publique.");
    }

    const socialLinks = payload.data?.socialLinks || {};

    socialLinkElements.forEach((link) => {
      const socialName = link.dataset.socialLink;
      const href = socialLinks[socialName];

      if (!href) {
        link.hidden = true;
        return;
      }

      link.href = href;
      link.hidden = false;
    });
  } catch (error) {
    console.error(error);
  }
}

hydratePublicSocialLinks();
