'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('deportes', [
      { nombreDeporte: 'Futbol' },
      { nombreDeporte: 'Basquetbol' },
      { nombreDeporte: 'Beisbol' },
      { nombreDeporte: 'Voleibol' },
    ], {
      ignoreDuplicates: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('deportes', null, {});
  }
};
