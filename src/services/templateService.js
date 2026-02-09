const fetch = require('node-fetch');

const TEMPLATES_API_URL = 'https://dev.anurcloud.com/dvc/api/v1/templates';
const API_KEY = 'instaviz_uat_1234';

// Get all templates from external API
const getTemplates = async () => {
  try {
    const response = await fetch(TEMPLATES_API_URL, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch templates');
    }

    return data;
  } catch (error) {
    throw new Error(`Template service error: ${error.message}`);
  }
};

module.exports = {
  getTemplates,
};
