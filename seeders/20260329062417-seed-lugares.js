'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('lugares', [
      { nombre: 'Copoya' },
      { nombre: 'Suchiapa' },
      { nombre: 'Jobo' },
      { nombre: 'Tuxtla' },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lugares', null, {});
  }
};
