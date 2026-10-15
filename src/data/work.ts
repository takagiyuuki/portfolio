import { site } from '@/config/site';

type HttpsUrl = `https://${string}`;

export interface WorkEntry {
  title: string;
  description: string;
  tech: readonly [string, ...string[]];
  repo: HttpsUrl;
  live?: HttpsUrl;
  article?: HttpsUrl;
}

const github = site.social.github;

/** Display order is array order. */
export const work: readonly [WorkEntry, ...WorkEntry[]] = [
  {
    title: 'yukit.dev',
    description: 'My portfolio site.',
    tech: ['Astro', 'TypeScript', 'Cloudflare Workers', 'Terraform', 'GitHub Actions'],
    repo: `${github}/portfolio`,
    live: 'https://yukit.dev',
  },
  {
    title: 'dotfiles',
    description: 'My dotfiles.',
    tech: ['Nix', 'Home Manager', 'NixOS-WSL', 'Neovim', 'GitHub Actions'],
    repo: `${github}/dotfiles`,
  },
];
