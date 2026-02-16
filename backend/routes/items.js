const express = require('express');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

// Alle Items abrufen (Query: excludeDummy=1 nur echte Items, dummyOnly=1 nur Vorlagen)
router.get('/', auth, async (req, res) => {
  try {
    const excludeDummy = req.query.excludeDummy === '1' || req.query.excludeDummy === 'true';
    const dummyOnly = req.query.dummyOnly === '1' || req.query.dummyOnly === 'true';
    let query = {};
    if (excludeDummy) query.isDummy = { $ne: true };
    if (dummyOnly) query.isDummy = true;
    const sort = dummyOnly
      ? { displayId: 1, name: 1 }
      : { isDummy: 1, name: 1 };
    let items = await Item.find(query).sort(sort);
    if (dummyOnly && items.length > 0) {
      const needId = items.filter((i) => i.displayId == null || i.displayId < 800);
      if (needId.length > 0) {
        const maxId = Math.max(799, ...items.map((i) => (i.displayId >= 800 ? i.displayId : 799)));
        let nextId = maxId + 1;
        for (const item of needId) {
          item.displayId = nextId++;
          await item.save();
        }
        items = await Item.find(query).sort(sort);
      }
    }
    res.json(items);
  } catch (error) {
    console.error('Fehler beim Abrufen der Items:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Items.' });
  }
});

// Einzelnes Item abrufen
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item nicht gefunden.' });
    }
    res.json(item);
  } catch (error) {
    console.error('Fehler beim Abrufen des Items:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Items.' });
  }
});

// Neues Item erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, quantity, price, category, isDummy, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name ist erforderlich.' });
    }

    const isDummyItem = isDummy === true;
    let displayId = null;
    if (isDummyItem) {
      const maxDummy = await Item.findOne({ isDummy: true }).sort({ displayId: -1 }).select('displayId').lean();
      displayId = (maxDummy && maxDummy.displayId != null && maxDummy.displayId >= 800)
        ? maxDummy.displayId + 1
        : 800;
    }
    const item = new Item({
      name,
      description: description || '',
      quantity: isDummyItem ? 0 : (quantity !== undefined ? quantity : 0),
      price: price !== undefined ? price : undefined,
      category: category || '',
      isDummy: isDummyItem,
      displayId: isDummyItem ? displayId : null,
      image: image || ''
    });

    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Fehler beim Erstellen des Items:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Items.' });
  }
});

// Item aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, quantity, price, category, isDummy, image } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item nicht gefunden.' });
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (quantity !== undefined && !item.isDummy) item.quantity = quantity;
    if (price !== undefined) item.price = price;
    if (category !== undefined) item.category = category;
    if (isDummy !== undefined) item.isDummy = isDummy;
    if (image !== undefined) item.image = image;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Items:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Items.' });
  }
});

// Item löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item nicht gefunden.' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen des Items:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Items.' });
  }
});

module.exports = router;

