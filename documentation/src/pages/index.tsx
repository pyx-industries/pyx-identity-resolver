import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import HeroImage from "@site/static/img/hero.png";

import Layout from "@theme/Layout";
function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="home-hero">
      <div className="home-hero__container">
        <div className="home-hero__content">
          <h1 className="home-hero__title">{siteConfig.title}</h1>
          <p className="home-hero__description">{siteConfig.tagline}</p>
          <div className="home-hero__actions">
            <Link
              className="button button--primary button--lg"
              to={"/docs/getting-started/"}
            >
              Get Started
            </Link>
          </div>
        </div>
        <div className="home-hero__image-wrapper rad-10">
          <img
            src={HeroImage}
            className="home-hero__image"
            alt="Pyx Identity Resolver Image"
          />
        </div>
      </div>
    </header>
  );
}
export default function Home() {
  return (
    <Layout>
      <main className="homepage-content">
        <HomepageHero />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
