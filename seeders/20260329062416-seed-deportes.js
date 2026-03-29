'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('deportes', [
      { nombreDeporte: 'Futbol', createdAt: new Date(), updatedAt: new Date() },
      { nombreDeporte: 'Basquetbol', createdAt: new Date(), updatedAt: new Date() },
      { nombreDeporte: 'Beisbol', createdAt: new Date(), updatedAt: new Date() },
      { nombreDeporte: 'Voleibol', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('deportes', null, {});
  }
};
