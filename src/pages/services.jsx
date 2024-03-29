import * as React from "react";
import { Layout } from "../layouts";
import { Seo } from "../components/seo";

const ServicesPage = () => {
  return (
    <Layout pageTitle="Services">
      <p>These Services are developed by me.</p>
    </Layout>
  );
};

export const Head = () => <Seo title="Services" />;

export default ServicesPage;
