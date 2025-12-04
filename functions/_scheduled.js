import { handleScheduled } from '../src/cron.js';

// Export scheduled handler for Pages Functions
export const onScheduled = async ({ env }) => {
  await handleScheduled(env);
};

