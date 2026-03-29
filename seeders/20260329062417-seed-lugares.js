'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('lugares', [
      { nombre: 'Copoya', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Suchiapa', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Jobo', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Tuxtla', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lugares', null, {});
  }
};
