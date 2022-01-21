const Path = require('path');

module.exports = {
  public: Path.join(__dirname, '../../public/'),
  view: Path.join(__dirname, '../app/views/'),
  layout: Path.join(__dirname, '../app/views/layouts/'),
  partial: Path.join(__dirname, '../app/views/partials/'),
};
