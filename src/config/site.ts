const author = 'Yuki Takagi';

export const site = {
  name: author,
  tagline: 'Infrastructure Engineer',
  description: 'Projects, repositories, and activity.',
  author,
  social: {
    github: 'https://github.com/takagiyuuki',
    linkedin: 'https://www.linkedin.com/in/takagiyuuki/',
  },
} as const;
