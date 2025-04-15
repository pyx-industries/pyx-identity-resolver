import Heading from "@theme/Heading";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Identifier scheme management",
    image: require("@site/static/img/feature-1.png").default,
    description: (
      <>
        Registering and configuring identifier schemes for link registration and
        resolution.
      </>
    ),
  },
  {
    title: "Link registration and management",
    image: require("@site/static/img/feature-2.png").default,
    description: (
      <>
        Allowing registry operators or identifier owners to add and update links
        to product information.
      </>
    ),
  },
  {
    title: "Link resolution",
    image: require("@site/static/img/feature-3.png").default,
    description: (
      <>
        Enabling value chain actors to access additional information associated
        with identifiers across various identifier schemes.
      </>
    ),
  },
];

function Feature({ title, image, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img className={styles.featureImage} src={image} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
