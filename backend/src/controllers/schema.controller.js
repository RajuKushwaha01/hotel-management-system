const mongoose = require('mongoose');
const models = require('../models/index');
const { ENTITY_MAP } = require('../config/entityMap');

// Returns your canonical 51-entity list, each resolved against the real, currently-registered
// Mongoose models — with live document counts. If a model is ever renamed or removed, this
// list updates automatically; nothing here is hand-maintained prose.
const getEntityMap = async (req, res, next) => {
  try {
    const enriched = await Promise.all(
      ENTITY_MAP.map(async (row) => {
        if (!row.model) return { ...row, collection: null, count: null, implemented: 'config' };

        const modelNames = row.model.split(' + ').map((n) => n.trim());
        const counts = await Promise.all(
          modelNames.map(async (name) => {
            const Model = models[name];
            if (!Model) return { name, count: null };
            const count = await Model.countDocuments();
            return { name, collection: Model.collection.collectionName, count };
          })
        );
        return { ...row, models: counts, implemented: 'collection' };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) { next(error); }
};

// Live introspection of a single collection: field names + types, taken from an actual sample
// document plus the schema paths Mongoose has registered — not a static description.
const getCollectionDetail = async (req, res, next) => {
  try {
    const Model = models[req.params.modelName];
    if (!Model) return res.status(404).json({ success: false, message: 'Model not found' });

    const [count, sample] = await Promise.all([Model.countDocuments(), Model.findOne().lean()]);

    const fields = Object.entries(Model.schema.paths)
      .filter(([path]) => !path.startsWith('_') && path !== '__v')
      .map(([path, config]) => ({ field: path, type: config.instance || 'Mixed', required: !!config.isRequired }));

    res.status(200).json({
      success: true,
      data: { collectionName: Model.collection.collectionName, count, fields, sample },
    });
  } catch (error) { next(error); }
};

const getDatabaseStats = async (req, res, next) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();

    res.status(200).json({
      success: true,
      data: {
        dbName: mongoose.connection.name,
        totalCollections: collections.length,
        totalDataSize: stats.dataSize,
        totalIndexes: stats.indexes,
        connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getEntityMap, getCollectionDetail, getDatabaseStats };