// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Middleware de autenticación (ajustar según tu implementación)
const authMiddleware = (req, res, next) => {
  // Simulación básica - reemplazar con tu middleware real
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }
  
  // Simular usuario autenticado
  req.user = { id: 1, email: 'demo@itobox.com' };
  next();
};

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JPG, PNG o PDF'));
    }
  }
});

// Ruta: Confirmar pago SINPE Móvil
router.post('/confirm-sinpe', authMiddleware, (req, res) => {
  try {
    const { invoiceId, amount, transactionReference, paymentReference } = req.body;

    if (!invoiceId || !amount || !transactionReference || !paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // Simular guardado en base de datos
    const paymentData = {
      invoice_id: invoiceId,
      amount: amount,
      payment_method: 'sinpe_movil',
      transaction_reference: transactionReference,
      payment_reference: paymentReference,
      status: 'pending_verification',
      user_id: req.user.id,
      created_at: new Date()
    };

    console.log('Saving SINPE payment:', paymentData);

    res.json({
      success: true,
      message: 'Pago SINPE registrado exitosamente',
      paymentId: `sinpe_${Date.now()}`,
      status: 'pending_verification'
    });

  } catch (error) {
    console.error('Error confirming SINPE payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta: Confirmar pago PayPal
router.post('/confirm-paypal', authMiddleware, (req, res) => {
  try {
    const { orderID, paymentID, invoiceId, amount, currency } = req.body;

    if (!orderID || !paymentID || !invoiceId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Datos de PayPal incompletos'
      });
    }

    const paymentData = {
      invoice_id: invoiceId,
      amount: amount,
      currency: currency || 'USD',
      payment_method: 'paypal',
      paypal_order_id: orderID,
      paypal_payment_id: paymentID,
      status: 'completed',
      user_id: req.user.id,
      created_at: new Date()
    };

    console.log('Saving PayPal payment:', paymentData);

    res.json({
      success: true,
      message: 'Pago PayPal confirmado exitosamente',
      paymentId: paymentID,
      status: 'completed'
    });

  } catch (error) {
    console.error('Error confirming PayPal payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta: Confirmar transferencia bancaria
router.post('/confirm-bank-transfer', authMiddleware, upload.single('transferReceipt'), (req, res) => {
  try {
    const { invoiceId, amount, transferReference, paymentReference } = req.body;
    const receiptFile = req.file;

    if (!invoiceId || !amount || !transferReference || !paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    const paymentData = {
      invoice_id: invoiceId,
      amount: amount,
      payment_method: 'bank_transfer',
      transfer_reference: transferReference,
      payment_reference: paymentReference,
      receipt_file: receiptFile ? receiptFile.filename : null,
      status: 'pending_verification',
      user_id: req.user.id,
      created_at: new Date()
    };

    console.log('Saving bank transfer payment:', paymentData);

    res.json({
      success: true,
      message: 'Transferencia bancaria registrada exitosamente',
      paymentId: `bank_${Date.now()}`,
      status: 'pending_verification',
      receiptUploaded: !!receiptFile
    });

  } catch (error) {
    console.error('Error confirming bank transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta: Obtener métodos de pago disponibles
router.get('/payment-methods', (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'sinpe',
        name: 'SINPE Móvil',
        description: 'Pago inmediato desde tu banco',
        enabled: true,
        recommended: true,
        currency: 'CRC'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Tarjetas internacionales y PayPal',
        enabled: true,
        recommended: false,
        currency: 'USD'
      },
      {
        id: 'bank_transfer',
        name: 'Transferencia Bancaria',
        description: 'Pago tradicional 1-2 días',
        enabled: true,
        recommended: false,
        currency: 'CRC'
      }
    ]
  });
});

// Ruta: Verificar estado de pago
router.get('/payment-status/:paymentId', authMiddleware, (req, res) => {
  try {
    const { paymentId } = req.params;

    // Simulación de búsqueda
    const payment = {
      id: paymentId,
      status: 'pending_verification',
      method: 'sinpe_movil',
      amount: 50000,
      created_at: new Date()
    };

    res.json({
      success: true,
      payment: payment
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de pago funcionando correctamente',
    timestamp: new Date(),
    endpoints: [
      'POST /confirm-sinpe',
      'POST /confirm-paypal', 
      'POST /confirm-bank-transfer',
      'GET /payment-methods',
      'GET /payment-status/:id'
    ]
  });
});

module.exports = router;