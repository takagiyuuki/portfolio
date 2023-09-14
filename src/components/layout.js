import * as React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { useStaticQuery, graphql } from "gatsby"; // delete Link compornent
import * as styles from "../styles/layout.module.scss";
import { Link, Trans, useTranslation } from "gatsby-plugin-react-i18next";

const Layout = ({ pageTitle, children }) => {
  const { t } = useTranslation();

  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.siteTitle}>
          {data.site.siteMetadata.title}
        </Link>
        <nav className={styles.navBar}>
          <ul className={styles.navLink}>
            <li className={styles.navLinkItem}>
              <Link to="/about" className={styles.navLinkItemText}>
                <Trans>About</Trans>
              </Link>
            </li>
            <li className={styles.navLinkItem}>
              <Link to="/contact" className={styles.navLinkItemText}>
                <Trans>Contact</Trans>
              </Link>
            </li>
            <li className={styles.navLinkItem}>
              <a
                href="https://notion-blog-8kd.pages.dev"
                rel="external"
                alt="My Blog"
                className={styles.navLinkItemText}
              >
                <Trans>Blog</Trans>
              </a>
            </li>
            <li className={styles.navLinkItem}>
              <Link to="/services" className={styles.navLinkItemText}>
                Services
              </Link>
            </li>
            <li className={styles.navLinkItem}>
              <Link to="/artwork" className={styles.navLinkItemText}>
                <Trans>Artwork</Trans>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className={styles.main}>
        <h1 className={styles.mainHeading}>{pageTitle}</h1>
        {children}
      </main>
      <footer className={styles.footer}>
        <p className={styles.footerTitle}>© Takagi Yuki</p>
        <a
          href="https://github.com/takagiyuuki"
          target="_blank"
          rel="noreferrer"
          className={styles.footerLogoGithub}
        >
          <StaticImage
            alt="Github Link"
            src="../images/github-mark.svg"
            className={styles.footerLogoGithubBlack}
          />
          <StaticImage
            alt="Github Link"
            src="../images/github-mark-white.svg"
            className={styles.footerLogoGithubWhite}
          />
        </a>
      </footer>
    </div>
  );
};

export default Layout;

export const query = graphql`
  query ($language: String!) {
    locales: allLocale(filter: { language: { eq: $language } }) {
      edges {
        node {
          ns
          data
          language
        }
      }
    }
  }
`;
