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
    title: "Set up your identifiers",
    image: require("@site/static/img/feature-1.png").default,
    description: (
      <>
        Define which identifier schemes your resolver supports, from product
        barcodes to business numbers.
      </>
    ),
  },
  {
    title: "Register links",
    image: require("@site/static/img/feature-2.png").default,
    description: (
      <>
        Connect identifiers to the information that matters: sustainability
        reports, product data, certifications.
      </>
    ),
  },
  {
    title: "Resolve anything",
    image: require("@site/static/img/feature-3.png").default,
    description: (
      <>
        Anyone with an identifier can find the information they need, no account
        required.
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
