import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Identifier scheme management',
    Svg: require('@site/static/img/identifier_schema.svg').default,
    description: (
      <>
        Registering and configuring permitted identifier schemes for link
        registration.
      </>
    ),
  },
  {
    title: 'Link registration and management',
    Svg: require('@site/static/img/link_registration.svg').default,
    description: (
      <>
        Allowing registry operators or identifier owners to add and update links
        to product information.
      </>
    ),
  },
  {
    title: 'Link resolution',
    Svg: require('@site/static/img/link_resolution.svg').default,
    description: (
      <>
        Enabling value chain actors to access additional information linked to
        identifiers across various identifier schemes.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className='text--center'>
        <Svg className={styles.featureSvg} role='img' />
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
