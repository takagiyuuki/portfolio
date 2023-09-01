import * as React from "react";
import Layout from "../components/layout";
import { StaticImage } from "gatsby-plugin-image";
import { Seo } from "../components/seo";
import { bodyImage, bodyText, bodyFlex } from "../styles/homepage.module.scss";

const IndexPage = () => {
  return (
    <Layout pageTitle="Home Page">
      <p>I'm making this by following the Gatsby Tutorial.</p>
      <div className={bodyFlex}>
        <StaticImage
          alt="Clifford, a reddish-brown pitbull, posing on a couch and looking stoically at the camera"
          src="https://pbs.twimg.com/media/E1oMV3QVgAIr1NT?format=jpg&name=large"
          className={bodyImage}
        />
        <div className={bodyText}>
          <h2>Hi! I'm Yuki</h2>
          <p>Welcome My branding site.</p>
          <p>This website is my branding pages.</p>
        </div>
      </div>
    </Layout>
  );
};

export const Head = () => <Seo title="Home Page" />;

export default IndexPage;
