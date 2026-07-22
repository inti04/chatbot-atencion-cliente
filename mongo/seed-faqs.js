// Ejecutar con: mongosh "mongodb://admin:changeme@localhost:27017/chatbot_atencion_cliente?authSource=admin" mongo/seed-faqs.js
// (ajustar usuario/password si se cambiaron en .env)

db = db.getSiblingDB("chatbot_atencion_cliente");

db.faqs.deleteMany({});
db.conversations.deleteMany({});

db.faqs.insertMany([
  {
    category: "horarios",
    keywords: ["horario", "hora", "horas", "abren", "abierto", "cierran", "cierre"],
    question: "¿Cuál es el horario de atención?",
    answer: "Atendemos de lunes a sábado de 9:00am a 7:00pm. Domingos cerrado.",
    active: true,
  },
  {
    category: "horarios",
    keywords: ["feriado", "festivo", "domingo"],
    question: "¿Abren los domingos o feriados?",
    answer: "No abrimos domingos ni días feriados.",
    active: true,
  },
  {
    category: "precios",
    keywords: ["precio", "precios", "costo", "cuesta", "cuanto", "vale", "tarifa"],
    question: "¿Cuáles son los precios?",
    answer: "Nuestros precios varían según el servicio, desde $10.000 hasta $50.000. Escríbenos qué servicio te interesa y te damos el precio exacto.",
    active: true,
  },
  {
    category: "precios",
    keywords: ["descuento", "promocion", "promo", "oferta"],
    question: "¿Tienen descuentos o promociones?",
    answer: "Sí, tenemos promociones vigentes cada mes. Pregúntanos por la promo actual.",
    active: true,
  },
  {
    category: "disponibilidad",
    keywords: ["disponible", "disponibilidad", "turno", "cita", "reservar", "reserva", "agendar"],
    question: "¿Hay disponibilidad para agendar una cita?",
    answer: "Sí, tenemos disponibilidad esta semana. Dinos qué día y hora prefieres y te confirmamos.",
    active: true,
  },
  {
    category: "disponibilidad",
    keywords: ["stock", "hay", "queda", "quedan"],
    question: "¿Tienen stock disponible?",
    answer: "Sí, tenemos stock disponible. Cuéntanos qué producto necesitas para confirmarte la cantidad.",
    active: true,
  },
  {
    category: "otros",
    keywords: ["direccion", "ubicacion", "ubicados", "donde", "queda"],
    question: "¿Dónde están ubicados?",
    answer: "Estamos ubicados en el centro de la ciudad. Te enviamos la ubicación exacta por este chat.",
    active: true,
  },
  {
    category: "otros",
    keywords: ["pago", "pagar", "efectivo", "tarjeta", "transferencia"],
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos efectivo, tarjeta y transferencia bancaria.",
    active: true,
  },
]);

db.faqs.createIndex({ keywords: 1 });
db.faqs.createIndex({ active: 1 });

db.conversations.createIndex({ chat_id: 1 });
db.conversations.createIndex({ status: 1 });
db.conversations.createIndex({ timestamp: -1 });

print("Seed completo: " + db.faqs.countDocuments() + " FAQs insertadas.");
