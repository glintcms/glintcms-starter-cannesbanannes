exports.identifier = 'page-main';

exports.id = 'main';

exports.route = /^\/$/;

exports.place = process.env.GLINT_PLACE || 'force:server';

exports.triggerKeyboard = {
  load: [],
  edit: ['f2', 'ctrl u', 'meta enter', 'ctrl enter', 'meta e', 'ctrl e'],
  save: ['f8', 'meta s', 'ctrl s'],
  cancel: ['escape', 'ctrl q'],
  delete: []
};

exports.triggerSidenav = {
  load: '.sidenav-load',
  edit: '.sidenav-edit',
  save: '.sidenav-save',
  cancel: '.sidenav-cancel',
  copy: '.not-here',
  rename: '.not-here',
  'delete': '.not-here'
};