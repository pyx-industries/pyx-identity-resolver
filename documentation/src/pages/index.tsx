import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import IDRBanner from '@site/static/img/IDR_banner.png';

import Layout from '@theme/Layout';
function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className='home-hero'>
      <div className='home-hero__container'>
        <div className='home-hero__content'>
          <h1 className='home-hero__title'>Identity Resolver</h1>
          <p className='home-hero__description'>{siteConfig.tagline}</p>
          <div className='home-hero__actions'>
            <Link
              className='button button--primary button--lg'
              to={'/docs/getting-started/'}
            >
              Get Started
            </Link>
          </div>
        </div>
        <div className='home-hero__image-wrapper rad-10'>
          <img
            src={IDRBanner}
            className='home-hero__image'
            alt='UN Identity Resolver Image'
          />
        </div>
      </div>
    </header>
  );
}
export default function Home() {
  return (
    <Layout
      title='UN Identity Resolver'
      description='UN Identity Resolver is a service that enables value chain actors to access additional information linked to identifiers across various identifier schemes.'
    >
      <main className='homepage-content'>
        <HomepageHero />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
