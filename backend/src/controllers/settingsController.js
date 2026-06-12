const { SystemSetting } = require('../models');

exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findAll();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings array is required' });
    }

    const promises = settings.map(async (setting) => {
      const { key, value, category, type } = setting;
      
      const valueStr = typeof value === 'boolean' || typeof value === 'number' 
        ? String(value) 
        : (value || '');

      const [record, created] = await SystemSetting.findOrCreate({
        where: { key },
        defaults: { value: valueStr, category, type }
      });

      if (!created) {
        await record.update({ value: valueStr, category, type });
      }
    });

    await Promise.all(promises);

    const updatedSettings = await SystemSetting.findAll();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};
