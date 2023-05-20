module.exports = {
  apps: [
    {
      name: 'kbo-bot',
      script: 'npm',
      args: 'start',
      watch: true,
      ignore_watch: ['node_modules'],
    },
  ],
};
