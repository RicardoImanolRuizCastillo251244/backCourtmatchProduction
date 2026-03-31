'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Partido } = require('../models/index');
const logger = require('../utils/logger');

// Duración fija de un partido en minutos
const DURACION_PARTIDO_MINUTOS = 40;

/**
 * Construye un Date local a partir de los campos `fecha` (DATEONLY "YYYY-MM-DD")
 * y `hora` (TIME "HH:MM:SS") del modelo Partido, sin desplazamientos UTC.
 *
 * @param {string} fecha - "2026-03-31"
 * @param {string} hora  - "18:30:00"
 * @returns {Date}
 */
function buildLocalDate(fecha, hora) {
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  const [horas, minutos, segundos = 0] = String(hora).split(':').map(Number);
  return new Date(anio, mes - 1, dia, horas, minutos, segundos, 0);
}

/**
 * Suma minutos a un Date y devuelve un nuevo Date.
 *
 * @param {Date}   date
 * @param {number} minutes
 * @returns {Date}
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Ejecuta la transición programado → en_curso para partidos cuya
 * fecha+hora de inicio ya haya llegado.
 *
 * @param {import('socket.io').Server} io
 */
async function procesarInicios(io) {
  const ahora = new Date();

  // Traer sólo los campos estrictamente necesarios para minimizar tráfico de BD
  const partidos = await Partido.findAll({
    attributes: ['idMatch', 'fecha', 'hora'],
    where: { estado: 'programado' },
  });

  const aIniciar = partidos.filter((p) => {
    const inicio = buildLocalDate(p.fecha, p.hora);
    return inicio <= ahora;
  });

  if (aIniciar.length === 0) return;

  const ids = aIniciar.map((p) => p.idMatch);

  await Partido.update(
    { estado: 'en_curso' },
    { where: { idMatch: { [Op.in]: ids }, estado: 'programado' } },
  );

  logger.info(`[Scheduler] ${ids.length} partido(s) iniciado(s): [${ids.join(', ')}]`);

  // Notificar en tiempo real
  ids.forEach((idMatch) => {
    io.to(`partido_${idMatch}`).emit('partidoEnCurso', {
      idMatch,
      estado: 'en_curso',
      mensaje: 'El partido ha comenzado',
    });
  });

  // Fallback global para vistas de listado que no estén suscritas a sala específica.
  io.emit('partidosEstadoActualizado', {
    idsMatch: ids,
    estado: 'en_curso',
    timestamp: new Date(),
  });
}

/**
 * Ejecuta la transición en_curso → finalizado para partidos cuya
 * fecha+hora+DURACION ya haya pasado.
 *
 * @param {import('socket.io').Server} io
 */
async function procesarFinalizaciones(io) {
  const ahora = new Date();

  const partidos = await Partido.findAll({
    attributes: ['idMatch', 'fecha', 'hora'],
    where: { estado: 'en_curso' },
  });

  const aFinalizar = partidos.filter((p) => {
    const fin = addMinutes(buildLocalDate(p.fecha, p.hora), DURACION_PARTIDO_MINUTOS);
    return fin <= ahora;
  });

  if (aFinalizar.length === 0) return;

  const ids = aFinalizar.map((p) => p.idMatch);

  await Partido.update(
    { estado: 'finalizado' },
    { where: { idMatch: { [Op.in]: ids }, estado: 'en_curso' } },
  );

  logger.info(`[Scheduler] ${ids.length} partido(s) finalizado(s): [${ids.join(', ')}]`);

  // Notificar en tiempo real
  ids.forEach((idMatch) => {
    io.to(`partido_${idMatch}`).emit('partidoFinalizado', {
      idMatch,
      estado: 'finalizado',
      mensaje: 'El partido ha finalizado',
    });
  });

  // Fallback global para vistas de listado que no estén suscritas a sala específica.
  io.emit('partidosEstadoActualizado', {
    idsMatch: ids,
    estado: 'finalizado',
    timestamp: new Date(),
  });
}

/**
 * Tick principal del scheduler: se ejecuta cada minuto.
 * Atrapa sus propios errores para no crashear el proceso.
 *
 * @param {import('socket.io').Server} io
 */
async function tick(io) {
  try {
    await procesarInicios(io);
    await procesarFinalizaciones(io);
  } catch (error) {
    logger.error(`[Scheduler] Error en tick: ${error.message}`);
  }
}

/**
 * Registra el cron job e inmediatamente hace un primer tick para
 * recuperar partidos que pudieron haber quedado atrasados durante
 * un reinicio del servidor.
 *
 * Expresión cron: cada minuto en punto.
 *
 * @param {import('socket.io').Server} io
 */
function iniciarScheduler(io) {
  // Primer tick inmediato al arrancar (catch-up tras reinicio)
  tick(io);

  cron.schedule('* * * * *', () => tick(io), {
    timezone: process.env.TZ || 'America/Mexico_City',
  });

  logger.info('[Scheduler] Job de transiciones de partido iniciado (cada 1 min)');
}

module.exports = { iniciarScheduler };
