const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    // No enviar passwords en la respuesta
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No enviar password en la respuesta
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    
    // No enviar password en la respuesta
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const updated = await User.update(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No enviar password en la respuesta
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Obtener usuarios por rol
router.get('/role/:role', async (req, res) => {
  try {
    const users = await User.findAll();
    const roleUsers = users.filter(u => u.role === req.params.role);
    
    // No enviar passwords en la respuesta
    const usersWithoutPassword = roleUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    res.status(500).json({ error: 'Error al obtener usuarios por rol' });
  }
});

// Actualizar estado del usuario
router.patch('/:id/status', async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findById(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = await User.update(parseInt(req.params.id), { active });
    
    // No enviar password en la respuesta
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;