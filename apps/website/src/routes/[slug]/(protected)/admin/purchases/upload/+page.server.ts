import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { shop } = await parent();
  
  return {
    shop,
  };
};
