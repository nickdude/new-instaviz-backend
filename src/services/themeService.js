const fetch = require('node-fetch');

const THEMES_API_URL = 'https://dev.anurcloud.com/dvc/api/v1/themes';
const API_KEY = 'instaviz_uat_1234';

// Get all themes for a specific template
const getThemesByTemplateId = async (templateId) => {
  try {
    const response = await fetch(`${THEMES_API_URL}?template_id=${templateId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch themes');
    }

    return data;
  } catch (error) {
    throw new Error(`Theme service error: ${error.message}`);
  }
};

module.exports = {
  getThemesByTemplateId,
};
